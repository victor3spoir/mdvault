---
title: Settings
description: Inspect the connected repository and configure custom content types and languages.
order: 60
---

Settings separates deployment information from the choices stored in your
content repository. Changes to custom types or languages create Git commits.

## User Profile

The profile tab displays the GitHub account associated with the server token,
the configured repository and its branch. These values are read-only. The
token field is masked and does not reveal or change the actual credential.

Update deployment environment variables to change the repository or token,
then restart the app. The Site Settings fields are disabled placeholders, not
working configuration controls. See [Configuration](/docs/getting-started/configuration).

## Dynamic Content

Create a custom type with a unique id, label, icon and rich/plain editor. Each
type has its own sidebar link and folder under `vault/`.

![Settings on the Dynamic Content tab](/screenshots/settings.png)

These are Markdown-backed types. Arbitrary JSON records and user-defined field
schemas are not implemented. The [Vault guide](/docs/features/vault) explains
the limits, translations and what happens when you remove a type.

## Languages

Enable the languages you publish in and choose the default for new entries.
This affects content metadata and translation links, not the interface language
and not automatic machine translation.

![Enabled content languages and the default language](/screenshots/settings-languages.png)

## Verify

After saving a type, check its sidebar entry and repository folder. After
saving language settings, open a new article or Vault entry and check the
language choices and default.

## Next

- [Edit and link translated content](/docs/features/articles)
- [Understand the repository layout](/docs/reference/repository-layout)
