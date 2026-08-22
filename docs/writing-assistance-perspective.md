# Perspective — Assistance rédactionnelle

## Objectif

L'assistance rédactionnelle regroupe les fonctions qui aident à écrire sans
remplacer l'auteur :

- détection des fautes d'orthographe ;
- correction grammaticale et typographique ;
- suggestions de style ;
- reformulation d'un passage ;
- autocomplétion de mots, de phrases ou de paragraphes.

Ces fonctions doivent respecter les principes de MDVault : le Markdown reste la
source de vérité, aucune dépendance externe n'est obligatoire et une suggestion
ne modifie jamais silencieusement le contenu.

## Principes d'expérience

1. La langue sélectionnée pour l'article ou l'élément Vault guide toutes les
   analyses.
2. Une erreur est signalée sans modifier le Markdown enregistré.
3. Toute correction importante doit être acceptée ou refusée par l'utilisateur.
4. Les analyses distantes sont désactivables et leur utilisation doit être
   explicite.
5. L'éditeur doit rester utilisable lorsque les services de correction ou d'IA
   sont indisponibles.

## 1. Correction native du navigateur

### Fonctionnement

L'éditeur active la correction native avec `spellcheck` et applique l'attribut
`lang` correspondant à la langue du contenu en cours, par exemple `fr`, `en` ou
`de`. Le navigateur souligne alors les mots qu'il considère incorrects et
propose ses propres corrections.

La langue de l'interface MDVault et celle du contenu sont deux notions
différentes. Un utilisateur peut utiliser MDVault en anglais tout en rédigeant
un article en français ; c'est donc la langue du contenu qui doit être appliquée
à l'éditeur.

### Limites

- La qualité dépend du navigateur et des dictionnaires disponibles sur la
  machine.
- La correction grammaticale et stylistique reste limitée.
- Le comportement peut varier entre Chrome, Firefox, Safari et Edge.
- MDVault ne contrôle pas précisément les suggestions affichées.

### Données et infrastructure

Le texte reste dans le navigateur. Aucun serveur supplémentaire, compte ou coût
d'API n'est nécessaire.

### Complexité

**Faible — 1/5.**

Le principal travail consiste à propager correctement la langue de l'article ou
de l'élément Vault jusqu'à la zone éditable, puis à vérifier le comportement
quand aucune langue n'est définie.

## 2. Correction avancée avec LanguageTool

### Fonctionnement

LanguageTool analyse le texte et retourne des diagnostics structurés :
orthographe, grammaire, ponctuation, répétitions et certaines erreurs de style.
MDVault peut convertir ces diagnostics en soulignements dans Tiptap. Un clic
sur un passage ouvre les corrections proposées, que l'utilisateur peut accepter
ou ignorer.

L'analyse doit être différée après une courte pause de saisie et limitée au
paragraphe modifié. Envoyer l'article complet après chaque caractère serait
coûteux et rendrait l'éditeur instable.

### Options de déploiement

#### API hébergée

MDVault communique avec une API LanguageTool distante. L'intégration est plus
simple à exploiter, mais le texte quitte l'installation et le service peut avoir
des limites, un coût ou des conditions d'utilisation.

#### Instance auto-hébergée

L'administrateur déploie un serveur LanguageTool sur la même machine, dans un
conteneur voisin ou sur son réseau. Les utilisateurs n'ont rien à installer
individuellement : tous utilisent l'instance configurée par MDVault.

Cette option correspond mieux à l'esprit self-hosted de MDVault, mais augmente
la consommation mémoire et la complexité d'exploitation.

#### Point d'accès configurable

La solution la plus flexible consiste à rendre l'adresse du service
configurable. L'assistance reste désactivée lorsqu'aucun service n'est fourni.
MDVault ne dépend donc jamais obligatoirement de LanguageTool.

### Points techniques

- Déclencher l'analyse après une pause et annuler les requêtes devenues
  obsolètes.
- Conserver les positions des erreurs lorsque le document change.
- Ne jamais enregistrer les soulignements ou diagnostics dans le Markdown.
- Mettre en cache les résultats identiques.
- Définir une taille maximale par requête.
- Afficher clairement les états indisponible, désactivé et en cours d'analyse.

### Complexité

**Moyenne — 3/5 pour l'intégration**, **élevée — 4/5 pour une expérience très
fiable**.

L'appel HTTP est simple. La difficulté réelle se trouve dans la synchronisation
entre les positions retournées, les modifications continues du document et les
décorations Tiptap.

## 3. Actions rédactionnelles assistées par IA

### Fonctionnement

