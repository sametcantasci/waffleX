import React from 'react';
import { GitBranch, ShieldAlert, ShieldCheck, Waves, Sparkles } from 'lucide-react';

const faultTone = {
    SEMANTIC_REASONING_GAP: 'border-red-200 bg-red-50 text-red-800',
    DEEP_INSPECTION_VARIANCE: 'border-amber-200 bg-amber-50 text-amber-800',
    RESPONSE_INTERPRETATION_DRIFT: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    UNIFORM_PASS_BEHAVIOR: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    CONSISTENT_ENFORCEMENT: 'border-slate-200 bg-slate-50 text-slate-700',
};

const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const SummaryCard = ({ family }) => {
    const tone = faultTone[family.likelyFault] || faultTone.CONSISTENT_ENFORCEMENT;

    const Icon =
        family.likelyFault === 'SEMANTIC_REASONING_GAP'
            ? ShieldAlert
            : family.likelyFault === 'UNIFORM_PASS_BEHAVIOR'
                ? ShieldCheck
                : Waves;

    const accepted = safeNumber(family.accepted);
    const enforced = safeNumber(family.enforced);
    const anomalous = safeNumber(family.anomalous);
    const uniqueOutcomes = safeNumber(family.uniqueOutcomes);
    const familySize = safeNumber(family.familySize);
    const consistencyScore = safeNumber(family.consistencyScore);

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                        Equivalence Family
                    </div>
                    <div className="mt-1 font-mono text-sm text-slate-800 break-all">
                        {family.basePayload}
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                        Consistency
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                        {consistencyScore}%
                    </div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                        Accepted
                    </div>
                    <div className="mt-1 text-lg font-bold text-emerald-700">
                        {accepted}
                    </div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                        Enforced
                    </div>
                    <div className="mt-1 text-lg font-bold text-red-700">
                        {enforced}
                    </div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                        Anomalous
                    </div>
                    <div className="mt-1 text-lg font-bold text-amber-700">
                        {anomalous}
                    </div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                        Outcomes
                    </div>
                    <div className="mt-1 text-lg font-bold text-indigo-700">
                        {uniqueOutcomes}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${tone}`}>
                    <Icon size={14} />
                    {String(family.likelyFault || 'CONSISTENT_ENFORCEMENT').replaceAll('_', ' ')}
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <GitBranch size={14} />
                    Family size: {familySize} equivalent variants
                </div>
            </div>

            {!!family.notes && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {family.notes}
                </div>
            )}
        </div>
    );
};

const EmptyState = () => {
    return (
        <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-5">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 text-indigo-700 shrink-0">
                    <Sparkles size={18} />
                </div>

                <div className="min-w-0 w-full">
                    <div className="text-sm font-bold text-slate-900">
                        Equivalence Drift Map
                    </div>

                    <p className="mt-1 text-sm text-slate-600 max-w-4xl leading-relaxed">
                        This is WaffleX’s differentiating analysis layer. It groups semantically equivalent request variants
                        into a single payload family and measures whether the defensive path treats them consistently.
                    </p>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="rounded-lg bg-white border border-slate-200 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                                What it shows
                            </div>
                            <div className="mt-1 text-sm text-slate-800">
                                Accepted vs enforced vs anomalous behavior across equivalent variants
                            </div>
                        </div>

                        <div className="rounded-lg bg-white border border-slate-200 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                                Why it matters
                            </div>
                            <div className="mt-1 text-sm text-slate-800">
                                Inconsistent outcomes suggest normalization drift or semantic reasoning gaps
                            </div>
                        </div>

                        <div className="rounded-lg bg-white border border-slate-200 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                                Primary metric
                            </div>
                            <div className="mt-1 text-sm text-slate-800">
                                Semantic Consistency Score = outcome uniformity across a mutation family
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-indigo-200 text-xs font-bold text-indigo-800">
                        Waiting for the first analysis run to populate family-level drift summaries
                    </div>
                </div>
            </div>
        </div>
    );
};

const SemanticConsistencyPanel = ({ summaries = [] }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
                <h3 className="text-sm font-bold text-slate-800">Equivalence Drift Map</h3>
                <p className="mt-1 text-xs text-slate-500">
                    Measures whether semantically equivalent request variants are treated consistently across the defensive path.
                </p>
            </div>

            <div className="p-4 max-h-[340px] overflow-y-auto">
                {!summaries.length ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-4 pr-1">
                        {summaries.map((family, idx) => (
                            <SummaryCard
                                key={`${family.basePayload || 'family'}-${idx}`}
                                family={family}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SemanticConsistencyPanel;