---
title: "拆解101投连险（101 ILPs）"
date: 2023-12-19T05:35:17+08:00
lastmod: 2023-12-19T05:35:17+08:00
description: "中立的对比101 ILP（投连险），Robo advisor和直接通过券商投资Index ETF的收益和费用，附Python计算脚本"
tags:
- SavingAndInvestment
addtags:
- 数据分析
- 观点
---

{{< toc >}}

我的保险经纪给我推荐了FWD Invest First Plus这个ILP，借机拆解了一下。因为受网上很多负面评价的影响，我本身对ILPs有一定偏见，但是拆解这个产品以后，让我的态度有了一些改观。

> [!caution] 免责声明
> 我没有购买任何ILP，我的投资主要在Robo advisor（Endowus）和券商平台的ETF（FSMOne，IBKR）。ILPs的费用只是其中一个原因，灵活度和沉没成本是最重要的原因。

### 基金选择

FWD提供50+基金选择（[FWD Fund Lab](https://www.fwd.com.sg/personalised-financial-advice/funds))，股、债、货币基金平衡，可以做合理的搭配控制风险。当然相对于Robo advisor和券商平台，基金选择的还是非常有限。可选基金包括S&P500 Index Fund，对于我这样无脑投大盘的投资者是一个选项。

保险经纪极力推荐的Fundsmith Equity Fund，据说是表现非常好的AI Fund(accredited investor Fund)。粗略看这个基金，投资的分布基本是Large-cap+Growth，这个组合就是在控制风险的同时追求增长。过去十年表现良好，当然过去十年大盘也表现很好。我不会分析基金——因为不懂，所以我不会轻易投，[investmentmoats](https://investmentmoats.com/money/fundsmith-equity-funds-performance/)做了很详细的分析。

### 费用

ILP被很多人诟病的一个原因，是它的费用问题。那它到底多贵呢？我看到不少人说，退掉ILP，用Robo。那是不是Robo advisor就更有优势呢？于是我用网上的资源做了一个具体的计算。**以下的计算完全是给予公开信息和基本投资收益假设，不保证绝对准确，更不代表任何投资建议。**

计算数据基于以下假设

#### 投资计划
- 年投入12000 
- 定投15年
- 继续持续增长10年
- 定投S&P500 Index，假设年回报率8%

#### ILP: FWD Investment first plus
- 收费模型：产品费用 - 返利 + 基金管理费用
- 选择基金：[Infinity US 500 Stock Index Fund USD Acc, ISIN: SG9999003297](https://www.fwd.com.sg/personalised-financial-advice/fund-report/?currencyId=USD&languageId=en-GB&id=F0HKG062P3&idCurrencyId=%20&idType=MSID&marketCode=%20), [factsheet](https://lgi.dzhintl.com/doc/uploads/documents/index.php?type=FS&fid=IUSI&lang=EN)
- Expense Ratio from factsheet: [0.61% + 额外保险费用](https://www.comparefirst.sg/wap/prodSummaryPdf/200501737H/WA_Sum_200501737H_ILP03_RP_May2023.pdf)

#### Robo: Endowus
- 收费模型：平台费+基金管理费 - 返利
- 选择基金：[Infinity US 500 Stock Index Fund USD Acc, ISIN: SG9999003297](https://www.fwd.com.sg/personalised-financial-advice/fund-report/?currencyId=USD&languageId=en-GB&id=F0HKG062P3&idCurrencyId=%20&idType=MSID&marketCode=%20), [factsheet](https://lgi.dzhintl.com/doc/uploads/documents/index.php?type=FS&fid=IUSI&lang=EN)
- Expense Ratio from Endowus platform: [0.4%](https://endowus.com/pricing) + [0.32%](https://endowus.com/investment-funds-list/lion-global-infinity-u.s-500-stock-index-fund-SG9999003289)

#### ETF: FSMOne
- 收费模型：交易费 + 基金管理费
- 选择ETF：[SPDR® S&P 500® ETF](https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf)
- 交易费：每年交易四次交易费50（[单次交易费](https://www.fsmone.com.my/etfs/get-started/stock-fees))
- Expose Ratio from factsheet: 0.0945%

#### 计算假设
- 假设投资同一类产品 - S&P500 index： 实际不同平台有不同的投资产品。
- 假设没有波动 ：实际S&P的波动可以到上下40%。
- 假设年定投 ：实际ILP可以选择每月入金，Robo可以无交易费用随时投资，券商平台的交易也很灵活。
- 假设入金除费用外全部投入基金：实际是除券商外，ILP和Robo都会有资金隔离，保证一部分现金收取费用。Robo的隔离资金量很小，ILP的具体投资模式是什么样我不确定。
- 假设无汇率风险。

<details>
  <summary>计算脚本 (展开查看) </summary>

```python
import numpy as np
import pandas as pd
from IPython.display import display
import matplotlib.pyplot as plt

premium = 12000
payment_term = 15
policy_term = 25
irr = 0.08

# ILP Bonus and Fees---------------------
# booster bonus rate
reward_band = lambda a : 4 if (a / 12000 > 4) else int(a / 12000)
booster_bonus_rate_table = np.array([
    [0.17, 0.18, 0.19, 0.20, 0.21], # 15
    [0.17, 0.18, 0.19, 0.20, 0.21], # 16
    [0.17, 0.18, 0.19, 0.20, 0.21], # 17
    [0.17, 0.18, 0.19, 0.20, 0.21], # 18
    [0.17, 0.18, 0.19, 0.20, 0.21], # 19
    [0.20, 0.21, 0.22, 0.23, 0.24], # 24
    [0.20, 0.21, 0.22, 0.23, 0.24], # 24
    [0.20, 0.21, 0.22, 0.23, 0.24], # 24
    [0.20, 0.21, 0.22, 0.23, 0.24], # 24
    [0.20, 0.21, 0.22, 0.23, 0.24], # 24
    [0.26, 0.27, 0.31, 0.32, 0.33], # 25
    [0.26, 0.27, 0.31, 0.32, 0.33], # 26
    [0.26, 0.27, 0.31, 0.32, 0.33], # 27
    [0.26, 0.27, 0.31, 0.32, 0.33], # 28
    [0.26, 0.27, 0.31, 0.32, 0.33], # 29
    [0.27, 0.28, 0.32, 0.33, 0.34], # 30
])
booster_bonus_rate = lambda premium, pt: booster_bonus_rate_table[pt - 15][reward_band(premium)]

# loyalty bonus rate
loyalty_bonus_rate = lambda py: 0.012 if py >= 21 else 0.01 if py >= 11 else 0.007 if py >= 6 else 0

# initial account charge, throughout the premium payment term only, monthly charge
# N is policy year
A = lambda pt: 0.01 if pt >= 30 else 0.012 if pt >= 25 else 0.014 if pt >= 20 else 0.018
inital_account_charge_monthly = lambda premium, pt, N: A(pt) / 12 * premium * N 

# policy charge: start from the 25th policy month (5th year) to the end of policy term
# N is policy year or payment term if policy year passed the term
policy_charge = lambda premium, N, pt: 0.012 / 12 * premium * (N if N <= pt else pt) 

# ---------------------

# Calculation---------------------

fig, ax = plt.subplots()  # Create a figure containing a single axes.

def cal_return(fund_expense_ratio, type_of_investment, fix_fee=0):
    policy_values = [0] * policy_term
    policy_value_total = 0
    fees = [0] * policy_term
    bonuses = [0] * policy_term
    interests = [0] * policy_term
    for N in range(0, policy_term):  
        booster_bonus = 0 if not type_of_investment == 'ILP' else 0 if N > 4 else booster_bonus_rate(premium, payment_term) * premium
        bonuses[N] = int(booster_bonus)
        policy_values[N] = 0 if N >= payment_term else (premium + booster_bonus)
    
        # monthly fee
        yearly_fee = 0
        yearly_interest = 0
        for n in range(0, 12):
            # calculate fee
            fee = 0
            if type_of_investment == 'ILP':
                fee += inital_account_charge_monthly(premium, payment_term, N + 1) if N < payment_term else 0
                fee += 0 if N < 3 else policy_charge(premium, N + 1, payment_term)

            fee += (policy_value_total + policy_values[N]) * (fund_expense_ratio / 12)
            policy_values[N] -= fee
    
            # for record only
            yearly_fee += fee
            
        # add fee
        policy_values[N] -= fix_fee
        yearly_fee += fix_fee
        
        # yearly interest 
        yearly_interest = (policy_value_total + policy_values[N]) * (irr)
        policy_values[N] += yearly_interest
        fees[N] = int(yearly_fee)
        interests[N] = int(yearly_interest)

        # add loyalty_bonus, which paid at the end of policy year based on the policy value
        if type_of_investment == 'ILP':
            loyalty_bonus = 0 if N < 5 else loyalty_bonus_rate(N + 1) * policy_value_total
            policy_values[N] += loyalty_bonus

            # for record
            bonuses[N] += int(loyalty_bonus)

        policy_values[N] = int(policy_values[N])
        policy_value_total += policy_values[N]

    df = pd.DataFrame(data=[policy_values, interests, fees, bonuses])
    transposed_df = df.transpose()
    transposed_df.columns = ['value_per_annual', 'interest', 'fees', 'bonuses']
    display(transposed_df)
    print("Total Value:", sum(policy_values))

    # plot the graph
    ax.plot([i for i in range(1, policy_term + 1)], np.cumsum(policy_values), label=type_of_investment)
    leg = plt.legend(loc='upper center')

cal_return(0.0061, "ILP") # https://lgi.dzhintl.com/doc/uploads/documents/index.php?type=FS&fid=IUSI&lang=EN
cal_return(0.004 + 0.0032, "Robo") # https://endowus.com/investment-funds-list/lion-global-infinity-u.s-500-stock-index-fund-SG9999003289
cal_return(0.000945, "ETF", 50) # https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf
plt.show()
```

</details>

<div>
    <span class="image fit" style="max-width: 1000px;"><img src="https://s3.ap-southeast-1.amazonaws.com/littlecheesecake.me/money.sense/ilp_exploration/money_sense_compare_ilp_robo_etf.excalidraw.png" alt="" /></span>
</div>

<div>
    <span class="image fit" style="max-width: 500px;"><img src="https://s3.ap-southeast-1.amazonaws.com/littlecheesecake.me/money.sense/ilp_exploration/money_sense_ipl_comparison.png" alt="" /></span>
</div>

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

数据仍告诉我们：定投被动指数基金是最有效的低成本、低维护的资产增值方式。但仅仅是历史数据，未来谁都不可以预测！第一个ETF产生于1993，30年前而已，谁知道以后金融会如何发展，说不定比特币统治世界。保持开放心态，持续学习。


### 附录

这是我偶然搜到的一位保险经纪对于ILPs的解释。我以自己目前有限的认知予以反驳。我觉得因为一些误导性的推销话术反而让ILPs诸多诟病：当客户发现这些错误引导后，对ILPs的态度就特别负面。

<div>
    <span class="image fit" style="max-width: 1000px;"><img src="https://s3.ap-southeast-1.amazonaws.com/littlecheesecake.me/money.sense/ilp_exploration/money_sense_incorrect_ilp_explanation.png" alt="" /></span>
</div>

参考：

- [FWD invest first plus product brochure](https://www.fwd.com.sg/wp-content/uploads/2023/12/Invest-First-Plus-Brochure-Q3-2023-6-Dec-2023.pdf)
- [FWD invest first plus product summary](https://www.comparefirst.sg/wap/prodSummaryPdf/200501737H/WA_Sum_200501737H_ILP03_RP_May2023.pdf)
- [Fundsmith equity funds analysis](https://investmentmoats.com/money/fundsmith-equity-funds-performance/)
- [Are ILPs suited for your investment strategy](https://providend.com/are-investment-linked-policies-suited-for-executing-your-investment-strategy/)
- [Don't buy ILPs for right reasons](https://investmentmoats.com/budgeting/insurance/dont-buy-investment-linked-policies-right-reasons/)
