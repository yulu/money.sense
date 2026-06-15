---
title: "Singapore Medical Insurance Explained: An Interactive Guide"
date: 2026-06-13T00:00:00+08:00
lastmod: 2026-06-14T00:00:00+08:00
description: "Everything you need to know about Singapore's Integrated Shield Plans — how the layered system works, the 7 insurers, 4 coverage tiers, what riders cover, and the major regulatory reforms of 2019 and 2026."
series: "Singapore IP Insurance"
series_order: 1
draft: true
tags:
  - Insurance
addtags:
  - Tools
---

<script>
  window.addEventListener("message", function(e) {
    if (e.data && e.data.type === "sgip-embed-height") {
      var iframes = document.querySelectorAll("iframe[id^='sgip-embed-']");
      for (var i = 0; i < iframes.length; i++) {
        if (iframes[i].contentWindow === e.source) {
          iframes[i].style.height = e.data.height + "px";
          break;
        }
      }
    }
  });
</script>

{{< toc >}}

> [!info] Last updated June 2026
> Reflects the current IP insurance landscape, including the April 2026 rider regulation changes announced by MOH in November 2025.

The first time I had to actually use my Integrated Shield Plan — not just renew it — I realised I didn't really understand it. I knew we had coverage. I didn't know what ward class it applied to, how much I'd owe after the deductible, or whether the rider I'd been paying for every year even mattered.

Medical insurance is one of those things that feels urgent to sort out and easy to ignore until the day you actually need it. By the time you're sitting in a hospital ward, figuring out your policy is the last thing you want to be doing. You might reach for your insurance agent — but as I found out when navigating my mother's cancer treatment, agents don't always have the right answers, and sometimes give confidently wrong ones. I filed a formal complaint and escalated to MAS; [that story is here](/posts/singapore-cancer-care-insurance-agent-negligence/).

The more I dug in, the more I realised the system isn't actually that complicated — it just isn't explained well. This post is what I wish I had read earlier. Instead of a wall of text, I've put together a set of interactive tools that let you explore the system at your own pace — the layered structure, what each of the 7 insurers offers, how riders work, and what your real out-of-pocket looks like under different scenarios.


### Singapore's Medical Insurance Structure

Singapore's medical insurance operates in layers: **MediShield Life** (mandatory, with claims capped at Class B2-ward bill sizes at public hospitals) sits at the base, with an **IP** extending coverage to higher ward classes or private hospitals on top, and optional **riders** covering the remaining cost-sharing. *Tap the layers to explore.*

<iframe
  src="https://sgip.littlecheesecake.me/embed/ip-pyramid"
  width="100%"
  height="500"
  frameborder="0"
  style="border:none;"
  id="sgip-embed-ip-pyramid"
></iframe>

*Source: [MediShield Life – How It Works](https://www.cpf.gov.sg/member/healthcare-financing/medishield-life), CPF Board*
 · *[Integrated Shield Plan](https://www.cpf.gov.sg/member/healthcare-financing/getting-supplementary-coverage/integrated-shield-plan), CPF Board*


### What Options Do We Have?

#### 4 Coverage Tiers

IPs are categorized by ward type, from the base Standard B1 tier up to private hospital coverage. *Select a tier to see its details.*

<iframe
  src="https://sgip.littlecheesecake.me/embed/coverage-tiers"
  width="100%"
  height="500"
  frameborder="0"
  style="border:none;"
  id="sgip-embed-coverage-tiers"
></iframe>

#### 7 Approved Insurers

MOH approves seven private insurers to offer IPs. The MediShield Life component is identical across all plans — the private insurer component, pricing, and terms vary. *Select an insurer to see their plans and riders.*

<iframe
  src="https://sgip.littlecheesecake.me/embed/insurers-overview"
  width="100%"
  height="500"
  frameborder="0"
  style="border:none;"
  id="sgip-embed-insurers-overview"
></iframe>

*Source: [Comparison of Integrated Shield Plans](https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/integrated-shield-plans/comparision-of-integrated-shield-plans/), MOH* 


### How Does Coverage Work?

#### Coverage Categories

IP insurance covers more than just the hospital stay — benefits extend to pre- and post-hospitalisation care and select outpatient treatments. *Switch between the tabs to explore.*

<iframe
  src="https://sgip.littlecheesecake.me/embed/coverage-benefits"
  width="100%"
  height="500"
  frameborder="0"
  style="border:none;"
  id="sgip-embed-coverage-benefits"
></iframe>

#### Deductible and Co-Insurance

When you submit a claim, the bill is split between you and your insurer based on your deductible and co-insurance amounts. If you also have company group insurance, the claim order matters — your personal IP acts as the last payer. I went through this firsthand and wrote up [a practical guide on claim order here](/posts/singapore-hospitalization-insurance-order-of-claims/).

<iframe
  src="https://sgip.littlecheesecake.me/embed/coverage-explained"
  width="100%"
  height="500"
  frameborder="0"
  style="border:none;"
  id="sgip-embed-coverage-explained"
></iframe>

### What Do Riders Cover?

#### Rider Coverage

Riders are optional add-ons that go beyond your IP base plan. They cover the cost-sharing portions — deductible and co-insurance — that you would otherwise pay out of pocket, and many also enhance cancer coverage and include additional benefits such as emergency assistance. *Tap the rider types to see what each covers.*

<iframe
  src="https://sgip.littlecheesecake.me/embed/riders-explained"
  width="100%"
  height="500"
  frameborder="0"
  style="border:none;"
  id="sgip-embed-riders-explained"
></iframe>

#### Rider Regulations

Rider design has been shaped by two rounds of MOH regulation — in 2019 and again in 2026 — each time raising the cost-sharing floor to address rising premiums. I wrote about my personal take on these changes, including why I actually support them, in [Singapore Integrated Shield Plan Rider Change: My Opinions](/posts/singapore-insurance-health-insurance-rider/).

<iframe
  src="https://sgip.littlecheesecake.me/embed/rider-regulations"
  width="100%"
  height="500"
  frameborder="0"
  style="border:none;"
  id="sgip-embed-rider-regulations"
></iframe>

*Sources: [MOH New Requirements for IP Riders (Nov 2025)](https://www.moh.gov.sg/newsroom/new-requirements-for-integrated-shield-plan-riders-to-strengthen-sustainability-of-private-health-insurance-and-address-rising-healthcare-costs/) · [MOH New IP Riders](https://www.moh.gov.sg/newipriders/)*

### Putting it All Together - How Much You Need to Pay?

Understanding each layer in isolation is useful — seeing them stack on a real bill is what makes the system click. The calculator below lets you select a bill size and choose whether you're using a **panel** or **non-panel** provider. It shows how the cost is split across your IP insurer and what you'll owe out of pocket. *Enter a bill size and select a provider type to explore your numbers.*

<iframe
  src="https://sgip.littlecheesecake.me/embed/sample-calculation"
  width="100%"
  height="500"
  frameborder="0"
  style="border:none;"
  id="sgip-embed-sample-calculation"
></iframe>


---

_This post is part one of a two-part series on Singapore IP insurance. [Part two](/posts/singapore-ip-premium-comparison/) covers premium comparison across all 7 insurers and my personal take on choosing a plan._
