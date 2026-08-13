# Prompt — Servir des images stockées dans un dépôt Git via un proxy HTTP

> **Usage** : copiez ce document entier à un assistant IA travaillant sur votre projet.
> Il décrit une solution éprouvée en production, ses pièges, et les tests qui prouvent qu'elle fonctionne.

---

## 0. Avant de commencer : est-ce la bonne solution pour vous ?

**Répondez d'abord à cette question — elle change tout.**

| Votre situation | Solution recommandée |
|---|---|
| Site **statique / SSG** (portfolio, blog, docs) construit à intervalles réguliers | **Récupération au build.** Téléchargez les images pendant le build, écrivez-les dans le dossier public, laissez votre bundler les optimiser. Pas de proxy, pas de cache runtime, pas de dépendance au jeton Git en production. |
| Application **dynamique** où le contenu change sans redéploiement (CMS, back-office, aperçu en temps réel) | **Ce proxy.** C'est ce que le présent document décrit. |
| Dépôt **public** et images accessibles sans authentification | Servez directement depuis un CDN Git (`raw.githubusercontent.com`, jsDelivr). Un proxy n'apporte rien. |

**Si vous êtes dans le premier cas, n'implémentez pas ce proxy.** Il ajoute un cache à gérer, une dépendance native, et un point de défaillance en production, pour résoudre un problème que le build résout gratuitement. La section 9 décrit l'approche build-time.

Ce document reste utile dans tous les cas : les pièges des sections 3 et 7 s'appliquent aussi à une récupération au build.

---

## 1. Le problème à résoudre

Des images sont stockées dans un dépôt Git privé. L'application doit les afficher.

**L'approche naïve** — et c'est celle qu'un assistant IA propose spontanément — consiste à lire chaque fichier côté serveur, l'encoder en base64, et l'injecter dans le HTML :

```html
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..." />
```

Cela fonctionne en démonstration et s'effondre en usage réel. Mesures relevées sur une galerie de 39 images (30,9 Mo de fichiers) :

| | Data URLs | Proxy HTTP |
|---|---|---|
| Poids du document HTML | **42,3 Mo** | **421 Ko** |
| Mise en cache navigateur | **impossible** | oui |
| Chargement différé (`lazy`) | **inopérant** | oui |
| Rechargement de page | **42 Mo à nouveau** | **0 octet** |

Quatre défauts structurels :

1. **Le base64 gonfle de ~33 %.** 30,9 Mo de fichiers deviennent 42,3 Mo dans le document.
2. **Aucune mise en cache.** Une data URL fait partie du HTML : le navigateur ne peut pas la stocker séparément. Chaque navigation retélécharge tout.
3. **`loading="lazy"` devient inopérant.** Les octets sont déjà dans le document ; il n'y a plus rien à différer.
4. **Le rendu est bloqué.** Le HTML doit être intégralement transféré et analysé avant le premier pixel.

**L'objectif** : remplacer les data URLs par de vraies URL, servies par une route qui lit le dépôt, met en cache, et se comporte comme un serveur d'images correct.

---

## 2. Architecture cible

```
Navigateur                    Votre serveur                      API Git
    │                              │                                │
    │  GET /api/media?file=x.png   │                                │
    ├─────────────────────────────►│                                │
    │                              │ 1. valider le nom de fichier   │
    │                              │ 2. cache mémoire ? ──► servir  │
    │                              │ 3. cache disque ?  ──► servir  │
    │                              │ 4. requête déjà en vol ? ──► s'y joindre
    │                              │ 5. sinon, lire depuis Git      │
    │                              ├───────────────────────────────►│
    │                              │◄───────────────────────────────┤
    │                              │ 6. (option) redimensionner     │
    │                              │ 7. écrire en cache             │
    │  200 image/webp + ETag       │                                │
    │◄─────────────────────────────┤                                │
```

Trois composants :

| Composant | Rôle |
|---|---|
| **Route HTTP** | Valide l'entrée, traduit les échecs en codes de statut, pose les en-têtes de cache |
| **Store** | Cache mémoire + disque, requêtes fusionnées, file bornée, retentatives |
| **Composant image** | Construit l'URL, remplace `<img src={dataUrl}>` |

Gardez-les séparés. Le store est testable sans serveur HTTP ; la route est testable sans réseau.

---

