---
title: Dashboard
description: Review content counts and recent repository activity before opening a section.
order: 5
---

The dashboard brings articles, posts and each configured Vault type into one
view. Open **Manage** on a section to browse its entries, or use its plus button
to start a new entry.

![Dashboard with article, post and custom-type counts and recent activity](/screenshots/dashboard.png)

## Content counts

Each section shows total, published and draft counts, plus its latest update
when available. Successful create, save, publish, unpublish and delete actions
refresh these counts and the relevant content lists.

These are repository-backed snapshots, not live collaboration or an audit
guarantee. A failed upstream listing can look like empty data; confirm the
repository directly if a count is unexpected.

## Recent activity

The activity list combines recent article, post and media commits. Follow an
entry to its content or the media library. This is a short convenience list,
not the complete Git history, and it does not currently include Vault activity.

Media move/delete commits may be labelled as uploads. Inspect the Git commit
for the exact operation; this is a known limitation of the activity labels.

## Next

- [Manage articles](/docs/features/articles)
- [Configure content types and languages](/docs/features/settings)
