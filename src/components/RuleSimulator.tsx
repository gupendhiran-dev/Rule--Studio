import { useState } from 'react';
import { X, Search, CheckCircle2, XCircle, ChevronRight, ChevronDown, FlaskConical, Zap, Plus, Trash2, Beaker } from 'lucide-react';
import { FACTS_META, TRANSACTIONS, simulate, type Rule, type SimResult } from '../lib/data';
import ScoreJourney from './ScoreJourney';

type Props = {
  rules: Rule[];
  onClose: () => void;
  targetRule?: Partial<Rule> | null;
};

type Tab = 'real' | 'synthetic';

const DEMO_IDS = [
  { id: 'adce849a-0575-4d72-89c0-28a44b94636c', label: 'Colombia ID — Score 50, Warning' },
  { id: 'd87c809b-15d6-40fa-8d3f-3c88f22e55cd', label: 'Germany Passport — Clean Pass' },
  { id: 'b3a91c40-2e7f-44a1-b8c5-f6e8d2194821', label: 'USA Driving License — Rejected (Age <18)' },
  { id: 'c7f2a831-9b4e-4d62-a1f0-8e3c5b7d9012', label: 'UK Passport — Under 18 Warning' },
];

// Pre-built synthetic templates
const SYNTHETIC_TEMPLATES = [
  {
    name: 'Under 18 Attempt',
    desc: 'Young user with valid docs',
    fields: [
      { path: 'extraction.currentAge', value: '15' },
      { path: 'extraction.issuingCountry', value: 'GBR' },
      { path: 'extraction.subType', value: 'PASSPORT' },
      { path: 'addressValidation.decisionType', value: 'PASSED' },
      { path: 'authentication.decisionType', value: 'PASSED' },
      { path: 'usabilityList.usabilityStatus', value: 'PASSED' },
      { path: 'document.status', value: 'APPROVED_VERIFIED' },
    ],
  },
  {
    name: 'Address Rejected',
    desc: 'Valid ID but bad address',
    fields: [
      { path: 'extraction.currentAge', value: '30' },
      { path: 'extraction.issuingCountry', value: 'USA' },
      { path: 'extraction.subType', value: 'DRIVING_LICENSE' },
      { path: 'addressValidation.decisionType', value: 'REJECTED' },
      { path: 'authentication.decisionType', value: 'PASSED' },
      { path: 'usabilityList.usabilityStatus', value: 'PASSED' },
      { path: 'document.status', value: 'APPROVED_VERIFIED' },
    ],
  },
  {
    name: 'Auth Rejected',
    desc: 'Failed biometric auth',
    fields: [
      { path: 'extraction.currentAge', value: '25' },
      { path: 'extraction.issuingCountry', value: 'DEU' },
      { path: 'extraction.subType', value: 'PASSPORT' },
      { path: 'addressValidation.decisionType', value: 'PASSED' },
      { path: 'authentication.decisionType', value: 'REJECTED' },
      { path: 'usabilityList.usabilityStatus', value: 'PASSED' },
      { path: 'document.status', value: 'APPROVED_VERIFIED' },
    ],
  },
  {
    name: 'Clean Pass',
    desc: 'All checks passed',
    fields: [
      { path: 'extraction.currentAge', value: '34' },
      { path: 'extraction.issuingCountry', value: 'DEU' },
      { path: 'extraction.subType', value: 'PASSPORT' },
      { path: 'addressValidation.decisionType', value: 'PASSED' },
      { path: 'authentication.decisionType', value: 'PASSED' },
      { path: 'usabilityList.usabilityStatus', value: 'PASSED' },
      { path: 'document.status', value: 'APPROVED_VERIFIED' },
    ],
  },
];

type SyntheticField = { id: string; path: string; value: string };

function buildFacts(fields: SyntheticField[]): Record<string, any> {
  const facts: Record<string, any> = {};
  fields.forEach(({ path, value }) => {
    const parts = path.split('.');
    let cur = facts;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  });
  return facts;
}

let sfid = 1000;

