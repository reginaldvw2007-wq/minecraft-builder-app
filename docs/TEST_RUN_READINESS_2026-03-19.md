# Test Run Readiness

## Recommendation

`GO` for a supervised phase-1 kids test as a no-login web prototype.

## Why It Is Ready

- the app now has a phone-first guided photo loop
- 4 photos automatically trigger a visible Minecraft-style render flow
- the build guide is clear enough for a short test session
- there is no backend photo storage, account system, or vendor upload in the current prototype path
- GitHub Pages preview and local preview are both operational

## What This Test Should Validate

- do kids understand the 4 to 8 photo quest without adult explanation
- does the reveal moment feel exciting enough to want to try another house
- can a child and parent follow the build guide together
- where do users get bored, confused, or stop taking photos

## What Still Blocks A Broader Public Product

- the analyzer is still mock-generated, not true image understanding
- there is no saved project flow or cross-device continuity
- no privacy policy, consent flow, or parent account structure exists for a child-directed public product
- there is no approved official Minecraft branding or trademark license

## Auth Decision

Defer Microsoft login for phase 1.

Reasons:

- it does not give a special Minecraft advantage by itself
- it adds consent and support friction for child and family accounts
- the early test does not need identity to prove the core fun loop

## Branding Decision

Do not assume official Minecraft logos, marks, or art can be used in the app or marketing without written approval.

Current public path:

- submit a partnership proposal through the Minecraft partnerships form
- treat pricing and licensing as private negotiation until Microsoft or Mojang says otherwise

## Recommended Next Ticket

Replace the mock analyzer with a real async structure-analysis service while keeping the no-login, no-storage phase-1 test surface intact.
