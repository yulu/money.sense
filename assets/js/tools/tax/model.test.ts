// Run with: npm test  (typecheck + these tests)
//
// These tests read the SAME YAML file Hugo renders into the page, so a typo in
// the rate table fails here rather than silently producing plausible numbers.
//
// The central assertion is against IRAS's own published "Gross Tax Payable"
// column: at every band boundary our computed tax must equal the figure IRAS
// prints. That makes the rate table self-checking.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import type { TaxConfig } from './types.ts';

import {
    calculateSpouse,
    taxOnChargeableIncome,
    applyReliefs,
} from './model.ts';

// The single-taxpayer entry point was removed with the LIT-16 POC tool
// (singles are better served by IRAS's own calculator), so these exercise
// the same arithmetic through the family path.
const one = (income: number, reliefs: Record<string, number>) =>
    calculateSpouse(config, { income, reliefs, donations: 0 }, 0, 0);

const config = load(
    readFileSync(
        fileURLToPath(new URL('../../../../data/tools/tax_ya2026.yml', import.meta.url)),
        'utf8',
    ),
) as TaxConfig;

test('rate table matches IRAS published gross tax payable at every boundary', () => {
    for (const band of config.brackets) {
        if (band.upTo === null || band.cumulative === null) continue;
        assert.equal(
            taxOnChargeableIncome(config, band.upTo),
            band.cumulative,
            `tax on first $${band.upTo} should be IRAS's $${band.cumulative}`,
        );
    }
});

test('no tax below the first bracket', () => {
    assert.equal(taxOnChargeableIncome(config, 0), 0);
    assert.equal(taxOnChargeableIncome(config, 20000), 0);
});

test('tax accrues within a band, not just at its edges', () => {
    // $25,000 is halfway through the 2% band: $200 * 0.5 = $100.
    assert.equal(taxOnChargeableIncome(config, 25000), 100);
    // $100,000 is halfway through the 11.5% band: $3,350 + ($4,600 * 0.5).
    assert.equal(taxOnChargeableIncome(config, 100000), 5650);
});

test('top open-ended band applies above $1m', () => {
    // $199,150 on the first $1m, then 24% on the excess.
    assert.equal(taxOnChargeableIncome(config, 1100000), 199150 + 100000 * 0.24);
});

test('negative chargeable income is treated as zero', () => {
    assert.equal(taxOnChargeableIncome(config, -5000), 0);
});

test('each relief is capped at its own IRAS limit', () => {
    const { items } = applyReliefs(config, { srs: 20000, cpf_topup_self: 12000 });
    const srs = items.find((i) => i.id === 'srs');
    const topup = items.find((i) => i.id === 'cpf_topup_self');

    // assert.ok narrows away `undefined`, and fails loudly if the data file
    // ever drops one of these relief ids.
    assert.ok(srs, 'srs relief missing from config');
    assert.ok(topup, 'cpf_topup_self relief missing from config');

    assert.equal(srs.allowed, 15300, 'SRS caps at $15,300');
    assert.equal(srs.cappedByOwnLimit, true);
    assert.equal(topup.allowed, 8000, 'CPF cash top-up (self) caps at $8,000');
});

test('uncapped reliefs pass the entered amount through', () => {
    const { items } = applyReliefs(config, { cpf: 23000 });
    const cpf = items.find((i) => i.id === 'cpf');
    assert.ok(cpf, 'cpf relief missing from config');
    assert.equal(cpf.allowed, 23000);
    assert.equal(cpf.cappedByOwnLimit, false);
});

test('total reliefs are capped at the $80,000 overall limit', () => {
    const result = applyReliefs(config, { cpf: 200000, earned_income: 1000 });
    assert.equal(result.beforeCap, 201000);
    assert.equal(result.total, 80000);
    assert.equal(result.cappedByOverallLimit, true);
});

test('overall cap is not flagged when reliefs stay under it', () => {
    const result = applyReliefs(config, { cpf: 20000, earned_income: 1000 });
    assert.equal(result.total, 21000);
    assert.equal(result.cappedByOverallLimit, false);
});

test('chargeable income floors at zero when reliefs exceed income', () => {
    const r = one(15000, { cpf: 30000 });
    assert.equal(r.chargeableIncome, 0);
    assert.equal(r.tax, 0);
});

test('zero income yields zero tax and a zero effective rate, not NaN', () => {
    const r = one(0, {});
    assert.equal(r.tax, 0);
    assert.equal(r.effectiveRate, 0);
    assert.ok(Number.isFinite(r.effectiveRate));
});

test('end-to-end: typical case nets reliefs off before applying rates', () => {
    const r = one(120000, { earned_income: 1000, cpf: 20400, srs: 15300 });

    // $1,000 earned income relief + $20,400 CPF + $15,300 SRS = $36,700.
    assert.equal(r.reliefs.total, 36700);
    assert.equal(r.chargeableIncome, 83300);
    // $3,350 on the first $80,000, then 11.5% on the remaining $3,300.
    assert.equal(r.tax, 3350 + 3300 * 0.115);
    assert.equal(r.takeHome, 120000 - r.tax);
});

test('effective rate is measured against gross income', () => {
    const r = one(100000, {});
    assert.equal(r.effectiveRate, r.tax / 100000);
});