## 3. Les cinq pièges qui font échouer l'implémentation

**Ce sont eux qui justifient l'existence de ce document.** Chacun a coûté un cycle de débogage complet. Un assistant IA les reproduira tous s'il ne les connaît pas, car chacun échoue de manière trompeuse.

### Piège 1 — L'API « raw » corrompt les données binaires

Les clients d'API Git proposent souvent un mode « contenu brut ». Avec Octokit :

```ts
// ❌ CORROMPT SILENCIEUSEMENT LES IMAGES
await octokit.repos.getContent({ owner, repo, path,
  mediaType: { format: "raw" } });
```

La réponse est décodée **comme du texte UTF-8**. Tout octet supérieur à 127 est remplacé par le caractère de substitution. Mesure sur une image réelle : **2 332 652 octets attendus, 2 213 363 reçus.**

C'est le piège le plus dangereux du lot : **aucune erreur n'est levée**. L'image est simplement corrompue, parfois de façon subtile.

```ts
// ✅ Le base64 traverse le décodage texte sans dommage
const res = await octokit.repos.getContent({ owner, repo, path });
const bytes = Buffer.from(res.data.content, "base64");
```

**Au-delà de 1 Mo**, l'API `contents` renvoie un corps vide avec seulement un SHA. Il faut basculer sur l'API blob :

```ts
if (!base64.trim()) {
  const blob = await octokit.git.getBlob({ owner, repo, file_sha: res.data.sha });
  base64 = blob.data.content;
}
```

**Omettre ce repli casse précisément les grosses images** — celles qui bénéficient le plus du proxy.

**Vérification obligatoire :** comparez la taille servie à `git cat-file -s <sha>`. Elles doivent être **identiques à l'octet près**. Ne vous fiez pas au rendu visuel : une image partiellement corrompue s'affiche souvent quand même.

### Piège 2 — Une extension dans le chemin est interceptée

```
/api/media/photo.png   →  404 HTML   ← intercepté comme fichier statique
/api/media/photo       →  votre code
```

Les serveurs de rendu (TanStack Start, Next.js, Nuxt, Remix…) placent un intergiciel de fichiers statiques **avant** le routeur. Un segment terminant par une extension connue lui appartient.

✅ **Faites voyager le nom de fichier en paramètre de requête :**

```
/api/media?file=photo.png
```

### Piège 3 — Les routes « attrape-tout » peuvent ne jamais s'exécuter

Dans TanStack Start, le gestionnaire serveur exige une correspondance **exacte** :

```js
const isExactMatch = foundRoute && routeParams["**"] === void 0;
```

Une route splat (`$`, `[...slug]`) laisse un reste, donc `isExactMatch` est faux et **la requête retombe silencieusement sur la page 404**. Symptôme caractéristique : votre gestionnaire n'est jamais atteint, aucune erreur n'apparaît, et la réponse est du HTML avec un statut 404.

✅ Utilisez une route **exacte** sans paramètre de chemin. C'est une raison supplémentaire de passer le nom en query.

### Piège 4 — En développement, le serveur intercepte les requêtes d'images

Symptôme déroutant : `curl` renvoie 200, le navigateur renvoie 404, **sur la même URL**.

Cause : Vite examine l'en-tête `Sec-Fetch-Dest`. Une balise `<img>` envoie `image`, ce qui marque la requête comme fichier statique et la court-circuite avant le routeur.

```
Sec-Fetch-Dest: document, empty   →  200   (ce qu'envoie curl)
Sec-Fetch-Dest: image, style      →  404   (ce qu'envoie <img>)
```

**La production n'est pas affectée.** Correctif en développement uniquement :

```ts
// vite.config.ts
import type { Plugin } from "vite";

function allowApiAssetRequests(): Plugin {
  return {
    name: "allow-api-asset-requests",
    apply: "serve", // développement uniquement
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith("/api/")) {
          req.headers["sec-fetch-dest"] = "empty";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [allowApiAssetRequests(), /* ... */],
});
```

Placez-le **en premier** dans la liste des plugins.

> **Diagnostic généralisable :** si `curl` réussit là où le navigateur échoue, rejouez les en-têtes du navigateur avec `curl -H`. La différence est presque toujours dans `Sec-Fetch-Dest`, `Accept` ou `Origin`.

### Piège 5 — Une panne ne doit jamais devenir un 404

