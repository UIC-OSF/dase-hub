# ADA Title II and Equalify — brief for the directors meeting

**For:** Jemma, presenting Friday, October 16, 2026
**Numbers as of:** October 16, 2026. All of them are live on [dase.uic.edu/key-results](https://dase.uic.edu/key-results) and refresh every 6 hours, so re-check the morning of.

---

## 1. What Title II actually requires

- **The standard is WCAG 2.1 Level AA** for all web content and mobile apps UIC provides — including content a vendor or contractor provides on UIC's behalf.
- **UIC's deadline is April 26, 2027.** DOJ pushed it back a year on April 20, 2026 (it was April 24, 2026). The National Federation of the Blind is challenging the extension in court; no ruling yet, so the earlier date could in theory come back. Illinois law (IITAA 2.1) already requires WCAG 2.1 AA of state universities today.
- **What's exempt** (and the trap in the PDF exemption):
  - Archived content kept only for reference and left unchanged.
  - PDFs, Word, PowerPoint and Excel files posted **before** the deadline — **unless they're still used to apply for, access, or take part in a service.** Anything posted or substantively updated after the deadline must conform.
  - Content posted by third parties (not UIC or its vendors), individualized password-protected documents, and pre-deadline social media posts.
- A miss only gets a pass if it "would not change a person with a disability's access" — DOJ says this can't be used to avoid trying to meet the standard.

**In one sentence:** by April 2027, every public UIC page must meet WCAG 2.1 AA, and every document people still rely on must too.

## 2. Where UIC stands — four numbers

| | Number | What it means | How to say it |
|---|---|---|---|
| **Coverage** | **156** UIC websites monitored | Distinct uic.edu sites with a completed Equalify scan in the last 30 days (191 are tracked in total). Up from 54 in May. | "156 UIC websites are under continuous accessibility monitoring — nearly three times as many as in May." |
| **Volume** | **208,000** pages scanned in 30 days | Web pages and PDFs checked for accessibility issues in the last 30 days (WCAG rules for pages, PDF/UA for documents) — about 6,900 a day. 88,698 uic.edu addresses are tracked in total. | "Equalify checks about 7,000 UIC pages and documents for accessibility issues every day." |
| **Improvement** | **−25%** detected issues on rescanned sites | Across 64 sites rescanned with the identical set of pages, detected issues fell from 148,115 to 110,487 between first and latest scan. | "On sites we've rescanned, detected issues are down about a quarter. That's the teams doing the fixing — Equalify is how they can see it." |
| **Documents** | **14,877** PDFs scanned · **~2,000** made accessible by Iris | PDFs found and checked across UIC sites; Equalify Iris has auto-tagged about 2,000 documents (over 10,000 pages) since August. | "We've found nearly 15,000 PDFs on UIC sites, and Iris has already made about 2,000 of them accessible automatically." |

## 3. Users — the definitions

These now appear under each number on the dashboard, and they match Equalify's own Account › Statistics page.

| Metric | Number | Definition |
|---|---|---|
| Registered users | **79** | Accounts in Equalify (UIC SSO and invited users). 7 joined in the last 30 days. |
| Active users (30 days) | **30** | Distinct accounts that signed in to Equalify in the last 30 days. |
| Departments served (30 days) | **19** | Distinct UIC departments (from SSO) with at least one sign-in in the last 30 days. |
| Users who've created an audit | **42** | Distinct accounts that have set up at least one audit. (This was the old "UIC Users" number.) |

## 4. What not to claim

- **"Average site score doubled from 24% to 48%"** is UIC Today's figure for the **average score of a Red site** (October 2024 → October 2025, range 2%–98%). Attribute it to Red / UIC Today, not to Equalify.
- **Automated scanning finds roughly half of real-world issues.** Equalify finds what a computer can find, across every site, every day; people still have to do the rest.
- **"Detected" is not "fixed."** The −25% is fewer issues detected on rescan, which almost always means fixes, but Equalify doesn't confirm each one.
- **156 sites is not all of UIC.** It's the sites teams have put into Equalify. UIC has hundreds of websites; coverage grows as units sign up.
- Numbers move daily. Quote the dashboard, not this page, on Friday.

## 5. Suggested slide lines

1. Title II means WCAG 2.1 AA on every public page and every document people rely on, by April 26, 2027.
2. 156 UIC websites and ~7,000 pages a day are now checked for accessibility issues, automatically.
3. On sites we've rescanned, detected issues are down about a quarter.
4. 79 people across 19 departments are using Equalify; ~2,000 PDFs have been made accessible by Iris.

## Sources

- DOJ, [Fact Sheet: New Rule on the Accessibility of Web Content and Mobile Apps](https://www.ada.gov/resources/2024-03-08-web-rule/) — standard, exceptions, compliance dates.
- Jackson Lewis, [DOJ Extends Public Entities' Compliance Deadline](https://www.jacksonlewis.com/insights/doj-extends-public-entities-compliance-deadline-ada-related-website-accessibility-hhss-may-2026-deadline-still-looms) — April 20, 2026 interim final rule.
- UIC Today, [Progress update on UIC's ADA Title II Digital Accessibility Initiative](https://live.today.uic.edu/progress-update-on-uics-ada-title-ii-digital-accessibility-initiative/) — Red site scores (24% → 48%).
- Equalify data (GraphQL API, CloudWatch scan metrics, `/public/getPublicStats`), synced to [dase.uic.edu/key-results](https://dase.uic.edu/key-results); definitions in `utils/keyResults.ts`.
- Deque (2021) and UK Government Digital Service (2017) — automated tools catch roughly half of issues (already cited in the "Why We Build Equalify" deck).
