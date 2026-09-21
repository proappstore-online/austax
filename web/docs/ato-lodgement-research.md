# AusTax product and knowledge brief: individual income-tax lodgement

Research date: 21 September 2026  
Scope: Australian individual income-tax return preparation and lodgement guidance. This is product research, not tax advice.

## Product boundary

AusTax must be a preparation and guidance companion, not a lodgement service.

- It must not sign, submit, lodge, amend, or represent that it can lodge a return.
- It must not automate, scrape, or interact with myTax or other ATO online systems.
- It must not request a TFN, myGov password, bank login, identity-document number, or other ATO credentials.
- It must not present its output as personalised tax advice, a final tax calculation, an eligibility decision, or an ATO-approved result.

This is a material compliance constraint: the ATO lists software services directly to individual taxpayers to lodge their own returns and third-party interaction with ATO online systems such as myTax as unsupported business models. An ATO-connected lodgement product would require a materially different model, including an appropriate eligible entity/intermediary, ATO digital-service conditions, security controls and whitelisting. See Source 1.

## The correct user journey

1. **Start with the correct year and scope.** Australian income years run 1 July to 30 June. Ask whether the person may need to lodge; do not decide that question for them. Point uncertain users to the ATO's “Do I need to lodge?” tool.
2. **Prepare, do not collect credentials.** Build a private checklist for income, deductions, offsets, private health, investments/CGT, rental, business/sole-trader, foreign income and other complexity flags. The app may store user-entered notes and document metadata only after a clear privacy design is implemented.
3. **Wait for complete pre-fill where practical.** ATO guidance says the best time to lodge is generally from late July, when most third-party data is pre-filled. Users must check every pre-filled item against their own records and add missing or incorrect data. The app should show a “tax ready / pre-fill checked” checklist, never claim the data is complete.
4. **Hand off to the official lodgement path.** The final action is a clearly labelled external link: “Continue in ATO online services (myTax)” or “Find / contact a registered tax agent”. Users manage ATO online services via myGov after linking it to the ATO.
5. **After lodgement.** Explain that the ATO processes the return and issues a notice of assessment. Keep supporting records; retention can vary by item and can extend beyond five years, particularly for CGT/investment matters.

## What the AI agent may do

- Explain the ATO process in plain English with source links and publication/review dates.
- Turn a user’s stated situation into a neutral checklist of information to find.
- Help label documents and identify unanswered questions.
- Explain that pre-fill information should be checked, not treated as complete.
- Flag higher-complexity scenarios for ATO or registered-tax-agent review: business/sole-trader income, rental property, foreign income, crypto/CGT, trust distributions, complex offsets, deceased estates, overdue returns, or uncertainty about deductions.

## What the AI agent must not do

- Ask for TFNs, myGov credentials, bank logins, identity documents, or full financial-account numbers.
- State that a deduction is allowable for the user, calculate a final refund/liability, or decide whether they must lodge.
- Generate or submit an ATO return, access myTax, or imply an ATO affiliation/endorsement.
- Replace a registered tax agent where regulated advice, representation, or lodgement is needed.

## Required UI changes from the prototype

- Use the current relevant return year (2025–26 as of this research date), but make the year selectable rather than hard-coded.
- Replace “Estimated refund” with “Preparation snapshot” unless a reviewed calculation model and applicable disclosure exist. Do not surface a numerical refund estimate from incomplete data.
- Add a visible primary CTA: “Continue in myTax” (external ATO online-services path); it must not initiate an ATO session or transmit user data.
- Add a review gate before the CTA: income checked, deductions supported, pre-fill reviewed, complexity flags addressed, and user confirms they will check the official ATO return.
- Keep the agent’s notice near every assistant interaction: “General information only — not tax advice. AusTax cannot lodge your return.”
- Use an “ATO sources” panel in the agent reply and a “last reviewed” date for time-sensitive guidance.

## Source register

1. Australian Taxation Office, [DSP conditions of use](https://softwaredevelopers.ato.gov.au/usingourservices/dsp-conditions-use), last modified 3 March 2025. The unsupported-model section says third-party software must not interact with ATO online systems such as myTax and identifies direct individual self-lodgement software as unsupported.
2. Australian Taxation Office, [Lodging your first tax return](https://www.ato.gov.au/api/public/content/0-c4810e59-226e-482f-a427-e3f856e5e59a), retrieved 21 September 2026. Covers the 1 July–30 June income year, the usual 31 October self-lodgement deadline, myGov-to-ATO linking, tax-ready income statements and late-July pre-fill.
3. Australian Taxation Office, [Lodge and pay](https://www.ato.gov.au/api/public/content/0-5f0fcd18-9557-451f-9f9b-11ce935ea237), retrieved 21 September 2026. Advises that late July is generally the best time to lodge and requires taxpayers to include all income and substantiate claims.
4. Australian Taxation Office, [ATO warns taxpayers: Don’t lodge yet!](https://www.ato.gov.au/api/public/content/0-f1575c59-31c0-444b-a4a1-6abe857f602f), published 26 June 2025. Says to wait until income statements are tax ready and pre-fill is complete; early lodgement can cause amendments or ATO corrections.
5. Australian Taxation Office, [Finalising your STP data](https://www.ato.gov.au/finalisingSTP), retrieved 21 September 2026. Explains that finalised employment information is marked tax ready and then pre-fills into myTax.
6. Australian Taxation Office, [Do you need to lodge a tax return? 2025](https://www.ato.gov.au/api/public/content/0-5705ddc1-f517-4ce9-9c5f-666c224ed36e), last updated 27 May 2025. Directs individuals to the ATO tool and explains non-lodgment advice where applicable.
7. Australian Taxation Office, [What records to keep](https://www.ato.gov.au/api/public/content/0-066bd153-8eec-4c72-9c1b-9ca71bf80ade), retrieved 21 September 2026. Notes that investment records are generally kept for 5 years after the return is processed, with situation-specific retention requirements.

## Review cadence

Review this brief before each tax season and whenever ATO lodgement, pre-fill, digital-service, deduction, privacy or Tax Practitioners Board rules change. The app’s source panel should link only to official ATO/TPB sources and show the source date.
