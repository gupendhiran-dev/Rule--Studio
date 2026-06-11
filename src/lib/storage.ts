import { type Rule } from './data';

const RULES_KEY = 'jumio_rules';

export function loadRules(defaults: Rule[]): Rule[] {
  try {
    const stored = localStorage.getItem(RULES_KEY);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return defaults;
  } catch {
    return defaults;
  }
}

export function saveRules(rules: Rule[]): void {
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  } catch {
    console.error('Failed to save rules to localStorage');
  }
}

export function resetRules(): void {
  localStorage.removeItem(RULES_KEY);
}
