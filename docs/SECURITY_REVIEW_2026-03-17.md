# Security Review - 2026-03-17

## Scope

Review of the current local-only prototype surface in this repo.

## Evidence Reviewed

- `src/App.tsx`
- `src/lib/generateBuildPlan.ts`
- `src/lib/exportBuildPlan.ts`
- `docs/SECURITY_BASELINE.md`

## Findings Summary

- no backend or remote network path exists in the current product surface
- reference photos remain local to the browser session in the current implementation
- the highest present risk is user misunderstanding of mock output fidelity, not remote compromise
- the public GitHub Pages preview is static only and does not introduce server-side upload or storage handling
- future risk will increase materially once uploads, storage, auth, or external model vendors are added

## Required Conditions For This Review To Hold

- public deployment remains static only
- no external provider calls are added
- no persistent storage is introduced
- release notes continue to label the output as a mock reconstruction

## Security Verdict

- verdict: `PASS` for local-only and static-preview handling
- verdict: `NO-GO` for backend, storage, auth, or model-vendor deployment until the baseline gates in `docs/SECURITY_BASELINE.md` are satisfied
