# Agent Operating Model

## Goal

Define a governance and handoff structure that can scale from a solo-founder phase to
an agent-assisted product organization without losing reviewability or security.

## Design Principles

- specialized agents should own narrow scopes rather than broad mixed mandates
- agent instructions and role files should live in version control
- every handoff should include objective, output, risks, and verification evidence
- protected branches and required checks should guard the reviewable baseline
- humans should remain explicit approvers for risky or public-facing changes
- every task should be treated like a ticket with a named objective, deliverable, and handoff target
- parallel work should split into isolated workstreams rather than mixing architecture, implementation, and release conclusions in one thread
- only the tools needed for the current workflow should be activated; tool sprawl is not a virtue

## Working Model

### 1. Separate planning, implementation, QA, security, and release

- CEO / Product Owner scopes and routes work
- Architect defines contracts and risky system boundaries
- Builder implements
- QA validates evidence and user-facing behavior
- Security guards trust boundaries and future data handling
- Release Manager decides whether a build is actually safe to publish

### 2. Keep role instructions durable

Project-specific instructions should be checked into version control and referenced by
the active agent configuration. This follows the same general practice Anthropic
documents for project subagents: keep project-specific agent definitions in version
control so the team can improve them collaboratively.

Source:

- Anthropic subagents docs: [Create custom subagents](https://code.claude.com/docs/en/sub-agents)

### 3. Make handoffs explicit

Each ticket handoff should include:

- objective
- deliverable
- owner
- handoff target
- prohibited actions
- tests run
- remaining work
- escalation path

This reduces hidden context and makes agent resumes cheaper and safer.

### 4. Protect the baseline branch

GitHub’s protected branch guidance supports requiring pull requests, status checks,
conversation resolution, and optional code owner reviews before merge. For this repo,
the practical near-term baseline is:

- required CI checks
- PR-based changes once the remote repo is active
- code owners defined in the repo
- stronger review requirements as more humans join the project

Sources:

- GitHub Docs: [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

### 5. Escalate, do not blur, risky changes

Uploads, storage, auth, vendors, secrets, and deployment should not be treated as
"just another ticket." They require a visible security/release path and usually a human
approval step.

### 6. Keep execution operationally clean

- prefer isolated branches or worktrees when parallel implementation tracks would otherwise collide
- use repo-specific configuration for durable behavior instead of relying on transient chat context
- use repeatable skills and scripts before inventing new one-off workflows
- automate only after a workflow is stable and predictable enough to trust
- favor a working local prototype before scaling infrastructure or governance complexity

## Recommended Maturity Path

### Current phase

- single founder with agent assistance
- protected baseline plus CI
- local/static prototype
- explicit handoff packets in repo docs and Paperclip issues

### Next phase

- GitHub PR flow becomes the normal integration path
- branch protection requires CI and conversation resolution
- a preview deployment environment is added
- deployment and security reviews become actual issue checkpoints

### Later phase

- require code owner review on sensitive paths
- add staged deploy environments
- track model-provider, storage, and auth changes through dedicated approvals

## Practical Rule

Autonomy should increase throughput, not erase accountability. If a future change would
expand who can access user photos, secrets, infrastructure, or public releases, it
should slow down long enough for explicit review.
