// Shared formatting helpers for tool islands.
// Kept free of DOM and framework imports so tools and tests can both use it.

const SGD = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const SGD_WHOLE = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
});

// Plain number, no currency symbol — for grid cells that sit alongside
// editable ones. A number input cannot display "$", so computed cells that
// neighbour inputs use this to stay in the same format.
const PLAIN = new Intl.NumberFormat('en-SG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/** Object.is guards negative zero: -(0) is -0, which Intl renders "-$0.00". */
const clean = (value: number): number =>
    Number.isFinite(value) ? (Object.is(value, -0) ? 0 : value) : 0;

export function money(value: number): string {
    return SGD.format(clean(value));
}

export function amount(value: number): string {
    return PLAIN.format(clean(value));
}

// Accepts null because ReliefDef.max is nullable — callers shouldn't have to
// narrow before formatting a cap for display.
export function moneyWhole(value: number | null | undefined): string {
    const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return SGD_WHOLE.format(n);
}

export function percent(fraction: number, digits = 2): string {
    const n = Number.isFinite(fraction) ? fraction : 0;
    return `${(n * 100).toFixed(digits)}%`;
}

// Parses user input that may contain separators or a currency prefix.
// Returns 0 rather than NaN so a half-typed value never poisons the maths.
export function parseAmount(raw: string | number | null | undefined): number {
    if (typeof raw === 'number') return Number.isFinite(raw) ? Math.max(raw, 0) : 0;
    const cleaned = String(raw ?? '').replace(/[^0-9.]/g, '');
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? Math.max(n, 0) : 0;
}