Traduire toute erreur en 404 est le réflexe par défaut, et c'est un piège durable : une limite de débit fait disparaître les images, le navigateur **met le 404 en cache**, et elles ne reviennent pas au rechargement.

✅ Distinguez les causes. Seul un 404 authentique de l'API Git devient un 404.

| Cause | Statut | Raison |
|---|---|---|
| Fichier absent du dépôt | `404` | Vrai |
| Limite de débit | `429` + `Retry-After` | Réessayable |
| API en panne | `502` | Pas votre faute |
| Nom de fichier invalide | `404` | Sans révéler la structure interne |

---

## 4. La couche de cache

C'est le cœur de la solution. Une page qui demande 40 images simultanément met en évidence tout ce qui manque.

**Six propriétés, chacune répondant à une défaillance observée :**

| Propriété | Défaillance évitée |
|---|---|
| **Cache disque** | Un redémarrage retéléchargerait tout |
| **Requêtes fusionnées** (single-flight) | 40 requêtes pour la même image → 40 appels API |
| **File bornée** (6 simultanés) | Une rafale déclenche les limites de débit secondaires |
| **Retentative avec `Retry-After`** | Un pic transitoire casse la page |
| **Service périmé en cas d'erreur** | Une limite de débit vaut mieux qu'une image cassée |
| **Statuts distincts** | Voir piège 5 |

### Interface

```ts
export interface MediaBlob {
  bytes: Uint8Array;
  contentType: string;
  etag: string;
}

export type MediaFetchOutcome =
  | { status: "ok"; blob: MediaBlob }
  | { status: "not-found" }
  | { status: "rate-limited"; retryAfterSeconds: number }
  | { status: "error"; message: string };

export interface MediaStoreDeps {
  readBlob: (path: string) => Promise<MediaFetchOutcome>;  // injecté = testable
  cacheDir?: string;
  concurrency?: number;   // défaut 6
  ttlMs?: number;         // défaut 5 min
  maxRetries?: number;    // défaut 3
  sleep?: (ms: number) => Promise<void>;  // injecté = tests instantanés
  now?: () => number;
}
```

> **Injectez `readBlob`, `sleep` et `now`.** C'est ce qui rend la logique testable sans réseau et sans attente réelle. Sans cela, tester les retentatives demande des délais véritables et les tests deviennent lents et instables.

### Points d'implémentation à respecter

**Requêtes fusionnées** — indispensable. Une grille de 40 images demandant le même fichier ne doit produire qu'une lecture :

```ts
const inFlight = new Map<string, Promise<MediaFetchOutcome>>();

const pending = inFlight.get(key);
if (pending) return pending;          // se joindre à la requête en cours

const request = (async () => { /* ... */ })()
  .finally(() => inFlight.delete(key));
inFlight.set(key, request);
return request;
```

**File bornée** — un sémaphore simple suffit :

```ts
let active = 0;
const waiting: Array<() => void> = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (active >= concurrency) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  active += 1;
  try {
    return await task();
  } finally {
    active -= 1;
    waiting.shift()?.();
  }
}
```

**Service périmé** — quand la lecture échoue mais qu'une version antérieure existe :

```ts
if (cached && outcome.status !== "not-found") {
  return { status: "ok", blob: cached.blob };  // vieille image > image cassée
}
```

**Un cache défaillant ne doit jamais faire échouer une requête :**

```ts
async function writeDisk(key: string, entry: CacheEntry) {
  try { /* ... */ } catch { /* ignoré volontairement */ }
}
```

**Clé de cache** — dérivez-la du chemin **et** de la version, par hachage (un chemin contient des `/` illégaux en nom de fichier) :

```ts
createHash("sha1").update(`${path}::${version ?? ""}`).digest("hex");
```

---

## 5. La route HTTP

```ts
GET /api/media?file=<nom>&v=<sha>&w=<largeur>
```

| Paramètre | Rôle |
|---|---|
| `file` | **Requis.** Nom de fichier seul, jamais un chemin |
| `v` | Optionnel. SHA du blob → réponse immuable |
| `w` | Optionnel. Largeur cible parmi une liste fermée |

### Validation d'entrée — non négociable

Le nom de fichier vient du client. Sans validation, `?file=../../.env` lit un fichier arbitraire du dépôt.

