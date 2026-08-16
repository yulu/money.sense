// Family model tests. Run with: npm test
//
// Wherever possible these assert against IRAS's OWN published worked examples
// rather than figures of our own invention — if our arithmetic disagrees with
// the examples on the IRAS relief pages, we are wrong, not them.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';

import { calculateFamily, childReliefs, parentRelief, parentReliefLines } from './model.ts';
import type { TaxConfig, FamilyInput, Child, Spouse } from './types.ts';

const config = load(
    readFileSync(
        fileURLToPath(new URL('../../../../data/tools/tax_ya2026.yml', import.meta.url)),
        'utf8',
    ),
) as TaxConfig;

function child(over: Partial<Child> = {}): Child {
    return {
        order: 1,
        bornFrom2024: true,
        disability: false,
        qcrA: 0,
        qcrB: 0,
        ...over,
    };
}

function family(over: Partial<FamilyInput> = {}): FamilyInput {
    return {
        a: { income: 0, reliefs: { earned_income: 1000 }, donations: 0 },
        b: { income: 0, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'b' as Spouse,
        children: [],
        parents: [],
        siblings: [],
        spouseRelief: { disability: false, amountA: 0, amountB: 0 },
        grandparentCaregiver: false,
        ptrA: 0,
        ptrB: 0,
        ...over,
    };
}

// ---------------------------------------------------------------------------
// The LIT-22 blocker: donations sit OUTSIDE the $80,000 relief cap
// ---------------------------------------------------------------------------

test('a donation still cuts tax for someone already at the $80k relief cap', () => {
    // Reliefs deliberately far past the cap, so any extra relief is worthless.
    const atCap = family({
        a: { income: 300000, reliefs: { earned_income: 1000, cpf: 200000 }, donations: 0 },
    });
    const withDonation = family({
        a: { income: 300000, reliefs: { earned_income: 1000, cpf: 200000 }, donations: 10000 },
    });

    const base = calculateFamily(config, atCap).a;
    const given = calculateFamily(config, withDonation).a;

    assert.equal(base.reliefs.cappedByOverallLimit, true, 'precondition: at the cap');
    assert.equal(base.reliefs.total, 80000);
    assert.equal(given.reliefs.total, 80000, 'donation must not enter the capped bucket');

    // $10,000 donated => $25,000 deducted, entirely outside the cap.
    assert.equal(given.donationDeduction, 25000);
    assert.equal(given.assessableIncome, 275000);
    assert.ok(
        given.netTax < base.netTax,
        'donation must reduce tax even at the cap — this is the whole point of LIT-22',
    );
});

test('donations are deducted before reliefs, not added to them', () => {
    const r = calculateFamily(config, family({
        a: { income: 100000, reliefs: { earned_income: 1000 }, donations: 1000 },
    })).a;

    assert.equal(r.donationDeduction, 2500, '$1,000 at 250%');
    assert.equal(r.assessableIncome, 97500);
    // Earned Income Relief $1,000 is the only relief here.
    assert.equal(r.chargeableIncome, 96500);
});

test('config states donations are not subject to the relief cap', () => {
    assert.equal(config.donations.subject_to_relief_cap, false);
    assert.equal(config.donations.multiplier, 2.5);
});

// ---------------------------------------------------------------------------
// WMCR dual regime — asserted against IRAS's published examples
// ---------------------------------------------------------------------------

test("IRAS example (Mrs Teo): a family spanning both WMCR regimes", () => {
    // Earned income $90,000. Child 1 born before 2024 => 15%. Child 2 born
    // from 2024 => flat $10,000. IRAS states cumulative WMCR of $23,500.
    const lines = childReliefs(config, family({
        b: { income: 90000, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'b',
        children: [
            child({ order: 1, bornFrom2024: false }),
            child({ order: 2, bornFrom2024: true }),
        ],
    }));

    assert.equal(lines[0]?.wmcr, 13500, '15% x $90,000');
    assert.equal(lines[0]?.regime, 'percentage');
    assert.equal(lines[1]?.wmcr, 10000, 'flat rate, 2nd child born from 2024');
    assert.equal(lines[1]?.regime, 'fixed');
    assert.equal(lines.reduce((s, l) => s + l.wmcr, 0), 23500);
});

test('IRAS example (Mrs Lim): per-child $50k cap trims WMCR, not QCR', () => {
    // Earned income $250,000. Child 1 has a disability (Child Relief
    // (Disability) $7,500), child 2 ordinary QCR $4,000. IRAS shows WMCR of
    // $37,500 and $46,000 respectively — the second capped at $50,000 - $4,000.
    const lines = childReliefs(config, family({
        b: { income: 250000, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'b',
        children: [
            child({ order: 1, bornFrom2024: false, disability: true, qcrB: 7500 }),
            child({ order: 2, bornFrom2024: false, qcrB: 4000 }),
        ],
    }));

    assert.equal(lines[0]?.qcrEntitlement, 7500, 'Child Relief (Disability)');
    assert.equal(lines[0]?.wmcr, 37500, '15% x $250,000, under the cap');
    assert.equal(lines[0]?.cappedByPerChildLimit, false);

    assert.equal(lines[1]?.qcrEntitlement, 4000);
    assert.equal(lines[1]?.wmcrRaw, 50000, '20% x $250,000 before the cap');
    assert.equal(lines[1]?.wmcr, 46000, '$50,000 cap less $4,000 QCR');
    assert.equal(lines[1]?.cappedByPerChildLimit, true);
});

test('3rd and subsequent children reuse the highest configured band', () => {
    const lines = childReliefs(config, family({
        b: { income: 100000, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'b',
        children: [child({ order: 3 }), child({ order: 5 })],
    }));
    assert.equal(lines[0]?.wmcr, 12000, '3rd child fixed rate');
    assert.equal(lines[1]?.wmcr, 12000, '5th child falls back to the 3rd band');
    assert.equal(lines[1]?.ptrEntitlement, 20000, 'PTR entitlement likewise');
});

test('WMCR percentage follows the mother, not the higher earner', () => {
    const lines = childReliefs(config, family({
        a: { income: 500000, reliefs: { earned_income: 1000 }, donations: 0 },
        b: { income: 80000, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'b',
        children: [child({ order: 1, bornFrom2024: false })],
    }));
    assert.equal(lines[0]?.wmcr, 12000, '15% of the mother’s $80,000');
});

test('only the mother receives WMCR, whoever claims QCR', () => {
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: { earned_income: 1000 }, donations: 0 },
        b: { income: 120000, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'b',
        children: [child({ order: 1, bornFrom2024: true, qcrA: 4000 })],
    }));

    // Father: earned income relief 1,000 + QCR 4,000. Mother: 1,000 + WMCR 8,000.
    assert.equal(r.a.reliefs.total, 5000);
    assert.equal(r.b.reliefs.total, 9000);
});

// ---------------------------------------------------------------------------
// PTR is a rebate, not a relief
// ---------------------------------------------------------------------------

test('IRAS example (Mrs Chen): PTR wipes out the tax exactly', () => {
    // Income $80,000; EIR $1,000, QCR $4,000, WMCR $8,000, CPF $16,000
    // => chargeable $51,000, tax $1,320. IRAS shows net tax $0 after PTR.
    const r = calculateFamily(config, family({
        b: { income: 80000, reliefs: { earned_income: 1000, cpf: 16000 }, donations: 0 },
        mother: 'b',
        children: [child({ order: 1, bornFrom2024: true, qcrB: 4000 })],
        // Mr and Mrs Chen agreed to share the $5,000 PTR equally.
        ptrA: 2500,
        ptrB: 2500,
    })).b;

    assert.equal(r.reliefs.total, 29000, 'EIR 1,000 + QCR 4,000 + WMCR 8,000 + CPF 16,000');
    assert.equal(r.chargeableIncome, 51000);
    assert.equal(r.tax, 1320, 'IRAS: $550 on the first $40,000, then 7% on $11,000');
    // Her $2,500 half covers her $1,320 of tax; the rest carries forward.
    assert.equal(r.ptrApplied, 1320);
    assert.equal(r.netTax, 0);
    assert.equal(r.ptrUnutilised, 1180);
});

test('PTR is apportionable, not all-or-nothing', () => {
    // IRAS: "You and your spouse may share the PTR based on an apportionment
    // agreed by both of you."
    const r = calculateFamily(config, family({
        a: { income: 150000, reliefs: { earned_income: 1000 }, donations: 0 },
        b: { income: 150000, reliefs: { earned_income: 1000 }, donations: 0 },
        ptrA: 3000,
        ptrB: 2000,
    }));
    assert.equal(r.a.ptrApplied, 3000);
    assert.equal(r.b.ptrApplied, 2000);
    assert.equal(r.a.netTax + r.b.netTax, r.totalTax);
});

test('PTR is entered, not generated per child each year', () => {
    // It is a one-off rebate granted in the YA after birth, so a child on the
    // form must not conjure a fresh rebate every year.
    const r = calculateFamily(config, family({
        a: { income: 150000, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'b',
        children: [child({ order: 1, qcrA: 4000 })],
    }));
    assert.equal(r.a.ptrApplied, 0, 'no PTR unless an amount is entered');
    assert.equal(r.b.ptrApplied, 0);
    assert.equal(r.children[0]?.ptrEntitlement, 5000, 'entitlement still shown for reference');
});

test('PTR never turns into a refund, and the remainder is reported', () => {
    const r = calculateFamily(config, family({
        b: { income: 40000, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'b',
        ptrB: 20000, // carried-forward balance being applied this year
    })).b;

    assert.ok(r.tax > 0);
    assert.equal(r.netTax, 0, 'floors at zero');
    assert.equal(r.ptrApplied, r.tax);
    assert.equal(r.ptrUnutilised, 20000 - r.tax, 'surfaced, not silently dropped');
});

test('PTR reduces tax without touching chargeable income', () => {
    const noPtr = calculateFamily(config, family({
        a: { income: 150000, reliefs: { earned_income: 1000 }, donations: 0 },
        children: [],
    })).a;
    const withPtr = calculateFamily(config, family({
        a: { income: 150000, reliefs: { earned_income: 1000 }, donations: 0 },
        ptrA: 5000,
    })).a;

    assert.equal(noPtr.chargeableIncome, withPtr.chargeableIncome,
        'a rebate must not alter chargeable income');
    assert.equal(withPtr.netTax, noPtr.tax - 5000);
});

// ---------------------------------------------------------------------------
// Parent Relief and allocation
// ---------------------------------------------------------------------------

test('parent relief varies with co-residence and disability', () => {
    const parents = [
        { coresiding: true, disability: false, amountA: 9000, amountB: 0 },
        { coresiding: false, disability: false, amountA: 5500, amountB: 0 },
        { coresiding: true, disability: true, amountA: 0, amountB: 14000 },
        { coresiding: false, disability: true, amountA: 0, amountB: 10000 },
    ];
    assert.equal(parentRelief(config, parents, 'a'), 9000 + 5500);
    assert.equal(parentRelief(config, parents, 'b'), 14000 + 10000);
});

test('parent relief is apportionable between the spouses', () => {
    // IRAS: shared "based on an agreed apportionment".
    const parents = [{ coresiding: true, disability: false, amountA: 4000, amountB: 5000 }];
    assert.equal(parentRelief(config, parents, 'a'), 4000);
    assert.equal(parentRelief(config, parents, 'b'), 5000);
});

test('a couple may claim LESS than the full entitlement', () => {
    // Claimants can include siblings outside this calculation, so an
    // under-claim is a normal case rather than something to correct.
    const parents = [{ coresiding: true, disability: false, amountA: 3000, amountB: 0 }];
    const [line] = parentReliefLines(config, parents);
    assert.equal(parentRelief(config, parents, 'a'), 3000);
    assert.equal(line?.entitlement, 9000);
    assert.equal(line?.overClaimed, false, 'under-claiming is not an error');
});

test('shares are capped at what the dependant attracts', () => {
    const parents = [{ coresiding: false, disability: false, amountA: 5000, amountB: 5000 }];
    const [line] = parentReliefLines(config, parents);
    assert.equal(line?.entitlement, 5500, 'not co-residing');
    assert.equal(line?.overClaimed, true);
    assert.equal(
        (line?.amountA ?? 0) + (line?.amountB ?? 0), 5500,
        'scaled back to the entitlement, not silently allowed through',
    );
});

test('IRAS caps Parent Relief at two dependants', () => {
    assert.equal(config.parent_relief.max_dependants, 2);
});

test('moving an allocation between spouses changes the family total', () => {
    // Spouse 'a' is the high earner here; 'b' is the mother, on a low income.
    const withQcrOn = (who: Spouse) => calculateFamily(config, family({
        a: { income: 400000, reliefs: { earned_income: 1000 }, donations: 0 },
        b: { income: 40000, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'b',
        children: [child({
            order: 1,
            qcrA: who === 'a' ? 4000 : 0,
            qcrB: who === 'b' ? 4000 : 0,
        })],
    })).totalTax;

    const onHighEarner = withQcrOn('a');
    const onLowEarner = withQcrOn('b');

    assert.notEqual(onHighEarner, onLowEarner, 'allocation must matter');
    assert.ok(onHighEarner < onLowEarner,
        'relief is worth more against the higher marginal rate');
});

test('family effective rate is combined tax over combined income', () => {
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: { earned_income: 1000 }, donations: 0 },
        b: { income: 80000, reliefs: { earned_income: 1000 }, donations: 0 },
    }));
    assert.equal(r.totalIncome, 200000);
    assert.equal(r.totalTax, r.a.netTax + r.b.netTax);
    assert.equal(r.familyEffectiveRate, r.totalTax / 200000);
});

test('each spouse gets their own $80k cap', () => {
    const r = calculateFamily(config, family({
        a: { income: 300000, reliefs: { earned_income: 1000, cpf: 90000 }, donations: 0 },
        b: { income: 300000, reliefs: { earned_income: 1000, cpf: 90000 }, donations: 0 },
    }));
    assert.equal(r.a.reliefs.total, 80000);
    assert.equal(r.b.reliefs.total, 80000, 'caps are per taxpayer, not per family');
});

test('an empty family produces zeros rather than NaN', () => {
    const r = calculateFamily(config, family());
    assert.equal(r.totalTax, 0);
    assert.equal(r.familyEffectiveRate, 0);
    assert.ok(Number.isFinite(r.familyEffectiveRate));
});

test('WMCR is never claimable by the father — IRAS excludes male taxpayers', () => {
    // Same family, WMCR-eligible child, but QCR pushed to the father.
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: { earned_income: 1000 }, donations: 0 },
        b: { income: 160000, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'a',
        children: [child({ order: 1, bornFrom2024: true, qcrB: 4000 })],
    }));

    // Mother: earned income relief 1,000 + WMCR 8,000. Father: 1,000 + QCR 4,000.
    assert.equal(r.a.reliefs.total, 9000);
    assert.equal(r.b.reliefs.total, 5000, 'father gets QCR only, never WMCR');
});

