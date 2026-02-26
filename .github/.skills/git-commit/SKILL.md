---
name: git-commit
description: Quick commit and push with minimal, clean messages
user-invokable: true
argument-hint: <input-your command>

---

# Git Commit

<instruction>

Quick commit with conventional message format, then push.

</instruction>

## Context

<context>

- Git state: !`git status`
- Staged changes: !`git diff --cached --stat`
- Unstaged changes: !`git diff --stat`
- Recent commits: !`git log --oneline -5`
- Current branch: !`git branch --show-current`

</context>

## Workflow

<workflows>


1. **Analyze**: Review git status
   - Nothing staged but unstaged changes exist: `git add .`
   - Nothing to commit: inform user and exit

2. **Generate commit message**:
   - Format: `type(scope): brief description`
   - Types: `feat`, `fix`, `update`, `docs`, `chore`, `refactor`, `test`, `perf`, `revert`
   - Under 72 chars, imperative mood, lowercase after colon
   - Example: `update(statusline): refresh spend data`

3. **Commit**: `git commit -m "message"`

4. **Push**: `git push`

</workflows>

## Commit format

- types: [feat/fix/refactor/docs/chore]
- scope [auth, cicd, build, etc.] (scopes depends a lot on the project user are working on; try to identify the best suited scope based on commit elements if user didn't give info about scope)

<commit-template>

```
type(scope): brief commit message

commit description (with bullets points if needed)

```

</commit-template>

## Rules

<rules>

- SPEED OVER PERFECTION: Generate one good message and commit
- NO INTERACTION: Never ask questions - analyze and commit
- AUTO-STAGE: If nothing staged, stage everything
- AUTO-PUSH: Never push after commit unless the user explictly ask for it
- IMPERATIVE MOOD: "add", "update", "fix" not past tense

</rules>