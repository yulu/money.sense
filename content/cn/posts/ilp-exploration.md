---
title: "拆解101连投险（101 ILPs）"
date: 2023-12-19T05:35:17+08:00
tags:
- investment
---

我的保险经纪给我推荐了FWD Invest First Plus这个ILP，借机拆解了一下。因为受网上很多负面评价的影响，我本身对ILPs有一定偏见，但是拆解这个产品以后，让我的态度有了一些改观。

> TL,DR：我没有购买任何ILP，我的投资主要在Robo advisor和券商平台的ETF。ILPs的费用只是其中一个原因，灵活度和沉没成本是最重要的原因。

### 基金选择

FWD提供50+基金选择（[FWD Fund Lab](https://www.fwd.com.sg/personalised-financial-advice/funds))，股、债、货币基金平衡，可以做合理的搭配控制风险。当然相对于Robo advisor和券商平台，基金选择的还是非常有限。选择里包括S&P500 Index Fund，对于我这样无脑投大盘的投资者是一个选项。

保险经纪极力推荐的Fundsmith Equity Fund，据说是表现非常好的AI Fund(accredited investor Fund)。粗略看这个基金，投资的分布基本是Large-cap+Growth，这个组合就是在控制风险的同时追求增长。过去十年表现良好，当然过去十年大盘也表现很好。我不会分析基金——因为不懂，所以我不会轻易投，[investmentmoats](https://investmentmoats.com/money/fundsmith-equity-funds-performance/)做了很详细的分析。

### 费用

ILP背很多人诟病的另一个原因，是它的费用问题。那它到底贵多少。我看到不少人说，退掉ILP，用Robo。那是不是Robo advisor就更有优势呢？于是我用网上的资源做了一个具体的计算。（*以下的计算完全是给予公开信息和基本投资收益假设，不保证绝对准确，更不代表任何投资建议。）

计算数据基于以下假设

##### 投资计划
- 年投入12000 
- 定投15年
- 继续持续增长10年
- 定投S&P500 Index，假设年回报率8%

##### ILP: FWD Investment first plus
- 收费模型：产品费用 - 返利 + 基金管理费用
- 选择基金：[Infinity US 500 Stock Index Fund USD Acc, ISIN: SG9999003297](https://www.fwd.com.sg/personalised-financial-advice/fund-report/?currencyId=USD&languageId=en-GB&id=F0HKG062P3&idCurrencyId=%20&idType=MSID&marketCode=%20), [factsheet](https://lgi.dzhintl.com/doc/uploads/documents/index.php?type=FS&fid=IUSI&lang=EN)
- Expense Ratio from factsheet: [0.61% + 额外保险费用]((https://www.comparefirst.sg/wap/prodSummaryPdf/200501737H/WA_Sum_200501737H_ILP03_RP_May2023.pdf))

##### Robo: Endowus
- 收费模型：平台费+基金管理费-返利
- 选择基金：[Infinity US 500 Stock Index Fund USD Acc, ISIN: SG9999003297](https://www.fwd.com.sg/personalised-financial-advice/fund-report/?currencyId=USD&languageId=en-GB&id=F0HKG062P3&idCurrencyId=%20&idType=MSID&marketCode=%20), [factsheet](https://lgi.dzhintl.com/doc/uploads/documents/index.php?type=FS&fid=IUSI&lang=EN)
- Expense Ratio from Endowus platform: [0.4%](https://endowus.com/pricing) + [0.32%](https://endowus.com/investment-funds-list/lion-global-infinity-u.s-500-stock-index-fund-SG9999003289)

##### ETF: FSMOne
- 收费模型：交易费+基金管理费
- 选择ETF：[SPDR® S&P 500® ETF](https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf)
- 交易费：每年交易四次交易费50（[单次交易费](https://www.fsmone.com.my/etfs/get-started/stock-fees))
- Expose Ratio from factsheet: 0.0945%

##### 计算假设
- 假设投资同一类产品 - S&P500 index： 实际不同平台有不同的投资产品。
- 假设没有波动率 ：实际S&P的波动可以到上下40%。
- 假设年定投 ：实际ILP可以选择每月入金，Robo可以无交易费用随时投资，券商平台的交易也很灵活。
- 假设入金除费用外全部投入基金：实际是除券商外，ILP和Robo都会有资金隔离，保证一部分现金收取费用。Robo的隔离资金量很小，ILP的具体投资模式是什么样我不确定。
- 假设无汇率风险。

<details>
  <summary>计算脚本 (展开查看) </summary>
    <script src="https://gist.github.com/yulu/f2a1742fbbccd023def1c80946485519.js"></script>
</details>

<div>
    <span class="image fit" style="max-width: 1000px;"><img src="https://s3.ap-southeast-1.amazonaws.com/littlecheesecake.me/money.sense/ilp_exploration/money_sense_compare_ilp_robo_etf.excalidraw.png" alt="" /></span>
<div>

<div>
    <span class="image fit" style="max-width: 500px;"><img src="https://s3.ap-southeast-1.amazonaws.com/littlecheesecake.me/money.sense/ilp_exploration/money_sense_ipl_comparison.png" alt="" /></span>
<div>

### 我的总结
- 费用对资产的累积有很大的影响：**Cost** really **matters** a lot!

- 101 ILPs的费用并没有比Robo advisor高。当然计算本身很多假设性，保险产品的复杂操作可能会影响收益。ILPs产品本身也存在政策风险，boost bonus，loyalty bonus，包括基金收费模型保险公司有权更改（如下）: 
    - Reserving the right to change the pricing model of subfund
    - We can change the Booster Bonus rates and reward bands at any time
    - We can change the Loyalty Bonus rate at any time
    - Switching charge: we have kept this charge at zero but we may review this in future. If we change this, we will notify you by giving you 30 days' notice

- 产品介绍里有一条"Reserving the right to change the pricing model of subfund"。这让产生我疑问：ILP背后Fund的费用到底是多少，这可能一定程度上影响计算。上面的计算我使用了Factsheet里的expense ratio。在[FWD Fund Lab](https://www.fwd.com.sg/personalised-financial-advice/fund-report/?currencyId=SGD&languageId=en-GB&id=F0HKG062P2&idCurrencyId=%20&idType=MSID&marketCode=%20)网站上并不能看到它的费用。至少从Endowus的返利模型上看，机构投资Sub-fund的费用和个人投资者是不一样的。基金管理的隐形费用在ILP里很难看出来。

- 相比Robo，101 ILPs的设计太复杂，其中的各种福利和规则让人感觉不透明和无掌控感，也就是通常大家觉得保险公司各种隐型条款，层层收费，对此信心不足。

- ILPs灵活度太低是更大的问题。对于年轻人，投资是一个持续学习的过程，ILPs最大的诟病，是沉没成本太高。Robo advisor在初始资金少的情况下，费用低，也没有退出成本。资产累计到一定程度可以选择其他的方式。

- 以上的假设是无脑定投标普500指数。实际情况要更复杂。因为股票市场的高波动性，很难保证在我们需要用钱时市场状况好。理论上在逐步接近退休年龄时，我们需要调整股债比例降低风险。ILPs和Robo都选择股债组合的搭配，自动平衡。而券商平台上只能自己调配，增加交易成本。ILPs和Robo的优势就是可以让你做到hands-free。


在逐步拆解这个ILP产品过程中我也学到很多，对ILPs的态度有了改观，可以更中立的去看待不同的理财投资产品。总体来说，我对这家年轻的保险公司印象不错，比较认可它的电子化，信息透明度。这个产品的低管理费和返利力度（相比于其他很多保险产品），也让我对保险投资产品有了新的看法。以及更好的认识了Robo advisor——我才意识到它费用其实很高！如果已经购买101 ILPs，没有必要焦虑，保险也有独特的好处，比如资产隔离，遗产规划等，本身也可以很好的累积财富。而Robo advisor也不一定是保险理财产品的最佳替代方式。盲目退保可能得不偿失，如果没有信心自己管理资产，那安心的供保也会有很好的收益。

数据仍告诉我们：定投指数ETF是低成本、低维护的资产增值方式。但仅仅是历史数据，未来谁都不可以预测！第一个ETF产生于1993，30年前而已，谁知道以后金融会如何发展，说不定比特币统治世界。保持开放心态，持续学习。


### 附录

这是我偶然搜到的一位保险经纪对于ILPs的解释。我以自己目前有限的认知予以反驳。我觉得因为一些误导性的推销话术反而让ILPs诸多诟病：当客户发现这些错误引导后，对ILPs的态度就特别负面。

<div>
    <span class="image fit" style="max-width: 1000px;"><img src="https://s3.ap-southeast-1.amazonaws.com/littlecheesecake.me/money.sense/ilp_exploration/money_sense_incorrect_ilp_explanation.png" alt="" /></span>
<div>

参考：

- [FWD invest first plus product brochure](https://www.fwd.com.sg/wp-content/uploads/2023/12/Invest-First-Plus-Brochure-Q3-2023-6-Dec-2023.pdf)
- [FWD invest first plus product summary](https://www.comparefirst.sg/wap/prodSummaryPdf/200501737H/WA_Sum_200501737H_ILP03_RP_May2023.pdf)
- [Fundsmith equity funds analysis](https://investmentmoats.com/money/fundsmith-equity-funds-performance/)
- [Are ILPs suited for your investment strategy](https://providend.com/are-investment-linked-policies-suited-for-executing-your-investment-strategy/)
- [Don't buy ILPs for right reasons](https://investmentmoats.com/budgeting/insurance/dont-buy-investment-linked-policies-right-reasons/)
