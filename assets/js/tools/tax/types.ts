// Shape of the config Hugo renders from data/tools/tax_ya<YEAR>.yml.
//
// These types are the contract between the YAML and the code. If the data file
// grows a field the model doesn't expect — or loses one it relies on — the
// mismatch surfaces at `npm run typecheck` rather than as a wrong number.

/** A progressive tax band. `upTo: null` marks the open-ended top band. */
export interface Band {
    upTo: number | null;
    rate: number;
    /** IRAS's published "Gross Tax Payable" on the first `upTo` dollars. */
    cumulative: number | null;
}

/** Earned Income Relief band. `maxAge: null` marks the oldest band. */
export interface AgeBand {
    maxAge: number | null;
    amount: number;
}

/** A user-entered relief. `max: null` means no per-relief cap. */
export interface ReliefDef {
    id: string;
    max: number | null;
    i18n: string;
    /** Optional i18n key for a bespoke explanation, beyond the cap text. */
    info?: string;
    href: string;
}

export interface ChildReliefConfig {
    href?: string;
    qcr: number;
    disability: number;
    /** Total QCR + WMCR claimable on one child, across both parents. */
    per_child_cap: number;
    child_income_threshold: number;
}

/** Amounts keyed by child order; the highest key covers "and beyond". */
export type ByChildOrder = Record<string, number>;

export interface WmcrConfig {
    href?: string;
    fixed: ByChildOrder;
    percentage_of_earned_income: ByChildOrder;
}

export interface PtrConfig {
    href?: string;
    by_child_order: ByChildOrder;
}

export interface ParentReliefConfig {
    href?: string;
    coresiding: number;
    not_coresiding: number;
    disability_coresiding: number;
    disability_not_coresiding: number;
    dependant_income_threshold: number;
    min_support_if_not_coresiding: number;
    max_dependants: number;
}

export interface DonationConfig {
    href?: string;
    multiplier: number;
    /** Always false — donations are a deduction, not a personal relief. */
    subject_to_relief_cap: boolean;
}

export interface GrandparentCaregiverConfig {
    href?: string;
    amount: number;
    mother_only: boolean;
    caregiver_income_threshold: number;
}

/** Budget-granted rebate on tax payable. Zero for YA 2026. */
export interface PersonalRebateConfig {
    percent: number;
    cap: number;
}

export interface TaxConfig {
    year_of_assessment: number;
    income_year: number;
    source_url: string;
    brackets: Band[];
    relief_cap: number;
    earned_income_relief: { standard: AgeBand[]; disability: AgeBand[] };
    reliefs: ReliefDef[];
    child_relief: ChildReliefConfig;
    wmcr: WmcrConfig;
    ptr: PtrConfig;
    parent_relief: ParentReliefConfig;
    life_insurance: LifeInsuranceConfig;
    spouse_relief: SpouseReliefConfig;
    sibling_relief: SiblingReliefConfig;
    donations: DonationConfig;
    grandparent_caregiver_relief: GrandparentCaregiverConfig;
    personal_rebate: PersonalRebateConfig;
}

// ---------------------------------------------------------------------------
// Family model
// ---------------------------------------------------------------------------

/** Which spouse a claim is allocated to. */
export type Spouse = 'a' | 'b';

export interface Child {
    /** Birth order within the family unit; drives WMCR and PTR amounts. */
    order: number;
    /**
     * True if born or adopted on/after the WMCR regime cutoff (1 Jan 2024),
     * which switches WMCR from a percentage to a fixed dollar amount. Also
     * true for a child born earlier who became a citizen after the cutoff.
     */
    bornFrom2024: boolean;
    disability: boolean;
    /**
     * QCR is apportioned between the parents by agreement, not claimed whole
     * by one of them, so each side holds an amount. WMCR always goes to the
     * mother and is not apportionable.
     */
    qcrA: number;
    qcrB: number;
}

export interface LifeInsuranceConfig {
    href: string;
    /** Relief is nil at or above this much CPF; below it, the ceiling is the shortfall. */
    cpf_threshold: number;
    percent_of_insured_value: number;
}

export interface SpouseReliefConfig {
    href: string;
    amount: number;
    disability: number;
    dependant_income_threshold: number;
}

export interface SiblingReliefConfig {
    href: string;
    amount: number;
    min_support_if_not_coresiding: number;
}

/** One sibling with a disability, and how the couple split the $5,500. */
export interface SiblingDependant {
    /** Apportionable like ParentDependant — other siblings may take a share. */
    amountA: number;
    amountB: number;
}

/**
 * Spouse Relief is claimed BY a taxpayer ON their spouse.
 *
 * Unlike Parent or Sibling Relief it is NOT apportioned: the two cells are not
 * two shares of one entitlement, so each is clamped to the full amount on its
 * own rather than against the other. Both being non-zero is legitimate (each
 * claiming on the other) though rare, since it needs both incomes under the
 * threshold.
 */
export interface SpouseReliefInput {
    disability: boolean;
    amountA: number;
    amountB: number;
}

export interface ParentDependant {
    coresiding: boolean;
    disability: boolean;
    /**
     * Apportioned amounts, not an either/or allocation.
     *
     * Unlike QCR, claimants are not limited to the couple — siblings
     * maintaining the same dependant may take a share too. So these are NOT
     * coupled to sum to the entitlement; the remainder may legitimately be
     * claimed by someone outside this calculation. Their combined total is
     * only capped at the entitlement.
     */
    amountA: number;
    amountB: number;
}

export interface SpouseInput {
    income: number;
    reliefs: ReliefEntries;
    /** Cash donated to approved IPCs; deducted at the configured multiplier. */
    donations: number;
}

