// Family income tax calculator — UI island.
//
// Layout deliberately mirrors the spreadsheet this replaces: one row per line
// item, with Mrs / Mr / Family as columns. The reader's question is "how
// should we split this?", and a split is only legible when both sides sit on
// the same row. An earlier design gave each spouse their own column of
// fields; comparing a single relief then meant looking in two places.
//
// Rates and strings come from Hugo via a JSON <script> tag, so this bundle is
// language- and year-agnostic (see layouts/shortcodes/tool.html).

import { render } from 'preact';
import type { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import { calculateFamily } from './model.ts';
import type {
    TaxConfig,
    FamilyStrings,
    Child,
    ParentDependant,
    SiblingDependant,
    Spouse,
    FamilyResult,
} from './types.ts';
import { money, moneyWhole, amount, percent, parseAmount } from '../_shared/format.ts';

type Entries = Record<string, string>;

interface SpouseState {
    income: string;
    reliefs: Entries;
    donations: string;
}

const SPOUSES: Spouse[] = ['a', 'b'];

/** UI-side shape of Spouse Relief: amounts held as typed text, keyed by claimant. */
interface SpouseReliefState {
    disability: boolean;
    a: string;
    b: string;
}

/**
 * Clamps a typed amount, leaving an empty cell empty.
 *
 * Returning "0" for a blank entry would print "0.00" in a row the reader has
 * not touched, which is how every OTHER always-visible row signals nothing
 * entered — by staying blank.
 */
const clampEntry = (raw: string, max: number): string =>
    raw.trim() === '' ? '' : String(Math.min(parseAmount(raw), max));

// WMCR and Grandparent Caregiver Relief are the mother's alone — IRAS:
// "Single or male taxpayers are not eligible for WMCR." With Mrs/Mr columns
// there is nothing to choose, so this is fixed rather than a control.
const MOTHER: Spouse = 'a';

// The "IRAS" link label is one word, identical on every row, and the row
// components are defined outside the tree that holds `t`. Set once at mount
// rather than threaded through every call site.
let sourceLinkLabel = 'IRAS';

const blankSpouse = (income: string): SpouseState => ({
    income, reliefs: {}, donations: '',
});

/**
 * Hover/focus tooltip for a row's explanation.
 *
 * Keeps every row to a single line — the grid is meant to be scannable like
 * the spreadsheet it replaces, and inline notes were pushing rows to three
 * lines each. tabindex makes it reachable by keyboard and tappable on touch,
 * where hover does not exist.
 */
function Info(
    { text, label, href, linkLabel }: {
        text: string; label: string; href?: string; linkLabel?: string;
    },
): JSX.Element | null {
    if (!text) return null;
    return (
        <span class="tool-info" tabIndex={0} role="note" aria-label={`${label}: ${text}`}>
            <span aria-hidden="true">i</span>
            <span class="tool-info__bubble">
                {text}
                {href ? (
                    <a class="tool-info__link" href={href} target="_blank" rel="noopener noreferrer">
                        {linkLabel ?? 'IRAS'}
                    </a>
                ) : null}
            </span>
        </span>
    );
}

/**
 * A section heading spanning the whole grid.
 *
 * `note` hangs off an ⓘ rather than printing under the heading — the heading
 * itself carries the fact that matters ("outside the $80,000 cap"), and a
 * paragraph here would break the one-line rhythm the rest of the grid keeps.
 */
function SectionRow(
    { label, note, href }: { label: string; note?: string; href?: string },
): JSX.Element {
    return (
        <tr class="tool-row tool-row--section">
            <th colSpan={4} scope="colgroup">
                {label}
                {note ? <Info text={note} label={label}
                    href={href} linkLabel={sourceLinkLabel} /> : null}
            </th>
        </tr>
    );
}

/**
 * An editable cell that shows a formatted figure at rest and the raw number
 * while being edited.
 *
 * Without this, entered cells read "4000" beside computed cells reading
 * "4,000.00" — two formats in adjacent columns of the same row. It is a text
 * input rather than a number one because a number input refuses to display
 * separators (and its spinners were suppressed anyway).
 */
function AmountInput(
    { value, onInput }: { value: string; onInput: (v: string) => void },
): JSX.Element {
    const [editing, setEditing] = useState(false);
    const display = editing || value === '' ? value : amount(parseAmount(value));
    return (
        <input
            class="tool-cell__input"
            type="text"
            inputMode="decimal"
            value={display}
            onFocus={() => setEditing(true)}
            onBlur={() => setEditing(false)}
            onInput={(e) => onInput((e.currentTarget as HTMLInputElement).value)}
        />
    );
}

/** A row whose Mrs/Mr cells the reader types into. */
function InputRow(
    { label, hint, href, values, onInput, total, only, infoLabel }: {
        label: JSX.Element | string;
        hint?: string | null;
        href?: string;
        values: Record<Spouse, string>;
        onInput: (s: Spouse, v: string) => void;
        total?: string;
        /** Restricts editing to one spouse; the other renders as "—". */
        only?: Spouse;
        infoLabel?: string;
    },
): JSX.Element {
    return (
        <tr class="tool-row">
            <th scope="row">
                {label}
                {hint ? <Info text={hint}
                    label={infoLabel ?? (typeof label === 'string' ? label : '')}
                    href={href} linkLabel={sourceLinkLabel} /> : null}
            </th>
            {SPOUSES.map((s) => (
                <td key={s}>
                    {only && only !== s ? (
                        <span class="tool-cell--na">—</span>
                    ) : (
                        <AmountInput value={values[s]} onInput={(v) => onInput(s, v)} />
                    )}
                </td>
            ))}
            <td class="tool-cell--total">{total ?? ''}</td>
        </tr>
    );
}

/**
 * A computed row. `allocation` renders an inline Mrs/Mr toggle in the label
 * cell, so the allocation control sits next to the figure it moves.
 */
// Cell conventions, applied throughout the grid:
//
//   null -> "—"     this person cannot claim it at all (WMCR, GCR)
//   0    -> "0.00"  they could claim it; it is allocated elsewhere
//
// Mixing those two reads as an inconsistency, and hides which reliefs are
// genuinely allocatable — the decision the whole tool exists to support.
//
// Line items use the plain number format so they match the editable cells
// beside them, which cannot render a currency symbol. Outcome rows keep the
// "$", which marks the results rather than every intermediate figure.
function ValueRow(
    { label, a, b, total, strong, muted, allocation, note, href, outcome }: {
        label: JSX.Element | string;
        a: number | string | null;
        b: number | string | null;
        total?: string;
        strong?: boolean;
        muted?: boolean;
        allocation?: { value: Spouse; onChange: (s: Spouse) => void; labels: Record<Spouse, string> };
        note?: string | null;
        href?: string;
        outcome?: boolean;
    },
): JSX.Element {
    const cell = (v: number | string | null) => {
        if (v === null) return <span class="tool-cell--na">—</span>;
        if (typeof v === 'string') return v;
        return outcome ? money(v) : amount(v);
    };

    const cls = ['tool-row',
        strong ? 'tool-row--strong' : '',
        muted ? 'tool-row--muted' : '',
        outcome ? 'tool-row--outcome' : ''].filter(Boolean).join(' ');

    return (
        <tr class={cls}>
            <th scope="row">
                {label}
                {allocation ? (
                    <span class="tool-alloc__buttons">
                        {SPOUSES.map((s) => (
                            <button
                                key={s}
                                type="button"
                                class={`tool-alloc__btn${allocation.value === s ? ' is-active' : ''}`}
                                aria-pressed={allocation.value === s}
                                onClick={() => allocation.onChange(s)}
                            >
                                {allocation.labels[s]}
                            </button>
                        ))}
                    </span>
                ) : null}
                {note ? <Info text={note} label={typeof label === 'string' ? label : ''}
                    href={href} linkLabel={sourceLinkLabel} /> : null}
            </th>
            <td>{cell(a)}</td>
            <td>{cell(b)}</td>
            <td class="tool-cell--total">{total ?? ''}</td>
        </tr>
    );
}

function FamilyCalculator(
    { config, t }: { config: TaxConfig; t: FamilyStrings },
): JSX.Element {
    const [a, setA] = useState<SpouseState>(blankSpouse('120000'));
    const [b, setB] = useState<SpouseState>(blankSpouse('160000'));
    const [children, setChildren] = useState<Child[]>([]);
    const [parents, setParents] = useState<ParentDependant[]>([]);
    const [gcrClaimed, setGcrClaimed] = useState(false);
    // Two-step: the first press asks, the second clears. A single press would
    // discard a screenful of typed figures with no undo.
    const [confirmingClear, setConfirmingClear] = useState(false);
    const [ptr, setPtr] = useState<Record<Spouse, string>>({ a: '', b: '' });
    const [siblings, setSiblings] = useState<SiblingDependant[]>([]);
    // Strings, not numbers, so an untouched row renders EMPTY like every other
    // always-visible cell. The dependant rows keep numbers (and so show
    // "0.00") because they only exist once you have added a dependant, where a
    // zero means "allocated nothing yet" rather than "not entered".
    const blankSpouseRelief = (): SpouseReliefState =>
        ({ disability: false, a: '', b: '' });
    const [spouseRelief, setSpouseRelief] =
        useState<SpouseReliefState>(blankSpouseRelief);

    const clearAll = () => {
        if (!confirmingClear) {
            setConfirmingClear(true);
            window.setTimeout(() => setConfirmingClear(false), 6000);
            return;
        }
        setConfirmingClear(false);
        setA(blankSpouse(''));
        setB(blankSpouse(''));
        setChildren([]);
        setParents([]);
        setSiblings([]);
        setSpouseRelief(blankSpouseRelief());
        setGcrClaimed(false);
        setPtr({ a: '', b: '' });
    };

    const labels: Record<Spouse, string> = { a: t.spouseA, b: t.spouseB };
    const state: Record<Spouse, SpouseState> = { a, b };
    // Functional updaters, not { ...state[s] }: reading the spouse out of the
    // render closure loses any update queued earlier in the same tick, so two
    // writes to different fields of one spouse would keep only the last.
    type Update = (prev: SpouseState) => SpouseState;
    const setState: Record<Spouse, (u: Update) => void> = { a: setA, b: setB };

    const patch = (s: Spouse, p: Partial<SpouseState>) =>
        setState[s]((prev) => ({ ...prev, ...p }));
    const setRelief = (s: Spouse, id: string, v: string) =>
        setState[s]((prev) => ({ ...prev, reliefs: { ...prev.reliefs, [id]: v } }));

    const toNums = (e: Entries) =>
        Object.fromEntries(Object.entries(e).map(([k, v]) => [k, parseAmount(v)]));

    const result: FamilyResult = useMemo(() => calculateFamily(config, {
        a: {
            income: parseAmount(a.income),
            reliefs: toNums(a.reliefs), donations: parseAmount(a.donations),
        },
        b: {
            income: parseAmount(b.income),
            reliefs: toNums(b.reliefs), donations: parseAmount(b.donations),
        },
        mother: MOTHER,
        children,
        parents,
        siblings,
        spouseRelief: {
            disability: spouseRelief.disability,
            amountA: parseAmount(spouseRelief.a),
            amountB: parseAmount(spouseRelief.b),
        },
        // Gated on children for the same reason the row is hidden: a claim
        // left behind from before the last child was removed must not keep
        // adding relief from a row the reader can no longer see.
        grandparentCaregiver: children.length > 0 && gcrClaimed,
        ptrA: parseAmount(ptr.a),
        ptrB: parseAmount(ptr.b),
    }), [config, a, b, children, parents, siblings, spouseRelief, gcrClaimed, ptr]);

    const res: Record<Spouse, FamilyResult['a']> = { a: result.a, b: result.b };
    const sum = (f: (s: Spouse) => number) => f('a') + f('b');
    const hasDonations = sum((s) => res[s].donationDeduction) > 0;

    // Defaults to the full QCR on Mr: WMCR already goes to Mrs, so this is
    // the split most families start from. Both cells are editable.
    const addChild = () => setChildren((prev) => [...prev, {
        order: prev.length + 1,
        bornFrom2024: true,
        disability: false,
        qcrA: 0,
        qcrB: config.child_relief.qcr,
    }]);

    // Renumber on removal: birth order drives WMCR and PTR, so a gap would
    // silently change what every later child is worth.
    const removeChild = (i: number) => setChildren((prev) =>
        prev.filter((_, n) => n !== i).map((c, n) => ({ ...c, order: n + 1 })));
    const patchChild = (i: number, p: Partial<Child>) => setChildren((prev) =>
        prev.map((c, n) => (n === i ? { ...c, ...p } : c)));

    const valueFor = (s: Spouse, id: string) => state[s].reliefs[id] ?? '';

    const patchParent = (i: number, patch: Partial<ParentDependant>) =>
        setParents((prev) => prev.map((d, n) => (n === i ? { ...d, ...patch } : d)));

    const parentEntitlementOf = (d: ParentDependant) => {
        const p = config.parent_relief;
        if (d.disability) {
            return d.coresiding ? p.disability_coresiding : p.disability_not_coresiding;
        }
        return d.coresiding ? p.coresiding : p.not_coresiding;
    };

    /**
     * Clamps a share to what is left of the entitlement.
     *
     * Unlike QCR the two cells are not coupled — siblings outside this
     * calculation may take part of the relief, so claiming less than the full
     * amount is legitimate. But they must never sum to MORE than the
     * dependant attracts, and the figures shown have to be the figures
     * counted: silently scaling a 6,000 + 6,000 entry down to 4,500 each left
     * a row whose cells did not add up to its own total.
     */
    const setParentShare = (i: number, sp: Spouse, raw: string) => {
        const d = parents[i];
        if (!d) return;
        const other = sp === 'a' ? d.amountB : d.amountA;
        const headroom = Math.max(parentEntitlementOf(d) - other, 0);
        const share = Math.min(parseAmount(raw), headroom);
        patchParent(i, sp === 'a' ? { amountA: share } : { amountB: share });
    };

    /** Re-clamp when the entitlement changes under an existing split. */
    const setParentFlag = (i: number, patch: Partial<ParentDependant>) => {
        const d = parents[i];
        if (!d) return;
        const next = { ...d, ...patch };
        const total = parentEntitlementOf(next);
        const amountA = Math.min(next.amountA, total);
        const amountB = Math.min(next.amountB, Math.max(total - amountA, 0));
        patchParent(i, { ...patch, amountA, amountB });
    };

    /** Same clamp as setParentShare: siblings outside the couple may share it. */
    const setSiblingShare = (i: number, sp: Spouse, raw: string) => {
        const d = siblings[i];
        if (!d) return;
        const entitlement = config.sibling_relief.amount;
        const other = sp === 'a' ? d.amountB : d.amountA;
        const share = Math.min(parseAmount(raw), Math.max(entitlement - other, 0));
        setSiblings((prev) => prev.map((x, n) => (n === i
            ? { ...x, ...(sp === 'a' ? { amountA: share } : { amountB: share }) }
            : x)));
    };

    /**
     * Clamped per cell, NOT against the other side: this relief is not shared,
     * so Mrs claiming $2,000 on Mr leaves Mr's own claim untouched.
     */
    const setSpouseReliefShare = (sp: Spouse, raw: string) =>
        setSpouseRelief((prev) => ({ ...prev, [sp]: clampEntry(raw, spouseReliefMax(prev)) }));

    /** The disability variant is worth more, so re-clamp both cells on toggle. */
    const setSpouseReliefDisability = (disability: boolean) =>
        setSpouseRelief((prev) => {
            const max = spouseReliefMax({ ...prev, disability });
            return {
                disability,
                a: clampEntry(prev.a, max),
                b: clampEntry(prev.b, max),
            };
        });

    const spouseReliefMax = (s: { disability: boolean }) => s.disability
        ? config.spouse_relief.disability
        : config.spouse_relief.amount;

    const qcrEntitlement = (c: Child) =>
        c.disability ? config.child_relief.disability : config.child_relief.qcr;

    /**
     * The two QCR cells are two views of one decision — how to divide a fixed
     * entitlement — so they move together: typing one sets the other to the
     * remainder. Letting them drift apart (and warning about it) put the
     * reader in an invalid state and asked them to fix it themselves.
     */
    const setQcr = (i: number, sp: Spouse, raw: string) => {
        const c = children[i];
        if (!c) return;
        const total = qcrEntitlement(c);
        const share = Math.min(Math.max(parseAmount(raw), 0), total);
        patchChild(i, sp === 'a'
            ? { qcrA: share, qcrB: total - share }
            : { qcrB: share, qcrA: total - share });
    };

    /** Child Relief (Disability) is a bigger entitlement, so re-split on toggle. */
    const setChildDisability = (i: number, disability: boolean) => {
        const c = children[i];
        if (!c) return;
        const total = disability
            ? config.child_relief.disability
            : config.child_relief.qcr;
        const a = Math.min(c.qcrA, total);
        patchChild(i, { disability, qcrA: a, qcrB: total - a });
    };

    return (
        <div class="tool tool--family">
            <div class="tool-toolbar">
                <button
                    type="button"
                    class={`tool-btn${confirmingClear ? ' is-confirming' : ''}`}
                    onClick={clearAll}
                >
                    {confirmingClear ? t.clearConfirm : t.clear}
                </button>
            </div>
            <table class="tool-grid">
                <thead>
                    <tr>
                        <th scope="col" class="tool-grid__corner"></th>
                        {/* No mother-only marker here: the rows that are
                            mother-only say so in their own label and show "—"
                            in the Mr column, which is clearer than a glyph
                            readers have to decode. */}
                        <th scope="col">{t.spouseA}</th>
                        <th scope="col">
                            {t.spouseB}
                        </th>
                        <th scope="col">{t.familyCol}</th>
                    </tr>
                </thead>
                <tbody>
                    <InputRow
                        label={t.income}
                        hint={t.incomeInfo}
                        values={{ a: a.income, b: b.income }}
                        onInput={(s, v) => patch(s, { income: v })}
                        total={money(result.totalIncome)}
                    />

                    {/* ---- Income + retirement reliefs --------------------- */}
                    <SectionRow label={t.secIncome} />
                    {config.reliefs
                        .filter((r) => r.id === 'earned_income' || r.id === 'cpf')
                        .map((r) => (
                        <InputRow key={r.id}
                            label={t.reliefs[r.id] ?? r.id}
                            hint={t.reliefInfo[r.id] ?? null}
                            href={r.href}
                            values={{ a: valueFor('a', r.id), b: valueFor('b', r.id) }}
                            onInput={(s, v) => setRelief(s, r.id, v)} />
                        ))}

                    <SectionRow label={t.secRetirement} />
                    {config.reliefs
                        .filter((r) => r.id.startsWith('cpf_topup') || r.id === 'srs')
                        .map((r) => (
                            <InputRow key={r.id}
                                label={t.reliefs[r.id] ?? r.id}
                                hint={t.reliefInfo[r.id]
                                    ?? (r.max ? t.cappedOwn.replace('{max}', moneyWhole(r.max)) : null)}
                                href={r.href}
                                values={{ a: valueFor('a', r.id), b: valueFor('b', r.id) }}
                                onInput={(s, v) => setRelief(s, r.id, v)} />
                        ))}

                    {/* ---- Children --------------------------------------- */}
                    <SectionRow label={t.secChildren} />
                    {children.map((c, i) => {
                        const line = result.children[i];
                        if (!line) return null;
                        const basis = line.regime === 'fixed'
                            ? moneyWhole(line.wmcr)
                            : `${Math.round((config.wmcr.percentage_of_earned_income[
                                String(Math.min(c.order, 3))] ?? 0) * 100)}%`;
                        return (
                            <>
                                <tr class="tool-row tool-row--child" key={`cfg${i}`}>
                                    <th scope="row" colSpan={4}>
                                        <div class="tool-child__bar">
                                        <strong>{t.childN.replace('{n}', String(c.order))}</strong>
                                        <label class="tool-check">
                                            <input type="checkbox" checked={c.bornFrom2024}
                                                onChange={(e) => patchChild(i, {
                                                    bornFrom2024: (e.currentTarget as HTMLInputElement).checked,
                                                })} />
                                            {t.bornFrom2024}
                                        </label>
                                        <label class="tool-check">
                                            <input type="checkbox" checked={c.disability}
                                                onChange={(e) => setChildDisability(i,
                                                    (e.currentTarget as HTMLInputElement).checked)} />
                                            {t.childDisability}
                                        </label>
                                        <button type="button" class="tool-btn tool-btn--quiet"
                                            onClick={() => removeChild(i)}>{t.remove}</button>
                                        </div>
                                    </th>
                                </tr>
                                <ValueRow key={`w${i}`}
                                    label={t.wmcrRow.replace('{n}', String(c.order))}
                                    note={t.wmcrInfo.replace('{basis}', basis)}
                                    href={config.wmcr.href}
                                    a={MOTHER === 'a' ? line.wmcr : null}
                                    b={MOTHER === 'a' ? null : line.wmcr}
                                />
                                {/* hint is an invariant check: setQcr keeps the
                                    two cells summing to the entitlement, so if
                                    this ever shows, that coupling has broken. */}
                                <InputRow key={`q${i}`}
                                    label={t.qcrRow.replace('{n}', String(c.order))}
                                    hint={line.qcrMisallocated
                                        ? t.qcrMismatch.replace('{amount}', moneyWhole(line.qcrEntitlement))
                                        : t.qcrInfo}
                                    href={config.child_relief.href}
                                    values={{ a: String(c.qcrA), b: String(c.qcrB) }}
                                    onInput={(sp, v) => setQcr(i, sp, v)}
                                />
                            </>
                        );
                    })}
                    <tr class="tool-row tool-row--action">
                        <th colSpan={4}>
                            <button type="button" class="tool-btn" onClick={addChild}>
                                {t.addChild}
                            </button>
                        </th>
                    </tr>
                    {/* PTR stays visible with no children listed: it is a
                        one-off rebate that carries forward indefinitely, so a
                        family whose children no longer qualify for QCR can
                        still be applying an old balance. */}
                    <InputRow
                        label={t.ptrRow}
                        hint={t.ptrNote}
                        href={config.ptr.href}
                        values={{ a: ptr.a, b: ptr.b }}
                        onInput={(sp, v) => setPtr((prev) => ({ ...prev, [sp]: v }))}
                    />
                    {/* GCR does have a hard child requirement — IRAS wants a
                        caregiver "looking after ... children aged 12 and below
                        ... or unmarried children with disability" — so with no
                        children it is not claimable and should not be offered. */}
                    {/* A checkbox, not a number: the relief is a flat $3,000,
                        and a numeric cell in a grid of dollar amounts invited
                        entering 3000 — which the old per-caregiver model then
                        multiplied by $3,000. */}
                    {children.length > 0 ? (
                        <ValueRow
                            label={(
                                <>
                                    {t.gcr}
                                    <label class="tool-check">
                                        <input
                                            type="checkbox"
                                            checked={gcrClaimed}
                                            onChange={(e) => setGcrClaimed(
                                                (e.currentTarget as HTMLInputElement).checked)}
                                        />
                                        {t.gcrClaim}
                                    </label>
                                </>
                            )}
                            note={t.gcrInfo}
                            href={config.grandparent_caregiver_relief.href}
                            a={MOTHER === 'a'
                                ? (gcrClaimed ? config.grandparent_caregiver_relief.amount : 0)
                                : null}
                            b={MOTHER === 'a'
                                ? null
                                : (gcrClaimed ? config.grandparent_caregiver_relief.amount : 0)}
                        />
                    ) : null}

                    {/* ---- Elderly dependants ----------------------------- */}
                    <SectionRow label={t.secElderly} />
                    {parents.map((d, i) => {
                        const line = result.parents[i];
                        if (!line) return null;
                        return (
                            <>
                                <tr class="tool-row tool-row--child" key={`pcfg${i}`}>
                                    <th scope="row" colSpan={4}>
                                        <div class="tool-child__bar">
                                        <strong>{t.dependantN.replace('{n}', String(i + 1))}</strong>
                                        <label class="tool-check">
                                            <input type="checkbox" checked={d.coresiding}
                                                onChange={(e) => setParentFlag(i, {
                                                    coresiding: (e.currentTarget as HTMLInputElement).checked,
                                                })} />
                                            {t.coresiding}
                                        </label>
                                        <label class="tool-check">
                                            <input type="checkbox" checked={d.disability}
                                                onChange={(e) => setParentFlag(i, {
                                                    disability: (e.currentTarget as HTMLInputElement).checked,
                                                })} />
                                            {t.childDisability}
                                        </label>
                                        <button type="button" class="tool-btn tool-btn--quiet"
                                            onClick={() => setParents((prev) => prev.filter((_, n) => n !== i))}>
                                            {t.remove}
                                        </button>
                                        </div>
                                    </th>
                                </tr>
                                {/* values use String(), not a falsy check: a
                                    share of zero is a real figure the tool
                                    computed — a re-clamp can force it — so it
                                    shows "0.00" like the QCR row rather than
                                    blanking and reading as "not entered". */}
                                <InputRow key={`pr${i}`}
                                    label={t.parentRow.replace('{n}', String(i + 1))}
                                    hint={t.parentInfo}
                                    href={config.parent_relief.href}
                                    values={{
                                        a: String(d.amountA),
                                        b: String(d.amountB),
                                    }}
                                    onInput={(sp, v) => setParentShare(i, sp, v)}
                                />
                            </>
                        );
                    })}
                    {parents.length < config.parent_relief.max_dependants ? (
                        <tr class="tool-row tool-row--action">
                            <th colSpan={4}>
                                <button type="button" class="tool-btn"
                                    onClick={() => setParents((p) => [...p, {
                                        coresiding: true,
                                        disability: false,
                                        amountA: 0,
                                        amountB: 0,
                                    }])}>{t.addParent}</button>
                            </th>
                        </tr>
                    ) : (
                        <tr class="tool-row tool-row--action">
                            <th colSpan={4}>
                                <em class="tool-field__hint">{t.parentMax}</em>
                            </th>
                        </tr>
                    )}

                    {/* ---- Spouse and siblings ---------------------------- */}
                    <SectionRow label={t.secOtherDependants} />
                    {/* One Disability toggle for the row rather than one per
                        cell: in practice only one spouse claims, and a per-cell
                        toggle would imply the two could each claim a different
                        variant on the same person. */}
                    <InputRow
                        label={(
                            <>
                                {t.spouseRelief}
                                <label class="tool-check">
                                    <input
                                        type="checkbox"
                                        checked={spouseRelief.disability}
                                        onChange={(e) => setSpouseReliefDisability(
                                            (e.currentTarget as HTMLInputElement).checked)}
                                    />
                                    {t.childDisability}
                                </label>
                            </>
                        )}
                        hint={t.spouseReliefInfo}
                        href={config.spouse_relief.href}
                        values={{ a: spouseRelief.a, b: spouseRelief.b }}
                        onInput={(sp, v) => setSpouseReliefShare(sp, v)}
                    />
                    {siblings.map((_, i) => (
                        <>
                            <tr class="tool-row tool-row--child" key={`scfg${i}`}>
                                <th scope="row" colSpan={4}>
                                    <div class="tool-child__bar">
                                        <strong>{t.siblingN.replace('{n}', String(i + 1))}</strong>
                                        <button type="button" class="tool-btn tool-btn--quiet"
                                            onClick={() => setSiblings((prev) =>
                                                prev.filter((_, n) => n !== i))}>
                                            {t.remove}
                                        </button>
                                    </div>
                                </th>
                            </tr>
                            <InputRow key={`sr${i}`}
                                label={t.siblingRow.replace('{n}', String(i + 1))}
                                hint={t.siblingInfo}
                                href={config.sibling_relief.href}
                                values={{
                                    a: String(siblings[i]?.amountA ?? 0),
                                    b: String(siblings[i]?.amountB ?? 0),
                                }}
                                onInput={(sp, v) => setSiblingShare(i, sp, v)}
                            />
                        </>
                    ))}
                    <tr class="tool-row tool-row--action">
                        <th colSpan={4}>
                            <button type="button" class="tool-btn"
                                onClick={() => setSiblings((prev) =>
                                    [...prev, { amountA: 0, amountB: 0 }])}>
                                {t.addSibling}
                            </button>
                        </th>
                    </tr>

                    {/* ---- Personal --------------------------------------- */}
                    <SectionRow label={t.secPersonal} />
                    {config.reliefs
                        .filter((r) => r.id === 'course_fees' || r.id === 'nsman'
                            || r.id === 'life_insurance' || r.id === 'other')
                        .map((r) => (
                            <InputRow key={r.id}
                                label={t.reliefs[r.id] ?? r.id}
                                hint={t.reliefInfo[r.id]
                                    ?? (r.max ? t.cappedOwn.replace('{max}', moneyWhole(r.max)) : null)}
                                href={r.href}
                                values={{ a: valueFor('a', r.id), b: valueFor('b', r.id) }}
                                onInput={(s, v) => setRelief(s, r.id, v)} />
                        ))}

                    {/* ---- Donations: a deduction, outside the cap -------- */}
                    <SectionRow label={t.secDonations} note={t.secDonationsNote}
                        href={config.donations.href} />
                    <InputRow
                        label={t.donations}
                        hint={t.donationsHint}
                        href={config.donations.href}
                        values={{ a: a.donations, b: b.donations }}
                        onInput={(s, v) => patch(s, { donations: v })}
                    />
                    {/* ---- Outcome ---------------------------------------- */}
                    <SectionRow label={t.secOutcome} />
                    {/* Mirrors IRAS's own computation, in their order and
                        their words:

                            Total statutory income
                            Less: Donations
                            = Assessable income
                            Less: Personal reliefs
                            = Chargeable income

                        A reader checking this against iras.gov.sg meets the
                        same terms in the same sequence. The donation step is
                        the point of the whole exercise: it comes off BEFORE
                        reliefs and is untouched by the $80,000 cap.

                        The two donation rows appear only when something was
                        donated — with none, assessable income just restates
                        statutory income. */}
                    <ValueRow label={t.statutoryIncome} outcome
                        note={t.statutoryIncomeInfo}
                        a={res.a.income} b={res.b.income}
                        total={money(result.totalIncome)} />
                    {hasDonations ? (
                        <>
                            <ValueRow label={t.donationApplied} outcome
                                note={t.donationDeductionInfo}
                                href={config.donations.href}
                                a={-res.a.donationDeduction} b={-res.b.donationDeduction}
                                total={money(-sum((s) => res[s].donationDeduction))} />
                            <ValueRow label={t.assessable} outcome
                                a={res.a.assessableIncome} b={res.b.assessableIncome}
                                total={money(sum((s) => res[s].assessableIncome))} />
                        </>
                    ) : null}
                    <ValueRow label={t.totalReliefs} outcome
                        a={-res.a.reliefs.total} b={-res.b.reliefs.total}
                        total={money(-sum((s) => res[s].reliefs.total))} />
                    <ValueRow label={t.chargeable} outcome
                        a={res.a.chargeableIncome} b={res.b.chargeableIncome}
                        total={money(sum((s) => res[s].chargeableIncome))} />
                    <ValueRow label={t.payable} outcome
                        a={res.a.tax} b={res.b.tax}
                        total={money(sum((s) => res[s].tax))} />
                    {sum((s) => res[s].ptrApplied) > 0 ? (
                        <ValueRow label={t.ptrApplied} outcome
                            a={-res.a.ptrApplied} b={-res.b.ptrApplied}
                            total={money(-sum((s) => res[s].ptrApplied))} muted />
                    ) : null}
                    {sum((s) => res[s].rebateApplied) > 0 ? (
                        <ValueRow label={t.rebate} outcome
                            a={-res.a.rebateApplied} b={-res.b.rebateApplied}
                            total={money(-sum((s) => res[s].rebateApplied))} muted />
                    ) : null}
                    <ValueRow label={t.netTax} outcome
                        a={res.a.netTax} b={res.b.netTax}
                        total={money(result.totalTax)} strong />
                    <ValueRow label={t.effective} outcome
                        a={percent(res.a.effectiveRate)}
                        b={percent(res.b.effectiveRate)}
                        total={percent(result.familyEffectiveRate)} />
                    <ValueRow label={t.monthly} outcome
                        a={res.a.monthlyTax} b={res.b.monthlyTax}
                        total={money(result.totalTax / 12)} muted />
                    <ValueRow label={t.afterTax} outcome
                        a={res.a.takeHome} b={res.b.takeHome}
                        total={money(result.totalIncome - result.totalTax)} muted />
                </tbody>
            </table>

            {res.a.reliefs.cappedByOverallLimit || res.b.reliefs.cappedByOverallLimit ? (
                <p class="tool__notice">
                    {t.cappedOverall.replace('{cap}', moneyWhole(config.relief_cap))}
                </p>
            ) : null}
            {result.totalPtrUnutilised > 0 ? (
                <p class="tool__notice">
                    {t.ptrUnused.replace('{amount}', money(result.totalPtrUnutilised))}
                </p>
            ) : null}

            <p class="tool__disclaimer">{t.allocationNote}</p>
            <p class="tool__disclaimer">{t.estimateNote}</p>
        </div>
    );
}

/** Mirrors model.parentRelief for a single dependant, for display. */
function parentAmount(config: TaxConfig, p: ParentDependant): number {
    const c = config.parent_relief;
    if (p.disability) return p.coresiding ? c.disability_coresiding : c.disability_not_coresiding;
    return p.coresiding ? c.coresiding : c.not_coresiding;
}

export function mount(el: HTMLElement): void {
    // The bundle tag is emitted per shortcode use, so a page with two tools
    // runs this twice. Marking the element keeps the second run a no-op.
    if (el.dataset.toolMounted) return;
    el.dataset.toolMounted = 'true';

    const configEl = document.getElementById(`${el.id}-config`);
    if (!configEl?.textContent) return;

    const { config, t } = JSON.parse(configEl.textContent) as {
        config: TaxConfig;
        t: FamilyStrings;
    };
    sourceLinkLabel = t.sourceLink;
    render(<FamilyCalculator config={config} t={t} />, el);
    el.removeAttribute('data-tool-fallback');
}

for (const el of document.querySelectorAll<HTMLElement>('[data-tool="tax-family"]')) {
    mount(el);
}