test('Grandparent Caregiver Relief also goes to the mother only', () => {
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: { earned_income: 1000 }, donations: 0 },
        b: { income: 160000, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'a',
        grandparentCaregiver: true,
    }));

    assert.equal(r.a.reliefs.total, 1000 + 3000, 'mother: EIR + GCR');
    assert.equal(r.b.reliefs.total, 1000, 'father: EIR only');
});

test('Grandparent Caregiver Relief is a flat $3,000, never multiplied', () => {
    // IRAS: "You may claim $3,000 on your or your husband's parents..." — it
    // is a single flat relief, not an amount per caregiver. It was previously
    // modelled as a count times $3,000, so a reader entering the dollar
    // amount 3000 produced $9,000,000 of relief, silently capped to $80,000.
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: { earned_income: 1000 }, donations: 0 },
        mother: 'a',
        grandparentCaregiver: true,
    }));
    assert.equal(r.a.reliefs.total, 1000 + 3000);
    assert.equal(r.a.reliefs.cappedByOverallLimit, false);
});

test('the reported relief total equals what the rows add up to', () => {
    // Guards the bug this pair of tests came from: the grid showed reliefs
    // summing to 31,000 while the total read 80,000.
    const f = family({
        a: { income: 120000, reliefs: { earned_income: 0 }, donations: 0 },
        mother: 'a',
        children: [
            child({ order: 1, bornFrom2024: false, qcrB: 4000 }),
            child({ order: 2, bornFrom2024: true, qcrB: 4000 }),
        ],
        grandparentCaregiver: true,
    });
    const r = calculateFamily(config, f);
    const wmcr = r.children.reduce((s, c) => s + c.wmcr, 0);
    assert.equal(wmcr, 18000 + 10000, '15% of 120,000, then the fixed 2nd-child rate');
    assert.equal(r.a.reliefs.total, wmcr + 3000, 'WMCR + GCR, and nothing invisible');
    assert.equal(r.a.reliefs.cappedByOverallLimit, false, 'nowhere near the cap');
});

