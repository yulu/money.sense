// Singapore resident income tax — pure calculation model.
//
// No DOM, no framework imports: everything here is a plain function over plain
// data, so `model.test.ts` runs under `node --test` with no test harness.
//
// Every rate, cap and threshold arrives via the `config` argument, which Hugo
// renders from data/tools/tax_ya<YEAR>.yml. Nothing is hardcoded here — an
// annual IRAS change is a YAML edit, not a code change.

import type {
    TaxConfig,
    TaxResult,
    ReliefBreakdown,
    ReliefEntries,
    ByChildOrder,
    Child,
    ChildLine,
    FamilyInput,
    FamilyResult,
    ParentDependant,
    ParentLine,
    SiblingDependant,
    SpouseReliefInput,
    Spouse,
    SpouseInput,
    SpouseResult,
} from './types.ts';

/**
 * Caps each entered relief at its own IRAS limit, then applies the overall
 * personal relief cap to the total.
 *
 * Returns the per-relief allowed amounts alongside the totals so the UI can
 * show the taxpayer exactly which entry was trimmed and why.
 */
export function applyReliefs(
    config: TaxConfig,
    entered: ReliefEntries,
): ReliefBreakdown {
    const items = (config.reliefs ?? []).map((relief) => {
        const claimed = Math.max(entered[relief.id] ?? 0, 0);
        // Fixed limit from the data file, narrowed by any derived one.
        const ceiling = Math.min(
            relief.max ?? Infinity,
            derivedCeiling(config, relief.id, entered),
        );
        const allowed = Math.min(claimed, ceiling);
        return {
            id: relief.id,
            claimed,
            allowed,
            cappedByOwnLimit: allowed < claimed,
            // The EFFECTIVE ceiling, so "capped at $X" quotes the limit that
            // actually bit rather than the one in the data file.
            max: Number.isFinite(ceiling) ? ceiling : null,
        };
    });

    const beforeCap = items.reduce((sum, i) => sum + i.allowed, 0);
    const cap = config.relief_cap ?? Infinity;
    const total = Math.min(beforeCap, cap);

    return {
        items,
        beforeCap,
        total,
        cappedByOverallLimit: beforeCap > cap,
        cap,
    };
}

/**
 * Ceilings that depend on the taxpayer's other entries rather than on a fixed
 * figure in the data file.
 *
 * Only Life Insurance Relief works this way: IRAS allows it solely while total
 * CPF contributions are below $5,000, and then only up to the shortfall. Any
 * employee earning about $25,000 or more is already past that, so the honest
 * answer for most readers is a ceiling of zero.
 */
export function derivedCeiling(
    config: TaxConfig,
    id: string,
    entered: ReliefEntries,
): number {
    if (id !== 'life_insurance') return Infinity;
    const li = config.life_insurance;
    if (!li) return Infinity;
    const cpf = Math.max(entered['cpf'] ?? 0, 0);
    return Math.max(li.cpf_threshold - cpf, 0);
}

/**
 * Progressive tax on chargeable income.
 *
 * Walks the bands accumulating tax on the slice of income falling in each.
 * The final band has `upTo: null` and absorbs all remaining income.
 */
export function taxOnChargeableIncome(
    config: TaxConfig,
    chargeableIncome: number,
): number {
    const income = Math.max(chargeableIncome, 0);
    let tax = 0;
    let floor = 0;

    for (const band of config.brackets ?? []) {
        const ceiling = band.upTo === null || band.upTo === undefined
            ? Infinity
            : band.upTo;
        const slice = Math.min(income, ceiling) - floor;
        if (slice <= 0) break;
        tax += slice * band.rate;
        floor = ceiling;
        if (income <= ceiling) break;
    }

    // Guard against binary float drift producing values like 3349.9999999.
    return Math.round(tax * 100) / 100;
}


// ---------------------------------------------------------------------------
// Family model
// ---------------------------------------------------------------------------

/**
 * Looks up an amount by child order, where the highest configured key covers
 * "and beyond" (a 5th child uses the "3" entry when 3 is the last key).
 */
function byOrder(map: ByChildOrder, order: number): number {
    const keys = Object.keys(map).map(Number).sort((x, y) => x - y);
    const last = keys[keys.length - 1] ?? 0;
    const key = Math.min(Math.max(order, keys[0] ?? 1), last);
    return map[String(key)] ?? 0;
}

/**
 * Works out QCR, WMCR and PTR for every child.
 *
 * WMCR runs two regimes side by side: children born from 1 Jan 2024 get a
 * fixed amount, earlier children a percentage of the mother's earned income.
 * A family can hold children under both at once, so this is decided per child
 * rather than per family.
 *
 * The per-child cap ($50,000) applies to QCR and WMCR *combined* on the same
 * child across both parents, and bites on WMCR since QCR is granted first.
 */