export default function RuleSimulator({ rules, onClose, targetRule }: Props) {
  const [tab, setTab] = useState<Tab>('real');

  // Real TX state
  const [txId, setTxId] = useState('');
  const [loadedTx, setLoadedTx] = useState<any>(null);
  const [txError, setTxError] = useState('');

  // Synthetic state
  const [syntheticFields, setSyntheticFields] = useState<SyntheticField[]>([
    { id: `sf${sfid++}`, path: 'extraction.issuingCountry', value: '' },
    { id: `sf${sfid++}`, path: 'extraction.currentAge', value: '' },
    { id: `sf${sfid++}`, path: 'addressValidation.decisionType', value: '' },
    { id: `sf${sfid++}`, path: 'authentication.decisionType', value: '' },
    { id: `sf${sfid++}`, path: 'usabilityList.usabilityStatus', value: '' },
    { id: `sf${sfid++}`, path: 'document.status', value: '' },
  ]);

  // Shared state
  const [results, setResults] = useState<SimResult[]>([]);
  const [executed, setExecuted] = useState(false);
  const [expandedFacts, setExpandedFacts] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selRules, setSelRules] = useState<Set<string>>(new Set(rules.map(r => r.id)));

  function loadTx(id: string) {
    const tx = TRANSACTIONS[id.trim()];
    if (!tx) { setTxError('Transaction not found. Try a demo ID.'); setLoadedTx(null); return; }
    setTxError(''); setLoadedTx(tx); setExecuted(false); setResults([]);
  }

  function applyTemplate(tpl: typeof SYNTHETIC_TEMPLATES[0]) {
    setSyntheticFields(tpl.fields.map(f => ({ id: `sf${sfid++}`, path: f.path, value: f.value })));
    setExecuted(false); setResults([]);
  }

  function addSyntheticField() {
    setSyntheticFields(p => [...p, { id: `sf${sfid++}`, path: '', value: '' }]);
  }
  function removeSyntheticField(id: string) {
    setSyntheticFields(p => p.filter(f => f.id !== id));
  }
  function updateSyntheticField(id: string, key: 'path' | 'value', val: string) {
    setSyntheticFields(p => p.map(f => f.id === id ? { ...f, [key]: val } : f));
  }

  function execSim() {
    const facts = tab === 'real'
      ? loadedTx?.facts
      : buildFacts(syntheticFields.filter(f => f.path && f.value));
    if (!facts) return;

    const rulesToRun = targetRule
      ? [{ ...rules[0], ...targetRule } as Rule]
      : rules.filter(r => selRules.has(r.id));
    setResults(rulesToRun.map(r => simulate(r, facts)));
    setExecuted(true);
  }

  const canExecute = tab === 'real' ? !!loadedTx : syntheticFields.some(f => f.path && f.value);
  const totalScore = Math.min(100, results.reduce((s, r) => s + r.scoreContribution, 0));
  const triggeredCount = results.filter(r => r.triggered).length;
  const activeFacts = tab === 'synthetic' ? buildFacts(syntheticFields.filter(f => f.path && f.value)) : loadedTx?.facts;

  const factGroups = () => {
    const g: Record<string, typeof FACTS_META> = {};
    FACTS_META.forEach(f => { if (!g[f.group]) g[f.group] = []; g[f.group].push(f); });
    return g;
  };
  const groups = factGroups();

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full flex flex-col overflow-hidden" style={{ maxWidth: 940, maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-jumio-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FlaskConical size={17} className="text-jumio-green" />
            <h2 className="font-semibold text-jumio-text">
              {targetRule ? `Test Rule: ${targetRule.name}` : 'Jumio Default Ruleset Testing'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 border-0 bg-transparent cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: rule selector */}
          {!targetRule && (
            <div className="w-52 border-r border-jumio-border overflow-auto p-3.5 flex-shrink-0 bg-gray-50">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Rules to test</p>
              <label className="flex items-center gap-2 text-sm font-medium text-jumio-text cursor-pointer pb-2 border-b border-gray-200 mb-2">
                <input type="checkbox" className="accent-jumio-green"
                  checked={selRules.size === rules.length}
                  onChange={e => setSelRules(e.target.checked ? new Set(rules.map(r => r.id)) : new Set())} />
                All ({rules.length})
              </label>
              <div className="space-y-0.5">
                {rules.map(r => (
                  <label key={r.id} className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer py-1 hover:bg-white rounded px-1">
                    <input type="checkbox" className="mt-0.5 accent-jumio-green flex-shrink-0"
                      checked={selRules.has(r.id)}
                      onChange={e => { const s = new Set(selRules); e.target.checked ? s.add(r.id) : s.delete(r.id); setSelRules(s); }} />
                    <span className="leading-snug">{r.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Main */}
          <div className="flex-1 overflow-auto p-4 space-y-3">

            {/* Tab switcher */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-fit gap-1">
              <button
                onClick={() => { setTab('real'); setExecuted(false); setResults([]); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all border-0 cursor-pointer ${tab === 'real' ? 'bg-white text-jumio-text shadow-sm' : 'text-gray-500 bg-transparent hover:text-jumio-text'}`}
              >
                <Search size={13} /> Real Transaction
              </button>
              <button
                onClick={() => { setTab('synthetic'); setExecuted(false); setResults([]); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all border-0 cursor-pointer ${tab === 'synthetic' ? 'bg-white text-jumio-text shadow-sm' : 'text-gray-500 bg-transparent hover:text-jumio-text'}`}
              >
                <Beaker size={13} /> Synthetic Transaction
              </button>
            </div>

            {/* Real Transaction tab */}
            {tab === 'real' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1 text-sm"
                    placeholder="Enter a Transaction ID…"
                    value={txId}
                    onChange={e => setTxId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadTx(txId)}
                  />
                  <button onClick={() => loadTx(txId)} className="btn-outline text-sm py-2 px-3 flex-shrink-0">
                    <Search size={13} /> Load
                  </button>
                  <button onClick={() => { const id = 'adce849a-0575-4d72-89c0-28a44b94636c'; setTxId(id); loadTx(id); }} className="btn-primary text-sm py-2 px-3 flex-shrink-0">
                    Default
                  </button>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-1.5">📋 Demo Transaction IDs</p>
                  {DEMO_IDS.map(d => (
                    <button key={d.id} onClick={() => { setTxId(d.id); loadTx(d.id); }}
                      className="block text-left w-full text-xs py-0.5 border-0 bg-transparent cursor-pointer">
                      <span className="font-mono text-blue-700 font-medium">{d.id}</span>
                      <span className="text-blue-400"> — {d.label}</span>
                    </button>
                  ))}
                </div>
                {txError && <p className="text-xs text-red-600">{txError}</p>}
                {loadedTx && <p className="text-xs text-green-600 font-medium">✓ Transaction loaded — {loadedTx.label}</p>}
              </div>
            )}

            {/* Synthetic Transaction tab */}
            {tab === 'synthetic' && (
              <div className="space-y-3">
                {/* Templates */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Templates</p>
                  <div className="grid grid-cols-4 gap-2">
                    {SYNTHETIC_TEMPLATES.map(tpl => (
                      <button
                        key={tpl.name}
                        onClick={() => applyTemplate(tpl)}
                        className="border border-jumio-border rounded-lg p-2.5 text-left hover:border-jumio-green hover:bg-green-50 transition-all bg-white cursor-pointer group"
                      >
                        <div className="text-xs font-semibold text-gray-700 group-hover:text-jumio-green-dark">{tpl.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{tpl.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field builder */}
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Fields</p>
                    <span className="text-xs text-gray-400">{syntheticFields.filter(f => f.path && f.value).length} fields set</span>
                  </div>
                  <div className="space-y-2">
                    {syntheticFields.map(field => {
                      const fm = FACTS_META.find(f => f.id === field.path);
                      return (
                        <div key={field.id} className="flex items-center gap-2">
                          {/* Field selector */}
                          <div className="flex-1">
                            <select
                              className="input-field text-xs"
                              value={field.path}
                              onChange={e => updateSyntheticField(field.id, 'path', e.target.value)}
                            >
                              <option value="">Select field…</option>
                              {Object.entries(groups).map(([group, facts]) => (
                                <optgroup key={group} label={group}>
                                  {facts.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                          {/* Value */}
                          <div className="flex-1">
                            {fm?.examples?.length ? (
                              <select
                                className="input-field text-xs"
                                value={field.value}
                                onChange={e => updateSyntheticField(field.id, 'value', e.target.value)}
                              >
                                <option value="">Select value…</option>
                                {fm.examples.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                              </select>
                            ) : (
                              <input
                                className="input-field text-xs"
                                value={field.value}
                                onChange={e => updateSyntheticField(field.id, 'value', e.target.value)}
                                placeholder="Enter value…"
                              />
                            )}
                          </div>
                          <button
                            onClick={() => removeSyntheticField(field.id)}
                            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 border-0 bg-transparent cursor-pointer flex-shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={addSyntheticField}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-md text-xs text-gray-500 hover:border-jumio-green hover:text-jumio-green bg-transparent cursor-pointer transition-colors"
                  >
                    <Plus size={11} /> Add field
                  </button>
                </div>
              </div>
            )}

            {/* Facts viewer (shared, shows after tx loaded or synthetic has fields) */}
            {activeFacts && Object.keys(activeFacts).length > 0 && (
              <div className="border border-jumio-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFacts(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50 border-0 cursor-pointer text-sm font-medium text-jumio-text"
                >
                  <div className="flex items-center gap-2">
                    <span>Field Filtering</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                      {Object.keys(activeFacts).length * 2} field references
                    </span>
                    {tab === 'synthetic' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Synthetic</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-jumio-green rounded-full" /> Facts filter on
                    </span>
                    {expandedFacts ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </div>
                </button>
                {expandedFacts && (
                  <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50 font-mono text-xs leading-relaxed">
                    <div className="text-gray-400 mb-1">facts &#123;{Object.keys(activeFacts).length}&#125;</div>
                    {Object.entries(activeFacts).map(([k, v]) => (
                      <div key={k} className="ml-3">
                        <span className="text-purple-600 font-semibold">▼ {k}</span>
                        {typeof v === 'object' && v !== null && Object.entries(v as Record<string, unknown>).map(([k2, v2]) => (
                          <div key={k2} className="ml-4">
                            <span className="text-gray-500">{k2}</span>: <span className="text-green-600">{String(v2)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Results summary */}
            {executed && (
              <div className="bg-gray-50 border border-jumio-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm text-jumio-text">Simulation Results</span>
                  <div className="flex gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">{triggeredCount} triggered</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{results.length - triggeredCount} not triggered</span>
                    {tab === 'synthetic' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Synthetic data</span>}
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Computed Risk Score</span>
                    <span className={`text-2xl font-bold ${totalScore >= 70 ? 'text-red-600' : totalScore >= 30 ? 'text-orange-500' : 'text-jumio-green'}`}>{totalScore}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${totalScore}%`, background: totalScore >= 70 ? '#D32F2F' : totalScore >= 30 ? '#F97316' : '#00C853' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>0</span><span>29</span><span>70</span><span>100</span>
                  </div>
                </div>
              </div>
            )}

            {/* Score Journey waterfall chart */}
            {executed && results.length > 0 && (
              <ScoreJourney results={results} baseScore={0} />
            )}

            {/* Per-rule results */}
            {executed && results.map(r => (
              <div key={r.ruleId} className={`border rounded-lg overflow-hidden ${r.triggered ? 'border-l-4 border-l-jumio-green border-jumio-border' : 'border-jumio-border'}`}>
                <button
                  onClick={() => setExpanded(p => ({ ...p, [r.ruleId]: !p[r.ruleId] }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 border-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {r.triggered
                      ? <CheckCircle2 size={16} className="text-jumio-green flex-shrink-0" />
                      : <XCircle size={16} className="text-gray-400 flex-shrink-0" />}
                    <span className="text-sm font-medium text-jumio-text text-left">{r.ruleName}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.triggered && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">+{r.scoreContribution} score</span>}
                    <span className={`text-xs font-bold ${r.triggered ? 'text-jumio-green' : 'text-gray-400'}`}>
                      {r.triggered ? 'TRIGGERED' : 'NOT TRIGGERED'}
                    </span>
                    {expanded[r.ruleId] ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRight size={13} className="text-gray-400" />}
                  </div>
                </button>
                {expanded[r.ruleId] && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-2">
                    {r.condResults.map((cr, i) => (
                      <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${cr.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                        {cr.passed
                          ? <CheckCircle2 size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
                          : <XCircle size={13} className="text-red-600 flex-shrink-0 mt-0.5" />}
                        <div>
                          <span className="font-mono text-gray-700">{cr.field}</span>
                          <span className="mx-1.5 text-gray-400">{cr.op}</span>
                          {cr.val && <span className="font-mono text-gray-700">"{cr.val}"</span>}
                          <div className="text-gray-500 mt-0.5">{cr.reason}</div>
                        </div>
                      </div>
                    ))}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap size={12} className="text-blue-600" />
                        <span className="text-xs font-semibold text-blue-800">AI Root Cause Analysis</span>
                      </div>
                      <p className="text-xs text-blue-700 leading-relaxed">{r.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {!executed && (
              <div className="text-center py-8 text-gray-400 text-sm">
                {tab === 'real'
                  ? 'Load a transaction above then click Execute.'
                  : 'Set field values or pick a template above, then click Execute.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-jumio-border bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${tab === 'synthetic' ? 'bg-purple-500' : 'bg-jumio-green'}`} />
            <span className="text-xs text-gray-400">
              {tab === 'synthetic'
                ? `Synthetic — ${syntheticFields.filter(f => f.path && f.value).length} fields configured`
                : loadedTx ? loadedTx.id : 'No transaction loaded'}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-outline text-sm py-2 px-4">Cancel</button>
            <button
              onClick={execSim}
              disabled={!canExecute}
              className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={13} /> Execute
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
