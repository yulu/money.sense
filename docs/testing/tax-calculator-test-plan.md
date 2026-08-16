# Family Income Tax Calculator — Test Plan

Tool: `{{< tool name="tax-family" >}}` · LIT-22 · Year of Assessment 2026

Every expected figure below was **computed from the model in this repo**, not
worked out by hand. Where IRAS publishes a worked example, that example is the
expected value.

---

## 1. What is already automated

`npm test` runs `tsc --noEmit` then 40 tests (`assets/js/tools/tax/*.test.ts`).
These cover the pure model and need no browser:

| Area | Covered |
|---|---|
| Rate table | Tax at **every** band boundary equals IRAS's published Gross Tax Payable |
| IRAS examples | Mrs Teo (mixed WMCR regimes), Mrs Lim (per-child $50k cap), Mrs Chen (PTR wipes out tax) |
| Relief caps | Per-relief limits, the $80,000 overall cap, floor at zero |
| Donations | Uncapped deduction, applied before reliefs |
| Allocation | QCR/PTR/Parent Relief apportionment, WMCR mother-only |
| Rebate | No Personal Income Tax Rebate for YA 2026 |

**The model is not the risk.** Everything in §3–§6 below is the part automated
tests cannot see: the UI, the browser, and whether the numbers reaching the
model are the ones the reader thinks they entered.

---

## 2. Setup

```bash
npm test                      # must be 40/40 before manual testing
hugo server -D --port 1313
```

Open the tax post, which now carries the tool:

- EN <http://localhost:1313/posts/singapore-personal-income-tax-calculator-family/>
- CN <http://localhost:1313/cn/posts/singapore-personal-income-tax-calculator-family/>

> Use `localhost`, not `127.0.0.1`. Hugo emits asset URLs on `localhost`, and
> the mismatch produces spurious CORS errors in the console.

---

## 3. Tax computation (manual spot checks)

Enter values, read the Outcome block. Reliefs not listed are left blank.

### TC-1 — Empty state
No input at all.

| Expect | |
|---|---|
| Total reliefs | 0.00 |
| Net tax payable | $0.00 |
| Effective rate | 0.00% (not `NaN`, not blank) |

### TC-2 — Mixed WMCR regimes
Mrs income `90000`, Earned Income Relief `1000`, two children: child 1 with
**"Born from 1 Jan 2024" unticked**, child 2 ticked.

| Expect | |
|---|---|
| WMCR child 1 | 13,500.00 (15% × 90,000) |
| WMCR child 2 | 10,000.00 (fixed, 2nd child) |
| Total reliefs Mrs | 24,500.00 |
| Net tax payable | $2,335.00 |

*This is IRAS's Mrs Teo example. Both regimes must appear at once.*

### TC-3 — Disability variants
Mrs income `150000`, EIR `4000` (the disability band), one child with
**Disability** ticked and QCR `7500` to Mrs, one dependant co-residing with
**Disability** ticked and `14000` to Mrs.

| Expect | |
|---|---|
| Total reliefs Mrs | 33,500.00 |
| Net tax payable | $7,547.50 |

---

## 4. Donations — the reason this ticket existed

### TC-4 — A donation must still cut tax at the $80,000 cap
Mrs income `300000`, EIR `1000`, CPF `200000` (deliberately far past the cap).

| Step | Total reliefs | Net tax payable |
|---|---|---|
| Donations `0` | 80,000.00 | **$24,950.00** |
| Donations `10000` | 80,000.00 (unchanged) | **$20,250.00** |

