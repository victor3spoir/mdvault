# Security Policy

MDVault runs with a GitHub token that can **write to your repository**. That
makes its threat model unusual for a CMS, and worth stating plainly.

## Supported versions

| Version | Supported |
|---|---|
| Latest release (`v1.x`) | ✅ |
| `ghcr.io/victor3spoir/mdvault:latest` | ✅ |
| Older tags | ❌ — upgrade before reporting |

## Reporting a vulnerability

**Do not open a public issue.**

Use GitHub's private reporting on this repository:
**Security → Advisories → Report a vulnerability**, or contact the maintainer
privately through the address on the [GitHub profile](https://github.com/victor3spoir).

Please include:

- affected version or image digest
- how MDVault is deployed (container, source, reverse proxy, exposed or loopback)
- reproduction steps, and the impact you were able to demonstrate
- whether a repository token was involved, and its scopes

**Never include a real token, even a revoked one.**

Expect an acknowledgement within a few days. This is a single-maintainer
project, so please allow reasonable time for a fix before public disclosure —
90 days is a fair default, shorter if the issue is being exploited.

## Threat model

What MDVault holds:

- a **GitHub token** with write access to one content repository, provided as an
  environment variable and used **server-side only**
- a **server-side cache** of media fetched from private repositories, so that
  previews render without exposing the token to the browser

What it does not hold: user accounts, passwords, a database, or content beyond
what is already in your repository.

The core assumption: **whoever can reach the MDVault UI can write to the
connected repository.** MDVault ships without authentication of its own.

## Deployment guidance

1. **Bind to loopback.** The documented run command uses
   `-p 127.0.0.1:3000:3000` on purpose. Do not publish the port on `0.0.0.0`.
2. **Put authentication in front of it** if it must be reachable from a network:
   a reverse proxy with SSO, an authenticating tunnel, or a VPN. MDVault has no
   login screen and is not designed to be a public endpoint.
3. **Scope the token narrowly.** A fine-grained personal access token limited to
   the single content repository, with only the permissions listed in the
   README. Never a classic token with `repo` on your whole account.
4. **Use a dedicated content repository.** Not the repository that holds your
   application source.
5. **Rotate the token** if the container is exposed, shared, or its logs leave
   your machine.
6. **Keep the image current.** Security scanning runs in CI, but fixes only
   reach you when you pull.

## What is not a vulnerability

- Reaching the UI on an instance the reporter deliberately exposed to the
  internet without a proxy — that is the documented misconfiguration above.
- Actions performed with a token the reporter supplied themselves.
- Missing built-in authentication: it is a documented design decision, not an
  oversight. A proposal to add it is a feature request, not a report.

## Supply chain

- Dependencies are audited on every pull request (`bun audit` in CI).
- The container image is built and published from CI, from a tagged commit.
- The lockfile is committed and installs are `--frozen-lockfile`.