test('no Personal Income Tax Rebate applies for YA 2026', () => {
    assert.equal(config.personal_rebate.percent, 0);
    assert.equal(config.personal_rebate.cap, 0);
    const r = calculateFamily(config, family({
        a: { income: 100000, reliefs: { earned_income: 1000 }, donations: 0 },
    })).a;
    assert.equal(r.rebateApplied, 0);
    assert.equal(r.netTax, r.tax, 'nothing shaved off the tax for YA 2026');
});

// ---------------------------------------------------------------------------
// Life Insurance Relief — the one relief with a DERIVED ceiling
// IRAS: "$5,000 or more -> Nil. Less than $5,000 -> the lower of: the
// difference between $5,000 and your CPF contribution; or up to 7% of the
// insured value ... or the amount of insurance premiums paid."
// ---------------------------------------------------------------------------

const lifeItem = (f: FamilyInput) =>
    calculateFamily(config, f).a.reliefs.items.find((i) => i.id === 'life_insurance')!;

test('Life Insurance Relief is nil once CPF contributions reach $5,000', () => {
    const item = lifeItem(family({
        a: { income: 120000, reliefs: { cpf: 20400, life_insurance: 3000 }, donations: 0 },
    }));
    assert.equal(item.claimed, 3000);
    assert.equal(item.allowed, 0, 'CPF of $20,400 is well past the $5,000 threshold');
    assert.equal(item.max, 0, 'the ceiling shown to the reader is zero, not $5,000');
    assert.equal(item.cappedByOwnLimit, true);
});