export function childReliefs(config: TaxConfig, family: FamilyInput): ChildLine[] {
    const cr = config.child_relief;
    const motherIncome = family[family.mother].income;

    return family.children.map((child: Child): ChildLine => {
        const qcrEntitlement = child.disability ? cr.disability : cr.qcr;
        const qcrA = Math.max(child.qcrA ?? 0, 0);
        const qcrB = Math.max(child.qcrB ?? 0, 0);
        const qcrClaimed = qcrA + qcrB;

        const regime = child.bornFrom2024 ? 'fixed' : 'percentage';
        const wmcrRaw = child.bornFrom2024
            ? byOrder(config.wmcr.fixed, child.order)
            : byOrder(config.wmcr.percentage_of_earned_income, child.order) * motherIncome;

        const headroom = Math.max(cr.per_child_cap - qcrClaimed, 0);
        const wmcr = Math.min(wmcrRaw, headroom);

        return {
            order: child.order,
            qcrEntitlement,
            qcrA,
            qcrB,
            qcrMisallocated: Math.abs(qcrClaimed - qcrEntitlement) > 0.005,
            wmcrRaw: Math.round(wmcrRaw * 100) / 100,
            wmcr: Math.round(wmcr * 100) / 100,
            cappedByPerChildLimit: wmcr < wmcrRaw,
            ptrEntitlement: byOrder(config.ptr.by_child_order, child.order),
            regime,
        };
    });
}

/** What one dependant attracts, before any sharing. */
export function parentEntitlement(config: TaxConfig, d: ParentDependant): number {
    const p = config.parent_relief;
    if (d.disability) {
        return d.coresiding ? p.disability_coresiding : p.disability_not_coresiding;
    }
    return d.coresiding ? p.coresiding : p.not_coresiding;
}

/**
 * Per-dependant working.
 *
 * Shares are capped at the entitlement between them but not forced to reach
 * it: claimants can include siblings outside this calculation, so a couple
 * claiming less than the full amount is a normal case, not an error.
 */
export function parentReliefLines(
    config: TaxConfig,
    parents: ParentDependant[],
): ParentLine[] {
    return parents.map((d) =>
        sharedLine(parentEntitlement(config, d), d.amountA, d.amountB));
}

/** One apportioned claim, scaled back if the two sides overshoot together. */
function sharedLine(entitlement: number, a: number, b: number): ParentLine {
    const wantA = Math.max(a ?? 0, 0);
    const wantB = Math.max(b ?? 0, 0);
    const total = wantA + wantB;
    const scale = total > entitlement && total > 0 ? entitlement / total : 1;
    return {
        entitlement,
        amountA: Math.round(wantA * scale * 100) / 100,
        amountB: Math.round(wantB * scale * 100) / 100,
        overClaimed: total > entitlement,
    };
}

/**
 * Sibling Relief (Disability): a flat $5,500 each, shared by agreement.
 *
 * Same apportionment rules as Parent Relief, but the entitlement never varies
 * — co-residence is a qualifying condition here, not an amount band.
 */
export function siblingReliefLines(
    config: TaxConfig,
    siblings: SiblingDependant[],
): ParentLine[] {
    const amount = config.sibling_relief?.amount ?? 0;
    return (siblings ?? []).map((d) => sharedLine(amount, d.amountA, d.amountB));
}

/** Total shared-dependant relief allowed to one spouse. */
function shareFor(lines: ParentLine[], spouse: Spouse): number {
    return lines.reduce((sum, l) => sum + (spouse === 'a' ? l.amountA : l.amountB), 0);
}

/** What one taxpayer attracts on their spouse, trimmed to the entitlement. */
export function spouseReliefEntitlement(
    config: TaxConfig,
    input: SpouseReliefInput | undefined,
): number {
    const sr = config.spouse_relief;
    if (!sr) return 0;
    return input?.disability ? sr.disability : sr.amount;
}

export function spouseReliefAmount(
    config: TaxConfig,
    input: SpouseReliefInput | undefined,
    spouse: Spouse,
): number {
    if (!input) return 0;
    const want = Math.max((spouse === 'a' ? input.amountA : input.amountB) ?? 0, 0);
    return Math.min(want, spouseReliefEntitlement(config, input));
}

/** Total Parent Relief allowed to one spouse across all dependants. */
export function parentRelief(
    config: TaxConfig,
    parents: ParentDependant[],
    spouse: Spouse,
): number {
    return shareFor(parentReliefLines(config, parents), spouse);
}

