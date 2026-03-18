# Contributing

This repo is designed to support both human contributors and agent-driven execution.

## Ground Rules

- keep changes scoped to one workstream or ticket
- prefer small, reviewable PRs over broad mixed-purpose commits
- treat uploads, auth, storage, vendor APIs, secrets, and deployment as gated surfaces
- do not claim real image-analysis accuracy unless the verification evidence proves it

## Branching

- keep the protected baseline branch stable
- create feature branches with the `codex/` prefix
- avoid direct pushes to the protected branch once branch protection is enabled

## PR Checklist

Before opening or merging a PR:

1. link the Paperclip issue or state that the work is exploratory
2. summarize what changed and what remains
3. list risks and assumptions explicitly
4. run `npm run test`, `npm run lint`, and `npm run build`
5. add UI smoke evidence when behavior or presentation changes

## Handoff Format

Every substantial change should leave:

- what changed
- what remains
- risks or blockers
- tests run
- recommended next ticket

## Sensitive Changes

Changes involving any of the following must include security/release notes:

- user photo uploads or storage
- model or vendor integrations
- auth, sessions, or user accounts
- deployment configuration
- secrets or environment variables
