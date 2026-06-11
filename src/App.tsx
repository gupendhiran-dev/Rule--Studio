import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import RuleList from './components/RuleList';
import RuleBuilder from './components/RuleBuilder';
import RuleSimulator from './components/RuleSimulator';
import { RULES as DEFAULT_RULES, type Rule } from './lib/data';
import { loadRules, saveRules, resetRules } from './lib/storage';

type View = 'list' | 'builder';

export default function App() {
  const [rules, setRules] = useState<Rule[]>(() => loadRules(DEFAULT_RULES));
  const [view, setView] = useState<View>('list');
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [showSim, setShowSim] = useState(false);
  const [testRule, setTestRule] = useState<Partial<Rule> | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  const showToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleSave = useCallback((updatedRule: Rule) => {
    setRules(prev => {
      const exists = prev.find(r => r.id === updatedRule.id);
      const next = exists
        ? prev.map(r => r.id === updatedRule.id ? updatedRule : r)
        : [...prev, updatedRule];
      saveRules(next);
      return next;
    });
    showToast();
    setView('list');
    setEditingRule(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setRules(prev => {
      const next = prev.filter(r => r.id !== id);
      saveRules(next);
      return next;
    });
  }, []);

  const handleToggleStatus = useCallback((id: string) => {
    setRules(prev => {
      const next = prev.map(r =>
        r.id === id
          ? { ...r, status: (r.status === 'inactive' ? 'active' : 'inactive') as 'active' | 'inactive' }
          : r
      );
      saveRules(next);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm('Reset all rules to default? This cannot be undone.')) {
      resetRules();
      setRules(DEFAULT_RULES);
      setView('list');
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-jumio-bg">
      <Sidebar />
      <main className="ml-[52px] flex-1 flex flex-col overflow-hidden">
        {view === 'list' && (
          <RuleList
            rules={rules}
            onEdit={rule => { setEditingRule(rule); setView('builder'); }}
            onNew={() => { setEditingRule(null); setView('builder'); }}
            onTest={() => { setTestRule(null); setShowSim(true); }}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onReset={handleReset}
          />
        )}
        {view === 'builder' && (
          <RuleBuilder
            rule={editingRule}
            onSave={handleSave}
            onCancel={() => { setView('list'); setEditingRule(null); }}
            onTest={rule => { setTestRule(rule); setShowSim(true); }}
          />
        )}
      </main>

      {showSim && (
        <RuleSimulator
          rules={rules}
          onClose={() => { setShowSim(false); setTestRule(null); }}
          targetRule={testRule}
        />
      )}

      {/* Save toast */}
      <div className={`fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 z-50 ${savedToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
        <span className="w-2 h-2 bg-jumio-green rounded-full" />
        Rule saved successfully
      </div>
    </div>
  );
}