/**
 * Tax for one spouse.
 *
 * Order matters and is the whole point of LIT-22's blocker: approved donations
 * are a DEDUCTION from assessable income and are NOT subject to the $80,000
 * relief cap, while personal reliefs are. Folding donations into the capped
 * bucket would make them appear worthless to anyone already at the cap — the
 * opposite of the truth.
 *
 *   chargeable = income - donations x multiplier - min(reliefs, cap)
 */
export function calculateSpouse(
    config: TaxConfig,
    input: SpouseInput,
    allocatedReliefs: number,
    allocatedPtr: number,
): SpouseResult {
    const income = Math.max(input.income ?? 0, 0);
    const own = applyReliefs(config, input.reliefs ?? {});

    // Allocated claims (child + parent reliefs) sit inside the capped bucket.
    const beforeCap = own.beforeCap + Math.max(allocatedReliefs, 0);
    const cap = config.relief_cap ?? Infinity;
    const reliefTotal = Math.min(beforeCap, cap);

    const donationDeduction = Math.max(input.donations ?? 0, 0) * config.donations.multiplier;
    const assessableIncome = Math.max(income - donationDeduction, 0);

    const chargeableIncome = Math.max(assessableIncome - reliefTotal, 0);
    const tax = taxOnChargeableIncome(config, chargeableIncome);

    // PTR is a rebate: it offsets tax, never creates a refund, and any excess
    // carries to future YAs. We surface the unused balance rather than model
    // the carry-forward.
    const ptrApplied = Math.min(Math.max(allocatedPtr, 0), tax);
    const ptrUnutilised = Math.max(allocatedPtr, 0) - ptrApplied;
    const afterPtr = tax - ptrApplied;

    // Budget-granted Personal Income Tax Rebate, applied after PTR. None was
    // granted for YA 2026, so this is zero — but it is data, not an omission,
    // so the calculator stays correct when a rebate returns.
    const rebate = config.personal_rebate ?? { percent: 0, cap: 0 };
    const rebateApplied = Math.min(afterPtr * (rebate.percent ?? 0), rebate.cap ?? 0);

    const netTax = Math.round((afterPtr - rebateApplied) * 100) / 100;

    return {
        income,
        reliefs: {
            ...own,
            beforeCap,
            total: reliefTotal,
            cappedByOverallLimit: beforeCap > cap,
        },
        donationDeduction,
        assessableIncome,
        chargeableIncome,
        tax,
        ptrApplied,
        ptrUnutilised,
        rebateApplied: Math.round(rebateApplied * 100) / 100,
        netTax,
        monthlyTax: Math.round((netTax / 12) * 100) / 100,
        effectiveRate: income > 0 ? netTax / income : 0,
        takeHome: income - netTax,
    };
}

/**
 * Full two-taxpayer calculation.
 *
 * The combined family effective rate is the number worth optimising: shifting
 * an allocation between spouses changes each side's tax, and only the total
 * shows whether the move helped.
 */
export function calculateFamily(config: TaxConfig, family: FamilyInput): FamilyResult {
    const children = childReliefs(config, family);
    const siblings = siblingReliefLines(config, family.siblings ?? []);

    const allocatedFor = (spouse: Spouse): number => {
        const qcr = children.reduce(
            (sum, c) => sum + (spouse === 'a' ? c.qcrA : c.qcrB), 0);
        // WMCR is only ever claimable by the mother.
        const wmcr = family.mother === spouse
            ? children.reduce((sum, c) => sum + c.wmcr, 0)
            : 0;
        const gcrCfg = config.grandparent_caregiver_relief;
        const claimsGcr = !gcrCfg.mother_only || family.mother === spouse;
        const gcr = claimsGcr && family.grandparentCaregiver ? gcrCfg.amount : 0;

        return qcr + wmcr + gcr
            + parentRelief(config, family.parents, spouse)
            + shareFor(siblings, spouse)
            + spouseReliefAmount(config, family.spouseRelief, spouse);
    };

    // Entered, not derived — PTR is one-off and carries forward. See FamilyInput.
    const ptrFor = (spouse: Spouse): number =>
        Math.max((spouse === 'a' ? family.ptrA : family.ptrB) ?? 0, 0);

    const a = calculateSpouse(config, family.a, allocatedFor('a'), ptrFor('a'));
    const b = calculateSpouse(config, family.b, allocatedFor('b'), ptrFor('b'));

    const totalTax = Math.round((a.netTax + b.netTax) * 100) / 100;
    const totalIncome = a.income + b.income;

    return {
        a,
        b,
        children,
        parents: parentReliefLines(config, family.parents),
        siblings,
        totalTax,
        totalIncome,
        familyEffectiveRate: totalIncome > 0 ? totalTax / totalIncome : 0,
        totalPtrUnutilised: a.ptrUnutilised + b.ptrUnutilised,
    };
}
