---
title: "Data Analysis: Dismantle one 101 Investment-Linked Plan (ILP)"
date: 2023-12-19T05:35:17+08:00
description: "A transparent, unbiased comparision of 101 ILP (FWD), Robo Advisor (Endowus) and direct ETF investment, with actual numbers and python scripts."
tags:
- SavingAndInvestment
---

My insurance agent recommended FWD Invest First Plus, an Investment-Linked Plan (ILP), so I took the opportunity to break it down. Influenced by many negative online reviews on ILPs, I had some bias against this type of investment product initially. However, after dissecting this product, my attitude towards it has somewhat changed a little bit.

> Disclaimer: I don't own any ILPs and not plan to purchase any for now. My main investments are in Robo advisors (Endowus) and ETFs on brokerage platforms (FSMOne, IBKR). ILPs' fees are just one reason, flexibility and sunk costs are yet the other important factors.

### Fund Selection

FWD offers over 50 fund choices ([FWD Fund Lab](https://www.fwd.com.sg/personalised-financial-advice/funds)), including a balance of stocks, bonds, and money market funds, allowing for reasonable risk control through diversified combinations. Of course, compared to Robo advisors and brokerage platforms, the fund selection is quite limited. Choices include the S&P500 Index Fund, which is an option for investors like me who prefer a straightforward dollar-cost-averaging index approach.

The Fundsmith Equity Fund, strongly recommended by my insurance agent, is claimed to be an outstanding AI Fund (accredited investor Fund). A quick look at this fund shows that the investment distribution is mainly in Large-cap and Growth, a combination that aims for growth while controlling risk. It has performed well over the past decade, although the overall market has also performed well during that time. I don’t analyze funds myself because I don’t understand them, so I won’t invest in them without thorough analysis. [Investmentmoats](https://investmentmoats.com/money/fundsmith-equity-funds-performance/) has done a detailed analysis.

### Costs

Another reason that ILPs have been criticized by many people is their cost. But how expensive are they really? I’ve seen many people recommend others to cancel ILPs and use Robo advisors instead. Does that mean Robo advisors have more advantages? So, I did a specific calculation using online resources. **The following calculations are based on public information and basic investment return assumptions, and do not guarantee absolute accuracy, nor do they represent any investment advice**.

The calculations are based on the following assumptions:

##### Investment Plan
- Annual contribution of 12,000
- Regular contributions for 15 years
- Let it compound for another 10 years
- Investing in the S&P500 Index with an assumed annual return of 8%

##### ILP: FWD Investment First Plus
- Fee model: Product fees - Bonuses + Fund management fees
- Selected fund: [Infinity US 500 Stock Index Fund USD Acc, ISIN: SG9999003297](https://www.fwd.com.sg/personalised-financial-advice/fund-report/?currencyId=USD&languageId=en-GB&id=F0HKG062P3&idCurrencyId=%20&idType=MSID&marketCode=%20), [factsheet](https://lgi.dzhintl.com/doc/uploads/documents/index.php?type=FS&fid=IUSI&lang=EN)
- Expense Ratio from factsheet: [0.61% + additional insurance fees](https://www.comparefirst.sg/wap/prodSummaryPdf/200501737H/WA_Sum_200501737H_ILP03_RP_May2023.pdf)

##### Robo: Endowus
- Fee model: Platform fee + Fund management fees - Platform rebates
- Selected fund: [Infinity US 500 Stock Index Fund USD Acc, ISIN: SG9999003297](https://www.fwd.com.sg/personalised-financial-advice/fund-report/?currencyId=USD&languageId=en-GB&id=F0HKG062P3&idCurrencyId=%20&idType=MSID&marketCode=%20), [factsheet](https://lgi.dzhintl.com/doc/uploads/documents/index.php?type=FS&fid=IUSI&lang=EN)
- Expense Ratio from Endowus platform: [0.4%](https://endowus.com/pricing) + [0.32%](https://endowus.com/investment-funds-list/lion-global-infinity-u.s-500-stock-index-fund-SG9999003289)

##### ETF: FSMOne
- Fee model: Trading fees + Fund management fees
- Selected ETF: [SPDR® S&P 500® ETF](https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf)
- Trading fees: 50 per year for four trades ([Single trade fees](https://www.fsmone.com.my/etfs/get-started/stock-fees))
- Expense Ratio from factsheet: 0.0945%

##### Assumptions for calculations
- Assume investment in the same type of product - S&P500 index: In reality, different platforms offer different investment products.
- Assume no volatility: In reality, the S&P's volatility can be up to +/- 40%.
- Assume annual contributions: In reality, ILP allows for monthly deposits, Robo allows for investments without transaction fees at any time, and brokerage platforms offer flexible trading.
- Assume all funds are invested except for expenses: In reality, except for brokerage, both ILP and Robo have cash segregation to cover costs. Robo's segregated fund amount is small, and I'm not sure about the specific investment model of ILP.
- Assume no currency risk.

<details>
  <summary>Calculation Script (Click to Open)</summary>
    <script src="https://gist.github.com/yulu/f2a1742fbbccd023def1c80946485519.js"></script>
</details>

<div>
    <span class="image fit" style="max-width: 1000px;"><img src="https://s3.ap-southeast-1.amazonaws.com/littlecheesecake.me/money.sense/ilp_exploration/money_sense_compare_ilp_robo_etf.excalidraw.png" alt="" /></span>
</div>

<div>
    <span class="image fit" style="max-width: 500px;"><img src="https://s3.ap-southeast-1.amazonaws.com/littlecheesecake.me/money.sense/ilp_exploration/money_sense_ipl_comparison.png" alt="" /></span>
</div>

### My Conclusion
- Costs have a significant impact on asset accumulation: **Cost** really **matters** a lot!

- The fees for 101 ILPs are not necessarily higher than those of Robo advisors. Of course, the calculation itself is based on many assumptions, and the complex operations of insurance products may affect returns. ILP products themselves also have policy risks - the potential for insurance companies to change bonus rate and the fee model of sub-funds (as follows):
    - Reserving the right to change the pricing model of subfund
    - We can change the Booster Bonus rates and reward bands at any time
    - We can change the Loyalty Bonus rates at any time
    - Switching charge: we have kept this charge at zero but we may review this in the future. If we change this, we will notify you by giving you 30 days' notice

- In the product description, there is a statement "Reserving the right to change the pricing model of subfund." This raises questions about the actual fees behind ILP funds, which could to some extent affect the calculation. In the calculation above, I used the expense ratio from the Factsheet. The [FWD Fund Lab](https://www.fwd.com.sg/personalised-financial-advice/fund-report/?currencyId=SGD&languageId=en-GB&id=F0HKG062P2&idCurrencyId=%20&idType=MSID&marketCode=%20) website does not provide information about its fees. At least from the Endowus rebate model, the fees for institutional investors in sub-funds are different from those for individual investors. The hidden fees of fund management are difficult to discern in ILPs.

- Compared to Robo advisors, the design of 101 ILPs is too complex, with various benefits and rules that make it feel opaque and uncontrollable. This is typically what makes people skeptical about insurance products, with various hidden terms and layer-by-layer fees.

- The inflexibility of ILPs is a bigger issue. For young people, investing is a continuous learning process, and the biggest criticism of ILPs is the high sunk cost. Robo advisors have low fees, especially for initial capital, and no exit costs. When your assets accumulate to a certain level, you can choose other methods.

- The assumptions above involve mindlessly investing in the S&P 500 Index. In reality, the situation is more complex. Due to the high volatility of the stock market, you cannot time the market and assume there's an upturn in the market when you need the money. In theory, as you approach retirement age, you should adjust the stock-to-bond ratio to reduce risk. Both ILPs and Robo advisors offer combinations of stocks and bonds and automatically balance them. However, on brokerage platforms, you have to manage the allocation yourself, increasing transaction costs. The advantage of ILPs and Robo advisors is that they allow you to go hands-free.

Through the process of dissecting this ILP product step by step, I have learned a lot and have changed my attitude a little bit towards ILPs. I can now view different financial investment products more impartially. Overall, I have a favorable impression of this young insurance company, appreciating its digitization and transparency of information. The low management fees and rebates offered by this product (compared to many other insurance products) have also given me a new perspective on insurance investment products. Additionally, I have gained a better understanding of Robo advisors; I only recently realized that their fees can be quite high! If you have already purchased 101 ILPs, there is no need to panic. Insurance also has its unique benefits, such as asset segregation and estate planning, and can help you accumulate wealth. Robo advisors may not necessarily be the best alternative for insurance-based financial products. Blindly canceling insurance may not be cost-effective. If you lack confidence in managing your assets, insurance can still yield good returns.

Data still tells us this: investing in low-cost index Funds through regular contributions is a cost-effective, low-maintenance way to grow your assets. However, this is based on historical data, and no one can predict the future! The first ETF was created in 1993, just 30 years ago. Who knows how the financial world will develop in the future? Perhaps Bitcoin will rule the world. Keep an open mind and keep learning.

### Appendix

This is an explanation of ILPs that I accidentally came across from an insurance broker. I am refuting it based on my current limited knowledge. I think that some misleading sales tactics have led to many criticisms of ILPs: when customers discover these incorrect guidance, their attitude towards ILPs becomes especially negative.

<div>
    <span class="image fit" style="max-width: 1000px;"><img src="https://s3.ap-southeast-1.amazonaws.com/littlecheesecake.me/money.sense/ilp_exploration/money_sense_incorrect_ilp_explanation_en.png" alt="" /></span>
</div>

Reference:
- [FWD invest first plus product brochure](https://www.fwd.com.sg/wp-content/uploads/2023/12/Invest-First-Plus-Brochure-Q3-2023-6-Dec-2023.pdf)
- [FWD invest first plus product summary](https://www.comparefirst.sg/wap/prodSummaryPdf/200501737H/WA_Sum_200501737H_ILP03_RP_May2023.pdf)
- [Fundsmith equity funds analysis](https://investmentmoats.com/money/fundsmith-equity-funds-performance/)
- [Are ILPs suited for your investment strategy](https://providend.com/are-investment-linked-policies-suited-for-executing-your-investment-strategy/)
- [Don't buy ILPs for right reasons](https://investmentmoats.com/budgeting/insurance/dont-buy-investment-linked-policies-right-reasons/)