**Les règles qui tiennent :**

```ts
export function getRepositoryMediaFilePath(root: string, fileName: string) {
  const normalized = normalizeRepositoryPath(`${root}/${fileName}`, root);
  if (!normalized) return null;

  // Exactement un segment sous la racine : interdit tout sous-dossier
  const rootParts = pathSegments(root);
  const fileParts = pathSegments(normalized);
  if (fileParts.length !== rootParts.length + 1) return null;

  return normalized;
}
```

- normaliser, résoudre `..`, puis **vérifier que le résultat est bien sous la racine** ;
- exiger **exactement un segment** sous la racine ;
- valider l'extension contre une **liste blanche** qui détermine aussi le `Content-Type`.

> Ne filtrez pas `..` par remplacement de chaîne — les encodages (`%2e%2e`, `..%2f`) contournent ce genre de filtre. Normalisez, puis vérifiez le préfixe.

### En-têtes de réponse

```ts
return new Response(bytes, {
  headers: {
    "Content-Type": contentType,
    "Content-Length": String(bytes.length),
    ETag: etag,
    "Cache-Control": version
      ? "public, max-age=31536000, immutable"          // contenu versionné
      : "public, max-age=60, stale-while-revalidate=604800",
    "X-Content-Type-Options": "nosniff",
  },
});
```

**Gérez les requêtes conditionnelles** — sinon chaque revalidation retransfère l'image entière :

```ts
if (request.headers.get("if-none-match") === etag) {
  return new Response(null, { status: 304, headers: { ETag: etag } });
}
```

**`immutable` est le plus grand gain de la solution.** Si le nom de fichier est un identifiant unique (UUID) ou si vous passez le SHA en `?v=`, le navigateur ne redemande **jamais** l'image. Sans cela, il revalide toutes les 60 secondes : 100 images = 100 requêtes conditionnelles récurrentes.

---

## 6. Redimensionnement à la volée (optionnel)

Une grille affichant des vignettes de 200 px n'a aucune raison de télécharger des images de 2 Mo.

**Gain mesuré** : une source PNG de 2 277 Ko servie en vignette 400 px pèse **16 Ko — 99 % de moins**.

### Réutilisez la couche de cache

N'écrivez pas un second cache. Instanciez un **deuxième store** dont la lecture produit la variante — il hérite ainsi du cache disque, des requêtes fusionnées et de la file bornée :

