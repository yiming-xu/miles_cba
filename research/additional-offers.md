# Additional Singapore miles welcome offers

Checked **20 October 2026** against the live roundup and its linked articles.[1][2]
The five records below add four card products plus a distinct paid Citi PremierMiles route to the four existing offers; `bonusMiles` excludes ordinary spend miles.[2][11]
In the JSON, `fee` is the annual fee per year; `monthlyCap: null` means no numeric cap is asserted, not that every rate is uncapped.[9][6]

## Offers

### Citi PremierMiles — 30,000 bonus Citi Miles (paid direct-online offer)

The official direct-online paid offer runs through **31 March 2027**.[11]
It awards 10,000 miles for paying the **S$196.20** annual fee and another 20,000 after **S$800** qualifying retail spend within the account-opening month plus two calendar months; new principal Citi customers only, with approval/opening within 30 days and no principal Citi card held, closed in the prior 12 months, or pending at application.[11]
The standard earn rate is 1.2 mpd locally and 2.2 mpd overseas; those ordinary miles are not included in the 30,000 bonus.[1]

**Source distinction:** The October MileLion roundup also describes a channel-specific 30K offer with a S$100 Trip.com voucher ending 31 October.[3]
A similarly named Citibank PDF returned 8,000-mile fee-waiver terms; this record uses the distinct official 30K paid-offer T&Cs linked from the article, not that 8K PDF or the voucher deadline.[3][7][11]

### AMEX KrisFlyer Ascend — up to 45,000 bonus KrisFlyer miles (paid; new-to-AMEX)

The official promotion runs through **31 January 2027** for eligible new-to-AMEX applicants approved within 45 days.[14]
The 45,000 comprises 5,000 on the first charge (first-time Amex Singapore Airlines cobrand applicants only), 20,000 after S$5,000 eligible spend within six months and payment of the first **S$397.85** annual fee, plus 20,000 after at least S$1 eligible spend in month 15.[14]
MileLion says the month-15 tranche requires paying the second S$397.85 annual fee, so collecting the full 45,000 costs **S$795.70 total fees**; `fee` remains the per-year annual fee.[4]
The local base rate is 1.2 mpd with no cap, separate from the welcome miles.[9]

A separate **S$100 eCapitaVoucher** is available only for applications by **1 November 2026**; it is not counted in `bonusMiles` and does not shorten the mile offer's 31 January deadline.[14]

### HSBC TravelOne — 20,000 bonus miles + luggage (paid; new HSBC cardholder)

Apply **1 July–31 October 2026** and obtain approval by **14 November 2026**.[8]
New-cardholder eligibility requires no current principal HSBC card and no HSBC card cancellation in the preceding 12 months.[8]
The applicant must consent to marketing, pay the strictly chargeable, non-waivable **S$196.20** first-year fee, and spend **S$1,000** in qualifying transactions by the end of the month after account opening.[8]
The gift is 20,000 miles (50,000 HSBC Reward points) plus luggage; existing eligible HSBC cardholders receive 10,000 miles instead.[8]
Local and overseas base rates are 1.2 and 2.4 mpd respectively; neither is included in the bonus.[5]

### AMEX KrisFlyer Credit Card — up to 16,000 bonus KrisFlyer miles (first-year fee waived)

The official promotion runs through **31 January 2027**.[17]
Eligible new-to-AMEX applicants approved within 45 days can receive 11,000 bonus miles after **S$2,000** eligible spend within three months; a separate 5,000 first-charge bonus applies only to first-time Amex Singapore Airlines cobrand applicants, so 16,000 is conditional on meeting both criteria.[17][9]
The first-year **S$179.85** annual fee is waived; the ongoing local base rate is 1.1 mpd and is excluded from `bonusMiles`.[9][2]

**Terms caveat:** The Amex promotion PDF's first-charge sentence names the Ascend card despite being the KrisFlyer Credit Card offer; it also describes the 5,000-mile condition as first-time co-brand applicants.[17][9]
Keep the 5,000 conditional and verify with Amex before treating 16,000 as an unconditional preset.[17][9][2]

### Trust Freedom — up to 100,000 Max Miles (no annual card fee)

