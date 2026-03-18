# Security Policy

## Current Product Scope

The current app is approved only as a local-only or static-preview prototype.

Important limits:

- current reconstruction output is mock-generated
- no real backend model service is live yet
- uploads, storage, auth, and vendor APIs are future gated surfaces

## Reporting

If you find a security issue in the code or deployment setup, do not open a public exploit issue with secrets or proof-of-compromise details.

Report with:

- affected path or feature
- reproduction steps
- likely impact
- whether the issue involves uploads, secrets, auth, storage, or deployment

## High-Risk Areas

- future photo upload and storage flows
- future model-service integration
- GitHub Actions and deployment settings
- secrets and environment-variable handling

## Release Rule

Public release work should not proceed without:

- verification evidence
- a rollback target
- a current security review for the active architecture