test('Life Insurance Relief is capped at the shortfall below $5,000 of CPF', () => {
    // $3,200 of CPF leaves $1,800 of headroom.
    const item = lifeItem(family({
        a: { income: 16000, reliefs: { cpf: 3200, life_insurance: 2500 }, donations: 0 },
    }));
    assert.equal(item.max, 1800);
    assert.equal(item.allowed, 1800, 'trimmed to the shortfall, not the $2,500 entered');
});

test('Life Insurance Relief allows the full premium when it fits the shortfall', () => {
    const item = lifeItem(family({
        a: { income: 16000, reliefs: { cpf: 1000, life_insurance: 1500 }, donations: 0 },
    }));
    assert.equal(item.max, 4000);
    assert.equal(item.allowed, 1500, 'premium is below the ceiling, so it passes through');
    assert.equal(item.cappedByOwnLimit, false);
});

// ---------------------------------------------------------------------------
// Spouse Relief / Spouse Relief (Disability) — $2,000 / $5,500, not shared
// ---------------------------------------------------------------------------

test('Spouse Relief adds $2,000 to the claimant only', () => {
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: {}, donations: 0 },
        b: { income: 6000, reliefs: {}, donations: 0 },
        spouseRelief: { disability: false, amountA: 2000, amountB: 0 },
    }));
    assert.equal(r.a.reliefs.total, 2000);
    assert.equal(r.b.reliefs.total, 0, 'the relief belongs to the claimant, not the dependant');
});

