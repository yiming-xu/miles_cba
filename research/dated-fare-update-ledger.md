# Dated economy fare update

Prior deployment: a7d20411f7f1e8e84b35b92eee139eb30bbcc0ab. Prior economy assumptions (route order DPS/BKK/HKG/PVG/DEL/HND/PER/SYD/DXB/LHR/SFO/JFK): 200/180/250/350/350/450/300/500/550/700/850/1000 SGD.

Executed locally: replaced all 12 with dated Google Flights listings for 1 June 2027, one-way economy, one adult, SGD. Route records retain source URL, airline, routing, local times and caveats. HND recheck returned858, superseding the earlier810 listing; other selected listings267/272/390/340/353/738/669/476/977/626/1005. Shanghai and New York involve connections. No purchases, award inventory or airline checkout verified.

Slides use route economy amount from shared data; default858+150=1008 value,370 cost,638 net. Default10 earning months still exceeds7 full calendar months until travel. Listings are dated, not live feeds. Paid offers and award model unchanged.

Scope: research-data.js, app.js, index.html, slides.html, README.md, tests and this ledger. Verification and deployment to be completed before final report.

Rollback: in deployment checkout, git revert <commit for this dated-fare update>, then push origin main using approved project runner. This restores files, not remote fare availability. Prior commit above provides exact baseline. Unrelated untracked Node assets untouched.
