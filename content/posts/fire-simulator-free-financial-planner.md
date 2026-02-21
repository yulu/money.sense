---
title: "I Built a Free Financial Planner — Here's the Story Behind It"
date: 2026-02-20T09:00:00+08:00
description: "A personal finance tool built out of frustration with spreadsheets and the need to see the full picture — portfolio, insurance, budget, and FIRE path — all in one place."
tags:
  - MoneyPhilosophy
addtags:
  - Tools
  - MoneyStory
---

<video width="100%" controls>
  <source src="https://s3.ap-southeast-1.amazonaws.com/littlecheesecake.me/fire-simulator/demo-video.mp4" type="video/mp4">
</video>

Five years ago, I started tracking my finances in a spreadsheet. One sheet for CPF balances. Another for brokerage positions. A third for insurance premiums. A fourth for monthly expenses. A fifth — okay, you get the idea.

Every quarter when I wanted to answer a simple question — *"Am I on track to retire at xx?"* — I had to manually cross-reference five different tabs, do mental gymnastics across different units (annual vs monthly, SGD vs USD), and still end up with a number I wasn't confident in.

I kept thinking: there has to be a better way.

There wasn't — at least not one that fit how I think about money. So I built it myself.

## 🤔 Why Existing Tools Didn't Work for Me

Before building anything, I spent time with every tool I could find. Mint, YNAB, local robo-advisor dashboards, and a handful of Singapore-specific finance apps. None of them clicked.

The problems were consistent:

**Too narrow.** Most budgeting apps track spending but ignore your investment portfolio. Most investment trackers ignore your insurance coverage. Real financial health requires seeing all of these together.

**Wrong context.** CPF is a central pillar of Singapore retirement planning, but most apps treat it as an afterthought — or ignore it entirely. The interplay between CPF, SRS, and your taxable investment accounts matters enormously here.

**No path to the future.** Knowing your current net worth is useful. Knowing whether you'll run out of money at age 70 is more useful. Almost no consumer tools show you the projection — the FIRE path — without a paywall or a financial advisor appointment.

**Built for someone else.** I'm in the sandwich generation: two kids, aging parents, a mortgage, and a career I still care about. The tools felt designed either for fresh graduates tracking lattes or retirees managing drawdowns. Not for me, mid-journey, with real complexity.

> [!note] What I Actually Needed
> One place to see my full financial picture — assets, coverage gaps, spending reality, and whether my current plan gets me to financial independence — without needing to open five tabs or call my FA.

## 🛠️ What I Built

The result is a browser-based financial planner. Think of it as an interactive financial dashboard you build once and return to when your situation changes.

Here's what it covers:

### 📊 Portfolio Management

This was the starting point because you can't plan a future if you don't know your present.

The portfolio view lets you input everything that counts as a financial asset:

- Emergency fund and cash savings
- CPF (OA, SA, MA separately — because the distinctions matter for planning)
- Properties — both your home and any investment properties
- Low-risk investments: bonds, money market funds, fixed deposits
- Higher-risk investments: equities, REITs, alternatives

The output is a portfolio health snapshot — a pie chart of your overall allocation and a separate view of your pure financial assets (excluding primary residence). If you've ever wondered what your actual stock-bond ratio is across CPF and your brokerage accounts combined, this is where you see it.

I personally discovered that my CPF makes up nearly 50% of my total financial assets — higher than I intended. That single insight reshaped how I thought about my DCA strategy for the next few years.

> [!idea] Try This
> Add your CPF balances alongside your brokerage holdings and see your real asset allocation for the first time. Most people are surprised.

### ⛑️ Insurance Planner

This was the most tedious feature to build — and probably the most valuable.

The insurance planner lets you consolidate every policy across your family into a single matrix:

| Insured | Product | Insurer | Sum Assured | Premium | Payee | Coverage End |
|---------|---------|---------|-------------|---------|-------|--------------|
| You | ... | ... | ... | ... | ... | ... |

Most families accumulate policies over years: employer group insurance, personal term plans, riders, whole life policies from a decade ago. They rarely exist in one place. When a claim happens, the scramble begins.

The planner supports all major coverage types: health, critical illness, life, long-term care, accident, and general insurance (home, helper, car). The goal isn't to tell you what to buy — it's to make visible what you already have, where the gaps are, and what the coverage costs you in total.

My family's total insurance spend is $2,446/month covering six people. I only understood that number clearly once everything was in one place.

> [!warning] Coverage Gaps Are Invisible Until They're Not
> Many families discover they have duplicated accident coverage but no long-term care protection, or a life policy on the breadwinner but none on the stay-at-home spouse. The matrix makes these patterns obvious.

### 🛒 Budgeting

Not another expense tracker. This is intentionally a *budget planner* — you work from targets, not receipts.

Three spending buckets, based on how most Singapore households actually structure their outflows:

**Fixed** — Housing loan, insurance, property maintenance, helper, childcare, utilities, phone/internet

**Essential** — Groceries, weekday food, weekend dining, transportation, medical bills, home maintenance

**Flexible** — Family shopping, kids' enrichment, travel and entertainment

The point isn't granular tracking. It's to get your monthly spending number close enough to reality that you can feed it into the FIRE path projection. A rough budget that you actually maintain beats a detailed one you abandon in March.

> [!tip] The 50/30/20 Myth
> That rule doesn't fit Singapore. A mortgage alone can be 30% of take-home pay for many households, and insurance for a family of four easily runs $1,500–$2,000/month. Build your budget from your actual fixed commitments outward, not from a generic ratio.

### 🔥 FIRE Path Builder

This is the feature I built the whole app around.

Input your:
- Current age and target retirement age
- Current net worth (financial assets only)
- Expected annual investment return
- Monthly household spending (pulled from your budget)
- Any large upcoming milestones — property purchase, kids' university fees, a career break

The output is a time-series projection of your net worth from today to retirement. You can see whether your current savings rate and investment return will get you across the line — and by how much.

It also lets you model scenarios. What if markets return 5% instead of 7%? What if you take a two-year career break in 2029? What if university fees for two kids costs $120,000 total? You move the sliders and watch the projection change.

This was the question I was trying to answer every quarter with my five-tab spreadsheet: *Am I on track?* Now it's one screen.

> [!idea] The Most Useful Thing You Can Do Today
> Plug in your actual spending number, your current investable net worth, and your target retirement age. See the result. If the line doesn't cross the threshold, that tells you exactly what levers you need to pull — save more, earn more, spend less, or retire later.

## 🚀 How to Get Started

The tool ships with sample data so you can explore before inputting anything personal. There's also an export feature to save your data as a file and reimport it later — useful if you clear your browser or switch devices.

No account. No cloud sync. Your data doesn't leave your browser.

If you've been doing your financial planning across multiple spreadsheets, or if you've been meaning to *start* but weren't sure how to structure it — this is built for exactly that gap.

Five years ago I had no investments and no system. What changed wasn't income — it was visibility. Seeing the full picture clearly made better decisions feel obvious rather than overwhelming.

Start with whatever piece feels most urgent: your portfolio allocation, your insurance gaps, your spending reality, or your FIRE timeline. The tool will hold all of it for you.

{{< tool-promo >}}
