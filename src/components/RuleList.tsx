import { useState } from 'react';
import { Plus, Download, Search, MoreVertical, ChevronDown, FlaskConical, RefreshCw, Trash2, RotateCcw, Edit2 } from 'lucide-react';
import { type Rule } from '../lib/data';

type Props = {
  rules: Rule[];
  onEdit: (rule: Rule) => void;
  onNew: () => void;
  onTest: () => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onReset: () => void;
};

const LABEL_STYLES: Record<string, string> = {
  EXPIRED: 'bg-orange-100 text-orange-700',
  USABILITY: 'bg-purple-100 text-purple-700',
  underAge: 'bg-yellow-100 text-yellow-800',
};

function Score({ v }: { v: number }) {
  const cls = v >= 100 ? 'text-red-600' : v >= 80 ? 'text-orange-500' : 'text-yellow-600';
  return <span className={`font-semibold text-sm ${cls}`}>{v}</span>;
}

function StatusBadge({ status, onClick }: { status: 'active' | 'inactive'; onClick: (e: React.MouseEvent) => void }) {
  const isActive = status === 'active';
  return (
    <button
      onClick={onClick}
      title={`Click to mark as ${isActive ? 'inactive' : 'active'}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer transition-all hover:opacity-80 ${
        isActive
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </button>
  );
}

export default function RuleList({ rules, onEdit, onNew, onTest, onDelete, onToggleStatus, onReset }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = rules.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || (r.status ?? 'active') === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = rules.filter(r => (r.status ?? 'active') === 'active').length;
  const inactiveCount = rules.filter(r => r.status === 'inactive').length;

  return (
    <div className="flex flex-col h-full bg-jumio-bg" onClick={() => setMenuOpen(null)}>
      {/* Top header */}
      <div className="h-12 bg-white border-b border-jumio-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-jumio-muted">
          <span>Rulesets</span>
          <span className="text-gray-300">/</span>
          <span className="text-jumio-text font-medium">Jumio Default Ruleset</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-jumio-muted">Merchant: <strong className="text-jumio-text">Jumio UAT</strong></span>
          <button onClick={onReset} title="Reset to defaults" className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 border-0 bg-transparent cursor-pointer transition-colors">
            <RotateCcw size={14} />
          </button>
          <button onClick={onTest} className="btn-outline text-xs py-1.5 px-3">
            <FlaskConical size={13} /> Rules Testing
          </button>
          <button onClick={onNew} className="btn-primary text-xs py-1.5 px-3">
            <Plus size={13} /> Create Rule
          </button>
        </div>
      </div>

      {/* Sub-header */}
      <div className="h-10 bg-white border-b border-jumio-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="version-pill"><RefreshCw size={10} /> VERSION 16</span>
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 ml-1">
            {([
              { key: 'all', label: `All (${rules.length})` },
              { key: 'active', label: `Active (${activeCount})` },
              { key: 'inactive', label: `Inactive (${inactiveCount})` },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border-0 cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-jumio-green text-white'
                    : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-xs py-1 px-2">
            <Download size={11} /> Download All
          </button>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-8 py-1.5 text-xs w-52"
              placeholder="Search rules..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-jumio-border sticky top-0 z-10">
              {['Row ID', 'Name', 'Version', 'Expression', 'Category', 'Labels', 'Status', 'Score', 'Modified', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-jumio-muted uppercase tracking-wider whitespace-nowrap bg-gray-50">
                  {h}{['Name', 'Score', 'Modified'].includes(h) && <ChevronDown size={9} className="inline ml-0.5" />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((rule, idx) => {
              const status = rule.status ?? 'active';
              return (
                <tr
                  key={rule.id}
                  onClick={() => onEdit(rule)}
                  className={`border-b border-gray-100 cursor-pointer transition-colors ${
                    status === 'inactive' ? 'opacity-60 hover:opacity-80 hover:bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium text-sm hover:underline ${status === 'inactive' ? 'text-gray-400' : 'text-jumio-blue'}`}>
                      {rule.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="version-pill"><RefreshCw size={9} /> VERSION {rule.ver}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[240px]">
                    <span className="font-mono text-xs text-gray-500 truncate block">{rule.expr.slice(0, 58)}…</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{rule.cat}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {rule.labels.map(l => (
                        <span key={l} className={`tag ${LABEL_STYLES[l] || 'bg-gray-100 text-gray-600'}`}>{l}</span>
                      ))}
                    </div>
                  </td>
                  {/* Status column */}
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={status}
                      onClick={e => { e.stopPropagation(); onToggleStatus(rule.id); }}
                    />
                  </td>
                  <td className="px-4 py-3"><Score v={rule.score} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{rule.mod}</td>
                  <td className="px-4 py-3 relative">
                    <button
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 border-0 bg-transparent cursor-pointer"
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === rule.id ? null : rule.id); }}
                    >
                      <MoreVertical size={14} />
                    </button>
                    {menuOpen === rule.id && (
                      <div
                        className="absolute right-8 top-2 bg-white border border-jumio-border rounded-lg shadow-lg z-20 py-1 w-40"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => { onEdit(rule); setMenuOpen(null); }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                        >
                          <Edit2 size={13} /> Edit Rule
                        </button>
                        <button
                          onClick={() => { onToggleStatus(rule.id); setMenuOpen(null); }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                        >
                          <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-gray-400' : 'bg-green-500'}`} />
                          {status === 'active' ? 'Set Inactive' : 'Set Active'}
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => { onDelete(rule.id); setMenuOpen(null); }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center text-sm text-gray-400">
                  No rules match your search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