L'IA intervient à la demande sur une sélection ou, exceptionnellement, sur
l'article entier. Les premières actions utiles seraient :

- corriger l'orthographe et la grammaire ;
- reformuler ;
- raccourcir ou développer ;
- adapter le ton ;
- simplifier ;
- traduire ;
- proposer un titre ou un résumé.

MDVault envoie au modèle le texte sélectionné, la langue, l'action demandée et
un minimum de contexte. La réponse est présentée comme une proposition ou une
différence visuelle. L'utilisateur choisit ensuite d'accepter, de remplacer ou
d'annuler.

### Architecture

Le navigateur ne doit pas contenir directement la clé du fournisseur. La
requête passe par le serveur MDVault, qui applique les limites, protège les
secrets et normalise les réponses.

Un adaptateur générique permettrait plusieurs configurations :

- clé globale fournie par l'administrateur ;
- clé propre à chaque installation ;
- fournisseur cloud compatible ;
- modèle local ou privé accessible sur le réseau.

L'IA doit rester optionnelle. Sans fournisseur configuré, les commandes
concernées sont masquées ou expliquent clairement pourquoi elles sont
indisponibles.

### Confidentialité et coût

- Le texte transmis peut contenir des informations privées.
- L'interface doit indiquer lorsqu'un contenu sera envoyé à un service externe.
- Il faut envoyer uniquement le passage nécessaire.
- Des limites de taille, de fréquence et de coût sont indispensables.
- Les erreurs réseau ne doivent jamais faire perdre la sélection ou le contenu.

### Complexité

**Moyenne à élevée — 3,5/5.**

Une première commande « Corriger la sélection » est relativement directe. Une
intégration complète avec plusieurs fournisseurs, suivi des coûts, diffusion
progressive de la réponse et aperçu des différences demande davantage de
travail.

## 4. Autocomplétion par IA

### Fonctionnement

Après une courte pause, l'éditeur peut proposer la suite du texte sous forme de
texte fantôme. `Tab` accepte la suggestion et `Échap` la ferme. Cette fonction
est différente d'une correction : elle produit du nouveau contenu au lieu de
réviser un passage existant.

### Difficultés particulières

- Répondre assez vite pour ne pas interrompre l'écriture.
- Annuler immédiatement une suggestion devenue obsolète.
- Éviter les requêtes trop fréquentes et coûteuses.
- Fournir juste assez de contexte sans transmettre inutilement tout l'article.
- Préserver correctement la sélection, l'historique d'annulation et les nœuds
  riches de Tiptap.
- Ne pas afficher une suggestion lorsque l'utilisateur navigue, colle du texte
  ou utilise une commande.

### Complexité

**Élevée — 5/5.**

La génération elle-même est simple ; obtenir une interaction rapide, discrète,
accessible et économiquement maîtrisée est nettement plus difficile.

## Autocorrection ou suggestion ?

MDVault devrait privilégier la **suggestion**. Une autocorrection silencieuse
peut changer un nom propre, un terme technique, du code ou le sens d'une phrase.

Les seules corrections automatiques raisonnables sont des transformations
locales et prévisibles, par exemple certaines paires de guillemets ou espaces
typographiques, avec une annulation immédiate possible. La grammaire, le style,
la reformulation et la traduction doivent demander une confirmation.

## Ordre d'intégration recommandé

| Étape | Fonction | Complexité | Pourquoi cet ordre |
| --- | --- | --- | --- |
| 1 | Correction native selon la langue du contenu | 1/5 | Gain immédiat, aucune infrastructure et aucun transfert de données |
| 2 | Socle commun de diagnostics dans l'éditeur | 2/5 | Prépare l'affichage, l'acceptation et l'ignorance des suggestions |
| 3 | LanguageTool configurable | 3/5 | Apporte orthographe et grammaire avancées sans dépendre de l'IA |
| 4 | Action IA sur une sélection | 3,5/5 | Offre une forte valeur avec un coût et une portée contrôlés |
| 5 | Différence avant/après et actions IA supplémentaires | 4/5 | Rend les transformations importantes plus sûres et compréhensibles |
| 6 | Autocomplétion en texte fantôme | 5/5 | Exige une excellente latence, beaucoup d'ajustements UX et un contrôle strict des coûts |

## Décision recommandée

La première version devrait combiner la correction native et un socle de
diagnostics réutilisable. LanguageTool viendrait ensuite comme fournisseur
optionnel de correction avancée.

L'IA devrait commencer par des actions explicites sur une sélection. Il vaut
mieux repousser l'autocomplétion permanente jusqu'à ce que la gestion des
fournisseurs, de la confidentialité, des coûts et des suggestions soit éprouvée.