export interface FamilyInput {
    a: SpouseInput;
    b: SpouseInput;
    /** Which spouse is the mother, and so claims WMCR. */
    mother: Spouse;
    children: Child[];
    parents: ParentDependant[];
    siblings: SiblingDependant[];
    /** Amounts are keyed by the CLAIMANT, not the dependent spouse. */
    spouseRelief: SpouseReliefInput;
    /**
     * Whether Grandparent Caregiver Relief is claimed. A flat $3,000 — IRAS:
     * "You may claim $3,000 on your or your husband's parents..." — so this
     * is a yes/no, not a count to multiply.
     */
    grandparentCaregiver: boolean;
    /**
     * PTR actually applied this year, per spouse.
     *
     * Not derived per child: PTR is a ONE-OFF rebate granted only in the YA
     * following a child's birth, with any unused balance carrying forward
     * indefinitely. In a typical year a family is applying a carried-forward
     * balance, not a fresh entitlement, so the amount has to be entered.
     */
    ptrA: number;
    ptrB: number;
}

/** Per-child working shown so a reader can see where a number came from. */
/** Per-dependant working, mirroring ChildLine. */
export interface ParentLine {
    entitlement: number;
    amountA: number;
    amountB: number;
    /** True when the couple's shares exceed what the dependant attracts. */
    overClaimed: boolean;
}

export interface ChildLine {
    order: number;
    /** Full QCR entitlement for this child, before apportionment. */
    qcrEntitlement: number;
    qcrA: number;
    qcrB: number;
    /** True when the apportioned amounts do not sum to the entitlement. */
    qcrMisallocated: boolean;
    wmcrRaw: number;
    wmcr: number;
    cappedByPerChildLimit: boolean;
    /** One-off entitlement, shown for reference only. */
    ptrEntitlement: number;
    regime: 'fixed' | 'percentage';
}

export interface SpouseResult extends TaxResult {
    /** Donations deduction, applied OUTSIDE the relief cap. */
    donationDeduction: number;
    assessableIncome: number;
    ptrApplied: number;
    ptrUnutilised: number;
    /** Budget rebate on tax payable; zero for YA 2026. */
    rebateApplied: number;
    netTax: number;
    monthlyTax: number;
}

export interface FamilyResult {
    a: SpouseResult;
    b: SpouseResult;
    children: ChildLine[];
    parents: ParentLine[];
    siblings: ParentLine[];
    totalTax: number;
    totalIncome: number;
    /** Combined tax over combined income — the number to optimise against. */
    familyEffectiveRate: number;
    totalPtrUnutilised: number;
}

/** Amounts the reader typed, keyed by ReliefDef.id. */
export type ReliefEntries = Record<string, number>;

export interface ReliefLine {
    id: string;
    claimed: number;
    allowed: number;
    cappedByOwnLimit: boolean;
    max: number | null;
}

export interface ReliefBreakdown {
    items: ReliefLine[];
    beforeCap: number;
    total: number;
    cappedByOverallLimit: boolean;
    cap: number;
}

export interface TaxResult {
    income: number;
    reliefs: ReliefBreakdown;
    chargeableIncome: number;
    tax: number;
    effectiveRate: number;
    takeHome: number;
}

/** Strings for the family calculator, resolved by Hugo from i18n/<lang>.toml. */
export interface FamilyStrings extends TaxStrings {
    spouseA: string;
    spouseB: string;
    motherIs: string;
    donations: string;
    donationsHint: string;
    donationDeduction: string;
    assessable: string;
    children: string;
    addChild: string;
    remove: string;
    childN: string;
    bornFrom2024: string;
    childDisability: string;
    qcrTo: string;
    ptrTo: string;
    parents: string;
    addParent: string;
    coresiding: string;
    claimedBy: string;
    ptrApplied: string;
    netTax: string;
    ptrUnused: string;
    familyTotal: string;
    familyRate: string;
    childCapped: string;
    allocationNote: string;
    familyCol: string;
    secIncome: string;
    secRetirement: string;
    secChildren: string;
    secElderly: string;
    secPersonal: string;
    secOutcome: string;
    gcr: string;
    wmcrRow: string;
    qcrRow: string;
    ptrRow: string;
    parentRow: string;
    taxable: string;
    rebate: string;
    monthly: string;
    afterTax: string;
    /** Per-relief explanations, keyed by relief id. */
    reliefInfo: Record<string, string>;
    incomeInfo: string;
    donationDeductionInfo: string;
    donationApplied: string;
    statutoryIncome: string;
    statutoryIncomeInfo: string;
    qcrMismatch: string;
    ptrNote: string;
    wmcrInfo: string;
    qcrInfo: string;
    parentInfo: string;
    gcrInfo: string;
    infoLabel: string;
    sourceLink: string;
    clear: string;
    clearConfirm: string;
    secOtherDependants: string;
    spouseRelief: string;
    spouseReliefInfo: string;
    siblingN: string;
    siblingRow: string;
    siblingInfo: string;
    addSibling: string;
    gcrClaim: string;
    dependantN: string;
    parentOver: string;
    parentMax: string;
    secDonations: string;
    secDonationsNote: string;
}

/** Display strings, resolved by Hugo from i18n/<lang>.toml. */
export interface TaxStrings {
    income: string;
    reliefsHeading: string;
    reliefAuto: string;
    reliefs: Record<string, string>;
    totalReliefs: string;
    chargeable: string;
    payable: string;
    effective: string;
    cappedOwn: string;
    cappedOverall: string;
    estimateNote: string;
}