```ts
const VARIANT_SEPARATOR = "\u0000w";  // absent de tout chemin réel

async function readVariant(key: string): Promise<MediaFetchOutcome> {
  const [path, rawWidth] = key.split(VARIANT_SEPARATOR);
  const width = Number(rawWidth);
  const original = await mediaStore.get(path);

  if (original.status !== "ok" || !RESIZABLE.has(original.blob.contentType)) {
    return original;  // SVG, GIF animés : inchangés
  }

  try {
    const { default: sharp } = await import("sharp");   // import différé
    const image = sharp(Buffer.from(original.blob.bytes), { animated: false });
    const { width: sourceWidth } = await image.metadata();

    if (sourceWidth && sourceWidth <= width) return original;  // jamais d'agrandissement

    const bytes = await image
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    return { status: "ok", blob: {
      bytes: new Uint8Array(bytes),
      contentType: "image/webp",
      etag: `${original.blob.etag.replace(/"$/, "")}-w${width}"`,  // ETag distinct !
    }};
  } catch {
    return original;  // dégradation propre : image lourde > image absente
  }
}

const variantStore = createMediaStore({ readBlob: readVariant, maxRetries: 0 });
```

### Trois garde-fous obligatoires

**1. Liste fermée de largeurs.** Un `?w=` libre laisse un visiteur remplir votre disque avec une entrée par valeur de pixel :

```ts
export const ALLOWED_WIDTHS = [200, 400, 800, 1600] as const;

export function parseWidth(value: string | null) {
  const width = Number(value);
  return ALLOWED_WIDTHS.find((allowed) => allowed === width);
}
```

**2. Jamais d'agrandissement.** Une source plus petite que la cible est servie telle quelle.

**3. Dégradation propre.** Si la bibliothèque échoue ou manque, renvoyez l'original. Une image lourde, jamais une image cassée.

### Coût à connaître avant de vous engager

- **`sharp` pèse environ 20 Mo** (binaires libvips). Votre image Docker grossit d'autant.
- Les binaires sont **spécifiques à la plateforme** : l'installation doit avoir lieu dans l'image cible, pas être copiée depuis l'hôte.
- L'ETag **doit** différer entre variantes, sinon un navigateur sert la vignette à la place de l'original.

---

## 7. Le composant client

```tsx
export function mediaUrl(
  src: string,
  { version, width }: { version?: string; width?: number } = {},
) {
  const path = normalizeMediaSource(src);
  if (!path) return "";

  // Les URL absolues et data: passent telles quelles
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;

  // Seul le nom de fichier voyage : le client ignore comment le dossier est nommé
  const filename = path.split("/").pop() ?? "";
  if (!filename) return "";

  const params = new URLSearchParams({ file: filename });
  if (version) params.set("v", version);
  if (width) params.set("w", String(width));

  return `/api/media?${params.toString()}`;
}

export function PrivateImage({ src, alt, className, version, width, priority = false }) {
  const resolved = mediaUrl(src, { version, width });
  if (!resolved) return <div className={cn("bg-muted", className)} aria-hidden="true" />;

  return (
    <img
      src={resolved}
      alt={alt}
      loading={priority ? "eager" : "lazy"}   // sauf au-dessus de la ligne de flottaison
      decoding="async"
      className={className}
    />
  );
}
```

### Règle capitale : ne modifiez jamais le contenu stocké

Vos fichiers Markdown continuent de contenir des chemins relatifs :

```markdown
![Schéma](media/setup-diagram.png)
```

La transformation en URL de proxy se fait **au rendu, en mémoire, jamais à l'écriture**. Trois bénéfices :

- **Aucun verrouillage.** Le contenu reste lisible par n'importe quel générateur.
- **Les autres consommateurs ne sont pas affectés.** Un site statique lisant le même dépôt continue de fonctionner.
- **Le dossier média reste renommable.** Le client ne connaît que le nom de fichier ; le serveur reconstruit le chemin depuis sa configuration.

### Choix des largeurs

| Contexte | Largeur |
|---|---|
| Vignettes de grille, cartes | `400` |
| Aperçu, boîte de dialogue | `1600` |
| Contenu d'article | original ou `1600` |

---

## 8. Vérification

**N'annoncez pas que la solution fonctionne sans avoir exécuté ces tests.** Les pièges 1 et 4 échouent précisément de manière invisible aux vérifications superficielles.

### Tests automatisés du store

Avec `readBlob`, `sleep` et `now` injectés, tout se teste sans réseau :

- [ ] 25 requêtes simultanées sur le même fichier → **une seule** lecture (fusion)
- [ ] La file ne dépasse jamais la limite de concurrence
- [ ] Une entrée expirée est relue ; une entrée versionnée ne l'est jamais
- [ ] Le cache disque survit à un redémarrage (nouvelle instance, même dossier)
- [ ] Une limite de débit déclenche une retentative respectant `Retry-After`
- [ ] Une erreur avec cache existant renvoie la version périmée
- [ ] **Une panne ne produit jamais un 404**

### Vérifications manuelles indispensables

```bash
# 1. Intégrité binaire — LE test qui attrape le piège 1
curl -s "http://localhost:3000/api/media?file=grosse-image.png" -o /tmp/o.png
git cat-file -s <blob-sha>     # doit correspondre À L'OCTET PRÈS
file /tmp/o.png                # doit reconnaître un PNG valide

# 2. Requête réelle de navigateur — LE test qui attrape le piège 4
curl -H 'Sec-Fetch-Dest: image' -o /dev/null -w '%{http_code} %{content_type}\n' \
  "http://localhost:3000/api/media?file=x.png"     # doit être 200 image/png

# 3. Traversée de chemin
curl -o /dev/null -w '%{http_code}\n' \
  "http://localhost:3000/api/media?file=../../.env"   # doit être 404

# 4. Requête conditionnelle
curl -H 'If-None-Match: "<etag>"' -o /dev/null -w '%{http_code} %{size_download}\n' \
  "http://localhost:3000/api/media?file=x.png"     # doit être 304 et 0 octet
```

### Vérification en navigateur réel

Indispensable : `curl` **ne reproduit pas** le comportement d'une balise `<img>`.

```js
// Compter les requêtes, les statuts, et les images non rendues
const broken = [...document.querySelectorAll("img")]
  .filter((i) => i.complete && i.naturalWidth === 0).length;
```

Attendu : **toutes les requêtes en 200, zéro image cassée.**

### Résultats de référence

Relevés sur 39 images / 30,9 Mo, serveur de développement :

| Mesure | Résultat |
|---|---|
| Document HTML | 42 Mo → **421 Ko** |
| Octets transférés (vignettes 400 px) | 30,9 Mo → **0,36 Mo** |
| Rechargement (cache navigateur) | **0,02 Mo** |
| Service depuis cache chaud | **20 ms / image** |
| Revalidation `304` | **22 ms / image** |
| Coût de redimensionnement | **0,3–0,8 s / image**, une seule fois |
| Première visite, tout à froid | ~15 s pour 39 images, **une seule fois** |

**Le coût dominant est le téléchargement depuis l'API Git, pas le redimensionnement.** Il est payé une fois par fichier, puis jamais.

---

## 9. Alternative recommandée pour un site statique

Si votre site est reconstruit à chaque publication, **récupérez les images au build**. C'est plus simple et plus rapide :

```ts
// scripts/fetch-media.ts — exécuté avant le build
for (const file of await listRepositoryMedia()) {
  const bytes = Buffer.from(
    (await octokit.repos.getContent({ owner, repo, path: file.path })).data.content,
    "base64",   // ⚠️ le piège 1 s'applique ici aussi
  );
  await writeFile(join("public/media", basename(file.path)), bytes);
}
```

Vous obtenez alors :

- des images servies par votre CDN, pas par votre serveur ;
- l'optimisation de votre bundler (`sharp`, `vite-imagetools`, `next/image`) gratuitement ;
- **aucun jeton Git en production** ;
- aucun cache runtime à gérer, aucune limite de débit à subir.

**Le seul inconvénient** : les nouvelles images n'apparaissent qu'au build suivant — ce qui est déjà le cas de tout le reste de votre contenu.

> Si votre CMS et votre site public partagent le même dépôt, la répartition naturelle est : **proxy runtime dans le CMS** (le contenu doit apparaître immédiatement), **récupération au build sur le site public** (la performance prime). Le site public ne doit **jamais** appeler l'API du CMS — cela le rendrait dépendant de sa disponibilité.

---

## 10. Liste de contrôle

**Correction**
- [ ] Base64 utilisé, jamais l'API « raw » (piège 1)
- [ ] Repli sur l'API blob au-delà de 1 Mo (piège 1)
- [ ] Taille servie **identique à l'octet près** à celle du dépôt
- [ ] Nom de fichier en paramètre de requête (piège 2)
- [ ] Route exacte, pas de splat (piège 3)
- [ ] Correctif dev pour `Sec-Fetch-Dest` (piège 4)
- [ ] Une panne ne devient jamais un 404 (piège 5)

**Sécurité**
- [ ] Chemin normalisé puis vérifié sous la racine
- [ ] Un seul segment autorisé sous la racine
- [ ] Liste blanche d'extensions déterminant le `Content-Type`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] Liste fermée de largeurs

**Performance**
- [ ] Cache disque, survivant au redémarrage
- [ ] Requêtes fusionnées
- [ ] File bornée (~6)
- [ ] `ETag` + réponses `304`
- [ ] `immutable` pour le contenu versionné
- [ ] `loading="lazy"` sauf au-dessus de la ligne de flottaison
- [ ] Vignettes demandées à la largeur d'affichage

**Robustesse**
- [ ] Retentative respectant `Retry-After`
- [ ] Service périmé en cas d'erreur
- [ ] Échec d'écriture du cache ignoré
- [ ] Redimensionnement en échec → original servi

**Exploitation**
- [ ] Dossier de cache configurable **et monté en volume** — sinon chaque redémarrage repaie tout
- [ ] `sharp` installé dans l'image cible (binaires spécifiques à la plateforme)

---

## Résumé en une phrase

Remplacez les data URLs par une route servant de vrais octets d'image, protégée par un cache disque à requêtes fusionnées et file bornée, avec des `ETag`, des largeurs fermées et des statuts d'erreur honnêtes — **et vérifiez l'intégrité binaire ainsi que le comportement en navigateur réel, car les deux défaillances les plus graves sont invisibles autrement**.
