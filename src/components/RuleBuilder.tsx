import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, PlayCircle, Code, RefreshCw, AlertTriangle } from 'lucide-react';
import { FACTS_META, OPERATORS, CATEGORIES, ACTIONS, WORKFLOWS, genExpr, type Rule, type Condition } from '../lib/data';

type Props = {
  rule: Rule | null;
  onSave: (rule: Rule) => void;
  onCancel: () => void;
  onTest: (rule: Partial<Rule>) => void;
};

const LABEL_STYLES: Record<string, string> = {
  EXPIRED: 'bg-orange-100 text-orange-700',
  USABILITY: 'bg-purple-100 text-purple-700',
  underAge: 'bg-yellow-100 text-yellow-800',
};

let cc = 300;
const newCond = (conn: 'AND' | 'OR' | null = null): Condition => ({
  id: `bc${++cc}`, field: '', op: 'equals', val: '', conn,
});

const factGroups = () => {
  const g: Record<string, typeof FACTS_META> = {};
  FACTS_META.forEach(f => { if (!g[f.group]) g[f.group] = []; g[f.group].push(f); });
  return g;
};

export default function RuleBuilder({ rule, onSave, onCancel, onTest }: Props) {
  const [name, setName] = useState(rule?.name || '');
  const [cat, setCat] = useState(rule?.cat || CATEGORIES[0]);
  const [desc, setDesc] = useState('');
  const [workflowId, setWorkflowId] = useState(rule?.workflowId || '10020');
  const [status, setStatus] = useState<'active' | 'inactive'>(rule?.status || 'active');
  const [score, setScore] = useState(String(rule?.score || 80));
  const [action, setAction] = useState(rule?.action || 'add_score');
  const [labels, setLabels] = useState<string[]>(rule?.labels || []);
  const [labelInput, setLabelInput] = useState('');
  const [conds, setConds] = useState<Condition[]>(
    rule?.conds?.length ? rule.conds.map(c => ({ ...c })) : [newCond()]
  );
  const [adv, setAdv] = useState(false);
  const [advExpr, setAdvExpr] = useState(rule?.expr || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generatedExpr = genExpr(conds);
  useEffect(() => { if (!adv) setAdvExpr(generatedExpr); }, [conds, adv]);

  const groups = factGroups();

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Rule name is required';
    if (!adv && conds.every(c => !c.field)) e.conds = 'At least one condition is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const now = new Date();
    const mod = `${now.getMonth()+1}/${now.getDate()}/${String(now.getFullYear()).slice(2)}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    onSave({
      id: rule?.id || `rule-${Date.now()}`,
      name: name.trim(), cat, score: Number(score),
      labels, ver: rule?.ver || 1,
      conds: conds.filter(c => c.field || adv),
      action, expr: adv ? advExpr : generatedExpr,
      mod, workflowId, status,
    });
  }

  function updateCond(id: string, field: keyof Condition, value: string) {
    setConds(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }
  function removeCond(id: string) {
    setConds(prev => {
      const f = prev.filter(c => c.id !== id);
      if (f.length) f[0] = { ...f[0], conn: null };
      return f;
    });
  }
  function addLabel() {
    const l = labelInput.trim();
    if (l && !labels.includes(l)) { setLabels(p => [...p, l]); setLabelInput(''); }
  }

  const partialRule: Partial<Rule> = {
    id: rule?.id || 'preview', name, cat, score: Number(score),
    labels, conds, action, expr: adv ? advExpr : generatedExpr, ver: 1, mod: '',
  };

  return (
    <div className="flex h-full overflow-hidden bg-jumio-bg">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 bg-white border-b border-jumio-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-jumio-muted">
            <button onClick={onCancel} className="hover:text-jumio-text hover:underline bg-transparent border-0 cursor-pointer text-sm text-jumio-muted p-0">Rulesets</button>
            <span className="text-gray-300">/</span>
            <button onClick={onCancel} className="hover:text-jumio-text hover:underline bg-transparent border-0 cursor-pointer text-sm text-jumio-muted p-0">Jumio Default Ruleset</button>
            <span className="text-gray-300">/</span>
            <span className="text-jumio-text font-medium">{name || 'New Rule'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-jumio-muted">Merchant: <strong className="text-jumio-text">Vialto UAT</strong></span>
            <button onClick={onCancel} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
            <button onClick={() => onTest(partialRule)} className="btn-outline text-xs py-1.5 px-3">
              <PlayCircle size={13} /> Test Rule
            </button>
            <button onClick={handleSave} className="btn-primary text-xs py-1.5 px-3">
              <Save size={13} /> Save
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {adv && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4 text-sm text-amber-800">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <span>If the expression is too complex or syntax is invalid, you will not be able to switch back to the default view.</span>
            </div>
          )}

          {/* Workflow selector bar */}
          <div className="flex items-center gap-3 bg-white border border-jumio-border rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-jumio-green flex items-center justify-center flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 leading-none mb-0.5">Workflow</p>
                <p className="text-[10px] text-gray-400 leading-none">Select the workflow this rule applies to</p>
              </div>
            </div>
            <div className="flex-1">
              <select
                className="input-field text-sm font-medium"
                value={workflowId}
                onChange={e => setWorkflowId(e.target.value)}
              >
                {WORKFLOWS.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.id} — {w.name}
                  </option>
                ))}
              </select>
            </div>
            {workflowId && (
              <div className="flex-shrink-0 text-right">
                <p className="text-[10px] text-gray-400">Key</p>
                <p className="font-mono font-bold text-sm text-jumio-blue">{workflowId}</p>
              </div>
            )}
          </div>

          {/* Version + toggle */}
          <div className="flex items-center justify-between mb-4">
            <span className="version-pill"><RefreshCw size={10} /> VERSION {rule?.ver || 1}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-jumio-muted">Advanced Editor</span>
              <button
                onClick={() => setAdv(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors border-0 cursor-pointer ${adv ? 'bg-jumio-green' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${adv ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          {adv ? (
            <div className="card overflow-hidden">
              <div className="bg-[#1E1E2E] px-4 py-2 border-b border-gray-700">
                <span className="font-mono text-xs text-gray-400">expression.drools</span>
              </div>
              <div className="flex">
                <div className="bg-[#252532] text-gray-500 font-mono text-xs px-3 py-4 text-right select-none border-r border-gray-700 w-10">1</div>
                <textarea
                  className="flex-1 bg-[#1E1E2E] text-[#4EC9B0] font-mono text-sm p-4 min-h-[120px] resize-none focus:outline-none leading-relaxed"
                  value={advExpr}
                  onChange={e => setAdvExpr(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* WHEN */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="section-label bg-blue-50 text-blue-700">WHEN</span>
                    <span className="text-xs text-jumio-muted">All conditions must match</span>
                  </div>
                  {errors.conds && <span className="text-xs text-red-500">{errors.conds}</span>}
                </div>
                <div className="space-y-2">
                  {conds.map((cond, idx) => {
                    const fm = FACTS_META.find(f => f.id === cond.field);
                    const noVal = ['not_null', 'is_null'].includes(cond.op);
                    return (
                      <div key={cond.id}>
                        {idx > 0 && (
                          <div className="flex items-center gap-2 my-2">
                            <div className="flex-1 h-px bg-gray-200" />
                            {(['AND', 'OR'] as const).map(c => (
                              <button key={c} onClick={() => updateCond(cond.id, 'conn', c)}
                                className={`px-2.5 py-0.5 rounded text-xs font-bold border-0 cursor-pointer transition-colors ${cond.conn === c ? 'bg-jumio-green text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                {c}
                              </button>
                            ))}
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>
                        )}
                        <div className="flex items-end gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="flex-1 flex flex-col gap-1 min-w-0">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Field</label>
                            <select className="input-field text-xs" value={cond.field} onChange={e => updateCond(cond.id, 'field', e.target.value)}>
                              <option value="">Select a field…</option>
                              {Object.entries(groups).map(([group, facts]) => (
                                <optgroup key={group} label={group}>
                                  {facts.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                          <div className="w-44 flex flex-col gap-1 flex-shrink-0">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Operator</label>
                            <select className="input-field text-xs" value={cond.op} onChange={e => updateCond(cond.id, 'op', e.target.value)}>
                              {OPERATORS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                          </div>
                          {!noVal && (
                            <div className="flex-1 flex flex-col gap-1 min-w-0">
                              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Value</label>
                              {fm?.examples?.length ? (
                                <select className="input-field text-xs" value={cond.val} onChange={e => updateCond(cond.id, 'val', e.target.value)}>
                                  <option value="">Select…</option>
                                  {fm.examples.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                                </select>
                              ) : (
                                <input className="input-field text-xs" value={cond.val} onChange={e => updateCond(cond.id, 'val', e.target.value)} placeholder="Enter value…" />
                              )}
                            </div>
                          )}
                          {conds.length > 1 && (
                            <button onClick={() => removeCond(cond.id)}
                              className="mb-0.5 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 border-0 bg-transparent cursor-pointer transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-3">
                  {(['AND', 'OR'] as const).map(c => (
                    <button key={c} onClick={() => setConds(p => [...p, newCond(c)])}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-md text-xs text-gray-500 hover:border-jumio-green hover:text-jumio-green bg-transparent cursor-pointer transition-colors">
                      <Plus size={11} /> Add {c} condition
                    </button>
                  ))}
                </div>
              </div>

              {/* THEN */}
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="section-label bg-green-50 text-green-700">THEN</span>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Action</label>
                    <select className="input-field text-sm" value={action} onChange={e => setAction(e.target.value)}>
                      {ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                  </div>
                  {['add_score', 'set_score'].includes(action) && (
                    <div className="w-24 flex flex-col gap-1 flex-shrink-0">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Score</label>
                      <input type="number" className="input-field text-sm" value={score} onChange={e => setScore(e.target.value)} min={0} max={100} />
                    </div>
                  )}
                </div>
              </div>

              {/* Expression preview */}
              <div className="card p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Generated Expression</span>
                  <button onClick={() => setAdv(true)} className="btn-ghost text-xs py-1 px-2">
                    <Code size={11} /> Edit Advanced
                  </button>
                </div>
                <pre className="font-mono text-xs text-gray-600 bg-white border border-gray-200 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                  {generatedExpr || '// Add conditions above to generate expression'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-[268px] border-l border-jumio-border bg-white flex-shrink-0 overflow-auto p-5 space-y-5">

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Rule Name *</label>
          <input className={`input-field ${errors.name ? 'border-red-400' : ''}`} value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }} placeholder="Enter rule name…" />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Category *</label>
          <select className="input-field" value={cat} onChange={e => setCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Status</label>
          <div className="flex gap-2">
            {(['active', 'inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                  status === s
                    ? s === 'active'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Description</label>
          <textarea className="input-field resize-none min-h-[72px]" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe this rule…" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Labels</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {labels.map(l => (
              <span key={l} className={`tag gap-1 ${LABEL_STYLES[l] || 'bg-gray-100 text-gray-600'}`}>
                {l}
                <button onClick={() => setLabels(p => p.filter(x => x !== l))} className="text-current opacity-60 hover:opacity-100 bg-transparent border-0 cursor-pointer p-0 text-sm leading-none">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input className="input-field text-xs flex-1" value={labelInput} onChange={e => setLabelInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLabel()} placeholder="Add label…" />
            <button onClick={addLabel} className="btn-outline text-xs py-1.5 px-2 flex-shrink-0">Add +</button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Score</label>
          <input type="number" className="input-field" value={score} onChange={e => setScore(e.target.value)} min={0} max={100} />
          <p className="text-xs text-gray-400 mt-1">Risk score contribution (0–100)</p>
        </div>
      </div>
    </div>
  );
}