test('the disability variant is $5,500', () => {
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: {}, donations: 0 },
        spouseRelief: { disability: true, amountA: 5500, amountB: 0 },
    }));
    assert.equal(r.a.reliefs.total, 5500);
});

test('the disability flag alone, with nothing entered, grants nothing', () => {
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: {}, donations: 0 },
        spouseRelief: { disability: true, amountA: 0, amountB: 0 },
    }));
    assert.equal(r.a.reliefs.total, 0, 'the variant sets the ceiling, not the claim');
});

test('a Spouse Relief entry is trimmed to the entitlement', () => {
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: {}, donations: 0 },
        spouseRelief: { disability: false, amountA: 9999, amountB: 0 },
    }));
    assert.equal(r.a.reliefs.total, 2000, 'clamped to $2,000, not the figure typed');
});

test('Spouse Relief is not shared: each cell is clamped on its own', () => {
    // Both spouses claiming on each other is legal though rare — it needs both
    // incomes under the threshold — and must NOT be treated as one shared
    // $2,000 the way Parent and Sibling Relief are.
    const r = calculateFamily(config, family({
        a: { income: 7000, reliefs: {}, donations: 0 },
        b: { income: 6000, reliefs: {}, donations: 0 },
        spouseRelief: { disability: false, amountA: 2000, amountB: 2000 },
    }));
    assert.equal(r.a.reliefs.total, 2000);
    assert.equal(r.b.reliefs.total, 2000, 'not halved against the other side');
});