**Fail if** the tax does not move. Reliefs must stay pinned at 80,000 while
tax falls — that is the whole point of the fix. A $4,700 saving here is $0
under the old (and the spreadsheet's) treatment.

### TC-5 — Section framing
The donations row must sit under its own heading reading
**"Donations — outside the $80,000 cap"**, *not* under Personal reliefs.

---

## 5. Allocation behaviour

### TC-6 — QCR cells are coupled
One child. Type into the QCR row.

| Action | Mrs | Mr |
|---|---|---|
| default | 4,000 | 0 |
| type Mrs `3000` | 3,000 | **1,000** |
| type Mr `4000` | **0** | 4,000 |
| type Mrs `99999` | **4,000** (clamped) | 0 |
| tick **Disability** | 1,500 → held | absorbs to 7,500 total |

**Fail if** the two cells ever sum to something other than the entitlement.

### TC-7 — Parent Relief is capped, not coupled
One dependant, **Lives with us** ticked (entitlement 9,000).

| Action | Mrs | Mr |
|---|---|---|
| fresh dependant | 0.00 | 0.00 |
| type Mrs `6000`, then Mr `6000` | 6,000.00 | **3,000.00** |
| untick **Lives with us** (→ 5,500) | **5,500.00** | **0.00** |

A forced zero renders as `0.00`, not blank — matching the QCR row, where
pushing the whole claim to one spouse leaves the other at `0.00`.

Claiming *less* than the entitlement is valid — siblings outside this
calculation may take a share. Only over-claiming is prevented.

### TC-8 — Allocation changes the family total
Mrs `40000`, Mr `400000`, EIR `1000` each, one child.

| QCR to | Family total tax |
|---|---|
| Mr (higher earner) | **$61,285.00** |
| Mrs (lower earner) | **$62,070.00** |

The relief is worth more against the higher marginal rate. If both give the
same number, the allocation controls are not reaching the model.

### TC-9 — Mother-only reliefs
WMCR and Grandparent Caregiver Relief must show **—** in the Mr column and
offer no input there, whichever spouse claims QCR.

---

## 6. PTR

### TC-10 — Floors at zero, remainder reported
Mrs income `40000`, EIR `1000`, PTR `20000`.

| Expect | |
|---|---|
| Tax payable | 515.00 |
| Net tax payable | **$0.00** (never negative) |
| Notice | "Unused PTR of $19,485.00 carries forward…" |

### TC-11 — PTR is not generated per child
Add a child. The PTR row must stay **empty** until a figure is entered — it is
a one-off rebate, not an annual entitlement.

---

## 7. UI behaviour

| # | Case | Expect |
|---|---|---|
| TC-12 | Type `4000` in a cell, click away | Displays `4,000.00`; shows raw `4000` when focused again |
| TC-13 | Compare a computed cell with an entered one in the same row | Same font size and format |
| TC-14 | No children added | Grandparent Caregiver Relief row **absent**; PTR row present |
| TC-15 | Tick GCR, then remove the last child | Relief returns to 0 — the hidden row must not keep contributing |
| TC-16 | GCR row | A **checkbox**, never a number field |
| TC-17 | Add 2 dependants | "Add dependant" disappears, replaced by the 2-dependant limit note |
| TC-18 | Remove child 1 of 2 | Remaining child renumbers to **Child 1** and its WMCR/PTR change accordingly |
| TC-19 | Hover any ⓘ | Tooltip appears; only one at a time; does not block clicks on the row above |
| TC-20 | Tab through the grid | ⓘ markers reachable by keyboard; tooltip opens on focus |
| TC-21 | Every line-item row | Carries an ⓘ — none bare |
| TC-21b | Hover an ⓘ, move down to the bubble | Bubble stays open, "Read on IRAS" is clickable and opens the right IRAS page in a new tab; hidden bubbles remain inert |
| TC-22 | Narrow the window to ~390px | **All three columns reachable** by scrolling the grid inside the island; page itself never scrolls sideways. The theme makes `.post-content table` its own scroll container, which once clipped Mr and Family away entirely |

### TC-23 — Invariant: the rows must add up
For any input, each spouse's **Total reliefs** must equal the sum of the
relief figures visible in that column.

*This is the check that caught the worst bug found so far — rows summing to
31,000 while the total read 80,000.*

---

## 8. Content, i18n and integration

| # | Case | Expect |
|---|---|---|
| TC-24 | Load `/cn/posts/…` | All labels, sections and tooltips in Chinese; identical figures |
| TC-25 | Disable JavaScript, reload | Rates table still rendered in the page (SEO / no-JS fallback) |
| TC-26 | View source of any post **without** the shortcode (e.g. the HENRY post) | No `js/tools/tax-family*.js` request |
| TC-27 | Build with `hugo --gc --minify`, serve under `/money.sense/` | Bundle URL resolves; no doubled `/money.sense/money.sense/` path |
| TC-28 | Read the tax post, donations section | Says "deduction", not "relief"; states the cap exclusion; notes the 250% rate runs to 31 Dec 2029 |

---

## 9. Cross-check against the published spreadsheet

**The most valuable test, and the one still outstanding.** The model and its
tests both come from one reading of IRAS, so they agree with each other by
construction. The spreadsheet has been checked against real tax bills.

Enter the sheet's own example — Mrs `120000`, Mr `160000`; EIR `1000` and CPF
`20400` and CPF top-up `8000` each; SRS `5600` / `14100`; two children born
before 2024 with QCR `4000` each to Mr; two co-residing dependants at `9000`
each to Mr; GCR claimed; PTR `10000` to Mr; donations `36` / `228` (cash — the
sheet shows the 2.5× figure).

| | Spreadsheet | This tool | Same? |
|---|---|---|---|
| WMCR | 18,000 / 24,000 | 18,000.00 / 24,000.00 | ✅ |
| Mrs total reliefs | 80,000 | 80,000.00 | ✅ |
| Mr total reliefs | 80,000 | **69,500.00** | ❌ see B |
| Mrs taxable | 40,000 | **39,910.00** | ❌ see A |
| Mrs tax | 550.00 | **546.85** | ❌ see A |
| Mr net tax | 3,150.00 | **0.00** | ❌ see B, C |

Three differences, **all expected, all in the tool's favour**:

**A. Donations sit outside the cap.** The sheet adds the 2.5× donation into
the relief total that is then capped at 80,000, so Mrs's $90 donation is
absorbed and worth nothing. Here it reduces income directly: taxable 39,910
instead of 40,000, tax 546.85 instead of 550.

**B. PTR is a rebate, not a relief.** The sheet lists PTR among the relief
rows feeding "Total Relief" (row 15 into row 22), which is why Mr reaches the
80,000 cap. PTR is applied *after* tax is computed — as IRAS's own Mrs Chen
example shows. Here Mr's reliefs are 69,500, his tax is 4,491.95, and the
$10,000 PTR clears it entirely with **$5,508.05 carried forward**.

**C. No rebate for YA 2026.** The sheet still applies the YA 2025 Personal
Income Tax Rebate (60%, max $200). None was granted for YA 2026.

> **Action for the sheet.** A and B are errors in it, not just version drift.
> B is the larger one, and it runs the *opposite* way to A: treating PTR as a
> relief **overstates** tax, because a dollar of relief only saves you your
> marginal rate while a dollar of rebate saves you a whole dollar. Checked
> across five scenarios, the sheet's figure is never lower than the truth —
> for its own Mr it says $4,491.95 where the answer is $0.00.
>
> Correct or retire the sheet: it is linked and downloadable from the post, so
> it outlives any fix made only to the post.

**Then do the real check:** run 2–3 of your own past years through the tool
and compare against the assessments you actually received.

---

## 10. Regression watch list

**These are all fixed and committed.** They are listed because each was a real
defect in this tool, and several were reintroduced once by a later change — so
they are worth re-checking whenever the surrounding area is touched.

| Fixed defect | Re-check when touching |
|---|---|
| GCR taken as a count × $3,000, so entering `3000` gave $9M, capped to $80,000 | any relief input |
| Hidden rows still contributing to totals | conditional rows |
| Section headings and Add buttons silently right-aligned | grid CSS specificity |
| The family total rendered smaller than the row it sits in | font scale |
| Hidden tooltips intercepting clicks on the row above | tooltip CSS |
| `.RelPermalink` doubling the `/money.sense/` path (production-only) | asset URLs |
| An unknown tool name cascading into a misleading error | the shortcode |

## 11. Status

| | |
|---|---|
| `npm test` (40 automated) | ✅ passing |
| Production build | ✅ clean |
| Tool defects in §10 | ✅ fixed and committed |
| §3–§8 manual cases | ✅ **all 28 run** (2026-08-16). 26 passed first time; TC-22 failed and is fixed; TC-7 showed a formatting inconsistency and is fixed. Both re-tested |
| §9 cross-check | ❌ **outstanding — needs the sheet owner** |
| Spreadsheet errors (§9 A, B, C) | ❌ **not fixed — they are in the published Google Sheet, not this repo** |
| Live post still embeds the Google Sheet | ❌ unchanged; only the donations wording was corrected |