The official page lists 20,000 Max Miles for S$1,000 spend, 50,000 total for S$5,000, or 100,000 total for S$15,000.[13]
Apply by **31 October 2026** and spend within 31 days, or by 30 November, whichever comes first; the card has no annual fee.[13]
MileLion reports that the promotion requires new-to-card status (never held a principal Trust card) and selecting Miles mode.[6]
The card earns 1.3 KrisFlyer miles or Max Miles per S$1 locally and overseas with no cap.[6]
The welcome gift itself is **Max Miles**, not a direct KrisFlyer balance; a separate S$27.25 transfer fee may apply.[6]

**Terms caveat:** The official landing page's linked promotion PDF returned NotFound during retrieval.[13]
The official product page supports the tier amounts, fee, deadline and spend windows; confirm the full eligibility/exclusions before implementation.[13]

## Implementation notes

| Item | Note |
|---|---|
| Count | Five added records bring the listed promotion count from four to nine; only one is another route on an existing card (Citi PremierMiles). |
| Paid routes | Citi PremierMiles, Ascend and HSBC TravelOne require annual-fee payment; keep fees visible and disabled in any fee-free preset flow. This file does not alter the app. |
| Cap field | `monthlyCap` is null where no numeric cap is encoded. Trust and Ascend are explicitly uncapped; the other welcome-offer terms do not establish a cap. |
| Status | None is marked historical; all were current on the checked date. Refresh deadlines and terms before later use. |

## Sources

[1] https://milelion.com/credit-cards/current-credit-card-sign-up-bonuses — The MileLion — Current Credit Card Sign Up Bonuses
[2] https://milelion.com/2026/10/08/roundup-credit-card-sign-up-bonuses-october-2026 — The MileLion — October 2026 credit-card sign-up bonus roundup
[3] https://milelion.com/2026/09/20/citi-premiermiles-card-offering-30000-miles-sign-up-bonus-and-s100-trip-com-gift-card — The MileLion — Citi PremierMiles 30,000-mile fee-paying offer
[4] https://milelion.com/2026/10/02/amex-krisflyer-ascend-offering-s100-ecapitavoucher-and-45000-miles-sign-up-bonus — The MileLion — AMEX KrisFlyer Ascend 45,000-mile offer
[5] https://milelion.com/2026/10/05/hsbc-travelone-card-offering-up-to-20000-bonus-miles-and-samsonite-luggage — The MileLion — HSBC TravelOne offer through Oct 2026
[6] https://milelion.com/2026/09/21/details-trust-freedom-card-offering-huge-100000-miles-sign-up-bonus — The MileLion — Trust Freedom 100,000 Max Miles welcome offer
[7] https://www.citibank.com.sg/credit-cards/travel/premiermiles-card/pdf/online-acquisition-offer-30k-miles-tnc.pdf — Citi PremierMiles online acquisition offer terms
[8] https://www.hsbc.com.sg/content/dam/hsbc/sg/documents/credit-cards/travelone/travelone-sign-up-gift-offer-terms-and-conditions.pdf — HSBC TravelOne July–October 2026 sign-up promotion terms
[9] https://www.americanexpress.com/en-sg/campaigns/singapore-airlines-krisflyer-credit-cards-dual/index.html?sourcecode=A0000HCXRF&cpid=100532711 — American Express KrisFlyer cards campaign
[11] https://www.citibank.com.sg/credit-cards/travel/premiermiles-card/pdf/online-acquisition-offer-tnc.pdf?icid=SGLEUJ5ENPREMCAAN17 — Citi PremierMiles fee-paying 30,000-mile offer terms
[13] https://trustbank.sg/freedom-credit-card — Trust Freedom Card product page
[14] https://www.americanexpress.com/content/dam/amex/sg/campaigns/pdfs/kfa-ntb-welcomeoffer-1oct26.pdf — American Express KrisFlyer Ascend new-to-AMEX offer, 1 Oct 2026 terms
[17] https://www.americanexpress.com/content/dam/amex/sg/campaigns/pdfs/krisflyer-credit-card-welcomeoffer.pdf — American Express KrisFlyer Credit Card sign-up promotion terms