// ---------------------------------------------------------------------------
// Sibling Relief (Disability) — flat $5,500 each, apportionable
// ---------------------------------------------------------------------------

test('Sibling Relief (Disability) splits $5,500 between the couple', () => {
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: {}, donations: 0 },
        b: { income: 160000, reliefs: {}, donations: 0 },
        siblings: [{ amountA: 2500, amountB: 3000 }],
    }));
    assert.equal(r.a.reliefs.total, 2500);
    assert.equal(r.b.reliefs.total, 3000);
    assert.equal(r.siblings[0]!.entitlement, 5500);
    assert.equal(r.siblings[0]!.overClaimed, false);
});

test('a part claim is legitimate — other siblings may take the rest', () => {
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: {}, donations: 0 },
        siblings: [{ amountA: 1500, amountB: 0 }],
    }));
    assert.equal(r.a.reliefs.total, 1500, 'not topped up to the full $5,500');
    assert.equal(r.siblings[0]!.overClaimed, false);
});

test('the couple cannot claim more than $5,500 on one sibling', () => {
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: {}, donations: 0 },
        b: { income: 160000, reliefs: {}, donations: 0 },
        siblings: [{ amountA: 5500, amountB: 5500 }],
    }));
    assert.equal(r.siblings[0]!.overClaimed, true);
    assert.equal(r.a.reliefs.total + r.b.reliefs.total, 5500, 'scaled back to the entitlement');
});

test('each sibling attracts their own $5,500', () => {
    const r = calculateFamily(config, family({
        a: { income: 120000, reliefs: {}, donations: 0 },
        siblings: [{ amountA: 5500, amountB: 0 }, { amountA: 5500, amountB: 0 }],
    }));
    assert.equal(r.a.reliefs.total, 11000);
});

test('all three new reliefs sit inside the $80,000 cap', () => {
    const r = calculateFamily(config, family({
        a: {
            income: 300000,
            reliefs: { cpf: 78000, life_insurance: 0 },
            donations: 0,
        },
        siblings: [{ amountA: 5500, amountB: 0 }],
        spouseRelief: { disability: true, amountA: 5500, amountB: 0 },
    })).a;
    assert.equal(r.reliefs.beforeCap, 78000 + 5500 + 5500);
    assert.equal(r.reliefs.total, 80000, 'trimmed to the cap like every other relief');
    assert.equal(r.reliefs.cappedByOverallLimit, true);
});
