# Roadmap

Where MDVault is going, and what it will deliberately never become.

Current release: **v1.1.0** — GitHub-backed content management, rich editor,
media library, custom content types, live preview.

> Dates are intentions, not commitments. This is a single-maintainer project;
> the order matters more than the calendar. Items are open to discussion —
> open an issue to argue for a reordering.

## Principles that constrain the roadmap

Every item below has to survive these:

1. **The repository is the database.** No feature may require an external store.
2. **The output stays plain.** Markdown + YAML frontmatter, readable by any
   static site generator, diff-able in a pull request.
3. **No lock-in.** Anything MDVault writes must remain usable after MDVault is
   deleted.
4. **Self-hostable in one container.** No mandatory hosted service.

## Next — v1.2

**Media completeness**

- Download action in the media library
- Bulk operations: select, move, delete with usage checks
- Better orphan detection: media referenced by nothing, content referencing
  missing media

**Custom content types, second iteration**

- Structured types beyond Markdown (JSON / typed records) so a repository can
  hold project entries, changelog items or portfolio data
- Field-level schema per type, validated before commit

**Editing robustness**

- Clearer conflict resolution UI when a file changed under you
- Recovery flow for interrupted commits

## Later — v2

**Accessibility and internationalization**

- Full keyboard paths and ARIA semantics across every editor surface
- String extraction and a translation workflow for the UI itself

**Publishing integrations**

- Post-commit hooks to trigger a site rebuild
- Export/import of an existing content repository into MDVault's layout

## Explicitly out of scope

Saying no is part of the roadmap:

- **A hosted, multi-tenant version.** MDVault is a tool you run, not a service
  you rent.
- **A built-in user system.** Authentication belongs in front of the app —
  reverse proxy, SSO, tunnel. See [SECURITY.md](./SECURITY.md).
- **A proprietary content format.** No block-based JSON storage; the file on
  disk stays the source of truth.
- **A plugin marketplace.** Extension points, maybe. A marketplace, no.

## How work gets done

MDVault is developed **agent-first**: the repository carries an
[`AGENTS.md`](./AGENTS.md) contract and per-domain conventions written so that
coding agents produce code indistinguishable from hand-written project code.
Large mechanical workstreams on this roadmap — the provider adapters, the test
matrix, the accessibility sweep — are structured to be executed that way, and
the process is documented in the repository rather than kept private.

## Contributing to the roadmap

Pick anything from **Next**, or open an issue describing a use case the roadmap
does not cover. See [CONTRIBUTING.md](./CONTRIBUTING.md).
