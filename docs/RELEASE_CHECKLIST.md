# Release Checklist

## Current Recommendation

Current status is `GO` for the static mock preview and `NO-GO` for any release that
adds backend processing, storage, auth, or external model vendors.

## Minimum Preconditions

### Source control

- code is committed to a dedicated branch
- a known-good commit or tag exists for rollback
- review scope is clear and reproducible

### Engineering verification

- `npm run test` passes
- `npm run lint` passes
- `npm run build` passes

### QA packet

- verification criteria from `docs/VERIFICATION_CRITERIA.md` are applied
- upload + export smoke results are recorded
- mock limitations are disclosed in release notes

### Security packet

- baseline from `docs/SECURITY_BASELINE.md` is reviewed
- no external vendor path is enabled without explicit approval
- secret handling and storage choices are documented before any backend release

### Product and governance

- Paperclip issue artifacts are linked for architecture, QA, security, and release
- owner approval exists for any shared preview request

## Rollback Expectations

- current local-only prototype:
  - rollback target must be a git commit or tag
  - rollback owner should be the release manager or builder on duty
- future hosted preview:
  - rollback must include app version, config version, storage migration state, and provider toggle state

## Release Notes Requirements

- clearly label the system as a mock reconstruction prototype
- describe what inputs are local only versus externally processed
- disclose major limits around confidence and geometry accuracy

## When Release Management Becomes Active

Release management should become an active workflow when any of the following happen:

- a shared preview URL is created
- user photos are stored anywhere outside the browser session
- an external model or API provider is introduced
- more than one operator can modify or review the same project state
