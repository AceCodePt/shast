# dense-below-fold — opencode/minimax-m2.5

- arm: `resolved`
- probes: content past the fold, which a viewport screenshot cannot show
- expected: NO — it starts at y=978 in an 800px-tall viewport
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7473ms

## Question

Is the text in `root>main>r36` visible when the page first loads, without scrolling?

## Context shown to the model


```
viewport 1280x800
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root           div
  @ x=0 y=0 width=1280 height=1500
  = position: relative, width: 1280px, height: 1500px, font-size: 15px, line-height: 20px, background-color: #ffffff

root>masthead  header   "Quarterly operations review"
  @ x=0 y=0 width=1280 height=56
  = font-size: 15px (inherited), height: 56px, padding: 16px, background-color: #1a2233, color: #ffffff

root>sidebar   nav      "Navigation"
  @ x=0 y=56 width=220 height=760
  = font-size: 15px (inherited), position: absolute, left: 0px, top: 56px, width: 220px, height: 760px, padding: 12px, background-color: #eef1f5

root>main      section
  @ x=0 y=56 width=1280 height=1052  covered
  = padding-left: 244px, padding-right: 24px, padding-top: 12px
  ! covered: root>sidebar <nav> (absolute) paints later than this node, with an opaque background, over 12% of the box

root>main>r01  div      "01. Ledger reconciliation"
  @ x=244 y=68 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r02  div      "02. Vendor onboarding"
  @ x=244 y=94 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r03  div      "03. Tax residency review"
  @ x=244 y=120 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r04  div      "04. Payroll variance"
  @ x=244 y=146 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r05  div      "05. Depreciation schedule"
  @ x=244 y=172 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r06  div      "06. Intercompany transfers"
  @ x=244 y=198 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r07  div      "07. Revenue recognition"
  @ x=244 y=224 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r08  div      "08. Deferred costs"
  @ x=244 y=250 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r09  div      "09. Currency hedging"
  @ x=244 y=276 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r10  div      "10. Accrual adjustments"
  @ x=244 y=302 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r11  div      "11. Capital expenditure"
  @ x=244 y=328 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r12  div      "12. Lease liabilities"
  @ x=244 y=354 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r13  div      "13. Goodwill impairment"
  @ x=244 y=380 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r14  div      "14. Share-based payments"
  @ x=244 y=406 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r15  div      "15. Segment reporting"
  @ x=244 y=432 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r16  div      "16. Related party notes"
  @ x=244 y=458 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r17  div      "17. Inventory valuation"
  @ x=244 y=484 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r18  div      "18. Bad debt provision"
  @ x=244 y=510 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r19  div      "19. Cash flow bridging"
  @ x=244 y=536 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r20  div      "20. Covenant testing"
  @ x=244 y=562 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r21  div      "21. Treasury positions"
  @ x=244 y=588 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r22  div      "22. Audit findings"
  @ x=244 y=614 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r23  div      "23. Statutory filings"
  @ x=244 y=640 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r24  div      "24. Board attestation"
  @ x=244 y=666 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r25  div      "25. Hedge effectiveness"
  @ x=244 y=692 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r26  div      "26. Transfer pricing"
  @ x=244 y=718 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r27  div      "27. Escrow releases"
  @ x=244 y=744 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r28  div      "28. Warranty reserves"
  @ x=244 y=770 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r29  div      "29. Restructuring costs"
  @ x=244 y=796 width=1012 height=26
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r30  div      "30. Pension obligations"
  @ x=244 y=822 width=1012 height=26  below-fold
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r31  div      "31. Minority interests"
  @ x=244 y=848 width=1012 height=26  below-fold
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r32  div      "32. Asset retirement"
  @ x=244 y=874 width=1012 height=26  below-fold
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r33  div      "33. Contract assets"
  @ x=244 y=900 width=1012 height=26  below-fold
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r34  div      "34. Loyalty liabilities"
  @ x=244 y=926 width=1012 height=26  below-fold
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r35  div      "35. Grant amortisation"
  @ x=244 y=952 width=1012 height=26  below-fold
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r36  div      "36. Royalty accruals"
  @ x=244 y=978 width=1012 height=26  below-fold
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r37  div      "37. Insurance recoveries"
  @ x=244 y=1004 width=1012 height=26  below-fold
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r38  div      "38. Litigation provisions"
  @ x=244 y=1030 width=1012 height=26  below-fold
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r39  div      "39. Dividend policy"
  @ x=244 y=1056 width=1012 height=26  below-fold
  = font-size: 15px (inherited), padding-bottom: 6px

root>main>r40  div      "40. Subsequent events"
  @ x=244 y=1082 width=1012 height=26  below-fold
  = font-size: 15px (inherited), padding-bottom: 6px

root>footer    footer   "Generated automatically — do not edit"
  @ x=0 y=1108 width=1280 height=44  below-fold
  = font-size: 15px (inherited), padding: 12px, background-color: #f3f4f6
```

## Model reply

The viewport is 1280x800, so only content with y < 800 is visible without scrolling. `root>main>r36` is at y=978 with height=26, extending to y=1004, well past the 800px viewport bottom. The report also explicitly tags it as "below-fold".

ANSWER: NO
