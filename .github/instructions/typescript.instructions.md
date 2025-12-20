---
applyTo: '**/*.ts|**/*.tsx'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

## Components design

- All pages should always be server component with `async`.
- Always use `useTransition` hook when client component need to call server actions.