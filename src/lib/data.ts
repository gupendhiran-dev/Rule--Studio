export type Condition = {
  id: string;
  field: string;
  op: string;
  val: string;
  conn: 'AND' | 'OR' | null;
};

export type Rule = {
  id: string;
  name: string;
  cat: string;
  score: number;
  ver: number;
  labels: string[];
  expr: string;
  conds: Condition[];
  action: string;
  mod: string;
  workflowId?: string;
  status?: 'active' | 'inactive';
};

export const WORKFLOWS = [
  { id: '10015', name: 'Standalone ID Verification', key: 10015 },
  { id: '10164', name: 'Identity Verification', key: 10164 },
  { id: '10020', name: 'Standalone Govt ID Verification', key: 10020 },
  { id: '10017', name: 'Standalone Address Validation Only', key: 10017 },
];

export const RULES: Rule[] = [
  { id:'r1', name:'DOCUMENT - Fuzzy Name MISMATCH', cat:'ID Data Extraction', score:50, ver:1, labels:[], expr:'($extraction: extraction != null) eval($extraction.firstName != null && matchFuzzyTokenized($extraction.firstName, $nameCheck.firstName, 80) == false)', conds:[{id:'c1',field:'extraction.firstName',op:'not_null',val:'',conn:null},{id:'c2',field:'extraction.firstName',op:'fuzzy_match',val:'nameCheck.firstName',conn:'AND'}], action:'add_score', mod:'6/4/26, 3:54 PM', workflowId: '10020', status: 'active' as const },
  { id:'r2', name:'Extraction POA - Older than 3 months', cat:'Address Validation', score:100, ver:1, labels:[], expr:'($extraction: extraction != null) eval($extraction.issuedDate != null && daysBetween($extraction.issuedDate, now()) > 90)', conds:[{id:'c1',field:'extraction.expiryDate',op:'not_null',val:'',conn:null}], action:'add_score', mod:'6/4/26, 3:51 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r3', name:'Address Validation - REJECTED', cat:'Address Validation', score:100, ver:1, labels:[], expr:'($addressValidation: addressValidation != null) eval($addressValidation.decisionType == "REJECTED")', conds:[{id:'c1',field:'addressValidation.decisionType',op:'equals',val:'REJECTED',conn:null}], action:'add_score', mod:'4/30/26, 12:13 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r4', name:'Address Validation - NOT EXECUTED', cat:'Address Validation', score:100, ver:1, labels:[], expr:'($addressValidation: addressValidation != null) eval($addressValidation.decisionType == "NOT_EXECUTED")', conds:[{id:'c1',field:'addressValidation.decisionType',op:'equals',val:'NOT_EXECUTED',conn:null}], action:'add_score', mod:'4/27/26, 5:50 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r5', name:'DOCUMENT Not Supported', cat:'ID Verification', score:80, ver:1, labels:[], expr:'($document: document != null) eval($document.status == "ERROR_NOT_READABLE_ID")', conds:[{id:'c1',field:'document.status',op:'equals',val:'ERROR_NOT_READABLE_ID',conn:null}], action:'add_score', mod:'4/8/26, 3:49 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r6', name:'Address Validation - UNSUPPORTED COUNTRY', cat:'Address Validation', score:80, ver:1, labels:[], expr:'($addressValidation: addressValidation != null) eval($addressValidation.decisionType == "UNSUPPORTED_COUNTRY")', conds:[{id:'c1',field:'addressValidation.decisionType',op:'equals',val:'UNSUPPORTED_COUNTRY',conn:null}], action:'add_score', mod:'4/8/26, 3:48 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r7', name:'Address Validation - WARNING', cat:'Address Validation', score:50, ver:1, labels:[], expr:'($addressValidation: addressValidation != null) eval($addressValidation.decisionType == "WARNING")', conds:[{id:'c1',field:'addressValidation.decisionType',op:'equals',val:'WARNING',conn:null}], action:'add_score', mod:'4/8/26, 3:47 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r8', name:'ID - Tokenized Name MISMATCH', cat:'ID Data Extraction', score:50, ver:1, labels:[], expr:'($extraction: extraction != null) eval(matchFuzzyTokenized($extraction.lastName, $nameCheck.lastName, 80) == false)', conds:[{id:'c1',field:'extraction.lastName',op:'fuzzy_match',val:'nameCheck.lastName',conn:null}], action:'add_score', mod:'3/4/26, 6:19 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r9', name:'SELFIE Usability REJECTED', cat:'ID Verification', score:100, ver:1, labels:['USABILITY'], expr:'($usabilityList: usabilityList != null) eval($usabilityList.usabilityStatus == "REJECTED")', conds:[{id:'c1',field:'usabilityList.usabilityStatus',op:'equals',val:'REJECTED',conn:null}], action:'add_score', mod:'2/23/26, 6:32 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r10', name:'Authentication Rejected', cat:'ID Verification', score:100, ver:1, labels:[], expr:'($authentication: authentication != null) eval($authentication.decisionType == "REJECTED")', conds:[{id:'c1',field:'authentication.decisionType',op:'equals',val:'REJECTED',conn:null}], action:'add_score', mod:'2/23/26, 6:32 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r11', name:'Screening - was not executed', cat:'Watchlist Screening', score:100, ver:1, labels:[], expr:'($screening: screening != null) eval($screening.decisionType == "NOT_EXECUTED")', conds:[{id:'c1',field:'document.status',op:'equals',val:'NOT_EXECUTED',conn:null}], action:'add_score', mod:'2/23/26, 6:32 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r12', name:'ID expired', cat:'ID Data Extraction', score:80, ver:1, labels:['EXPIRED'], expr:'($extraction: extraction != null) eval($extraction.expiryDate != null && isExpired($extraction.expiryDate) == true)', conds:[{id:'c1',field:'extraction.expiryDate',op:'not_null',val:'',conn:null}], action:'add_score', mod:'2/23/26, 6:32 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r13', name:'ID Usability NOT EXECUTED', cat:'ID Verification', score:100, ver:1, labels:['USABILITY'], expr:'($usabilityList: usabilityList != null) eval($usabilityList.usabilityStatus == "NOT_EXECUTED")', conds:[{id:'c1',field:'usabilityList.usabilityStatus',op:'equals',val:'NOT_EXECUTED',conn:null}], action:'add_score', mod:'2/23/26, 6:32 PM' , workflowId: '10020', status: 'active' as const },
  { id:'r14', name:'Not yet 18 years old', cat:'ID Data Extraction', score:80, ver:1, labels:['underAge'], expr:'(($extraction: extraction != null), extraction.currentAge != null, (Integer.parseInt(extraction.currentAge) < 18))', conds:[{id:'c1',field:'extraction.currentAge',op:'not_null',val:'',conn:null},{id:'c2',field:'extraction.currentAge',op:'less_than',val:'18',conn:'AND'}], action:'add_score', mod:'2/23/26, 6:32 PM' },
];

export type MockTx = {
  id: string;
  label: string;
  facts: Record<string, any>;
};

export const TRANSACTIONS: Record<string, MockTx> = {
  'adce849a-0575-4d72-89c0-28a44b94636c': {
    id: 'adce849a-0575-4d72-89c0-28a44b94636c',
    label: 'Colombia ID — Score 50, Warning',
    facts: { addressValidation:{decisionType:'PASSED',decisionLabel:'PASSED'}, authentication:{decisionType:'PASSED'}, dataChecks:{decisionType:'PASSED'}, extraction:{issuingCountry:'COL',subType:'ID_CARD',firstName:'MARIA',lastName:'GARCIA',currentAge:'32',expiryDate:'2027-03-15'}, document:{status:'APPROVED_VERIFIED',type:'ID_CARD'}, usabilityList:{usabilityStatus:'PASSED'} },
  },
  'd87c809b-15d6-40fa-8d3f-3c88f22e55cd': {
    id: 'd87c809b-15d6-40fa-8d3f-3c88f22e55cd',
    label: 'Germany Passport — Clean Pass',
    facts: { addressValidation:{decisionType:'PASSED',decisionLabel:'PASSED'}, authentication:{decisionType:'PASSED'}, dataChecks:{decisionType:'PASSED'}, extraction:{issuingCountry:'DEU',subType:'PASSPORT',firstName:'HANS',lastName:'MUELLER',currentAge:'34',expiryDate:'2030-01-20'}, document:{status:'APPROVED_VERIFIED',type:'PASSPORT'}, usabilityList:{usabilityStatus:'PASSED'} },
  },
  'b3a91c40-2e7f-44a1-b8c5-f6e8d2194821': {
    id: 'b3a91c40-2e7f-44a1-b8c5-f6e8d2194821',
    label: 'USA Driving License — Rejected (Age <18)',
    facts: { addressValidation:{decisionType:'REJECTED',decisionLabel:'REJECTED'}, authentication:{decisionType:'PASSED'}, dataChecks:{decisionType:'PASSED'}, extraction:{issuingCountry:'USA',subType:'DRIVING_LICENSE',firstName:'JOHN',lastName:'DOE',currentAge:'16',expiryDate:'2026-06-15'}, document:{status:'APPROVED_VERIFIED',type:'DRIVING_LICENSE'}, usabilityList:{usabilityStatus:'PASSED'} },
  },
  'c7f2a831-9b4e-4d62-a1f0-8e3c5b7d9012': {
    id: 'c7f2a831-9b4e-4d62-a1f0-8e3c5b7d9012',
    label: 'UK Passport — Under 18 Warning',
    facts: { addressValidation:{decisionType:'PASSED',decisionLabel:'PASSED'}, authentication:{decisionType:'PASSED'}, dataChecks:{decisionType:'PASSED'}, extraction:{issuingCountry:'GBR',subType:'PASSPORT',firstName:'EMMA',lastName:'WILSON',currentAge:'15',expiryDate:'2028-03-22'}, document:{status:'APPROVED_VERIFIED',type:'PASSPORT'}, usabilityList:{usabilityStatus:'PASSED'} },
  },
};

export const FACTS_META = [
  { id:'extraction.issuingCountry', label:'Issuing Country', group:'Extraction', examples:['DEU','USA','GBR','IND','COL','SGP','KAZ','ZMB','GHA'] },
  { id:'extraction.subType', label:'Document Sub Type', group:'Extraction', examples:['PASSPORT','DRIVING_LICENSE','NATIONAL_ID','REGULAR_DRIVING_LICENSE','MILITARY_ID'] },
  { id:'extraction.currentAge', label:'Current Age', group:'Extraction', examples:[] },
  { id:'extraction.firstName', label:'First Name', group:'Extraction', examples:[] },
  { id:'extraction.lastName', label:'Last Name', group:'Extraction', examples:[] },
  { id:'extraction.expiryDate', label:'Expiry Date', group:'Extraction', examples:[] },
  { id:'extraction.address.line1', label:'Address Line 1', group:'Extraction', examples:[] },
  { id:'classification.internalIdSubType', label:'Internal ID SubType', group:'Classification', examples:[] },
  { id:'addressValidation.decisionType', label:'Address Decision Type', group:'Address Validation', examples:['PASSED','REJECTED','NOT_EXECUTED','WARNING','UNSUPPORTED_COUNTRY'] },
  { id:'authentication.decisionType', label:'Auth Decision Type', group:'Authentication', examples:['PASSED','REJECTED','NOT_EXECUTED'] },
  { id:'dataChecks.decisionType', label:'Data Checks Decision', group:'Data Checks', examples:['PASSED','FAILED','WARNING'] },
  { id:'usabilityList.usabilityStatus', label:'Usability Status', group:'Usability', examples:['NOT_EXECUTED','PASSED','REJECTED'] },
  { id:'document.status', label:'Document Status', group:'Document', examples:['APPROVED_VERIFIED','DENIED_FRAUD','ERROR_NOT_READABLE_ID'] },
  { id:'document.type', label:'Document Type', group:'Document', examples:['PASSPORT','DRIVING_LICENSE','ID_CARD','VISA'] },
];

export const OPERATORS = [
  { id:'equals', label:'equals' },
  { id:'not_equals', label:'not equals' },
  { id:'less_than', label:'less than' },
  { id:'greater_than', label:'greater than' },
  { id:'not_null', label:'is not null' },
  { id:'is_null', label:'is null' },
  { id:'contains', label:'contains' },
  { id:'fuzzy_match', label:'fuzzy matches (80%)' },
  { id:'in', label:'is one of' },
];

export const ACTIONS = [
  { id:'add_score', label:'Add to Risk Score' },
  { id:'set_score', label:'Set Risk Score' },
  { id:'reject', label:'Reject Transaction' },
  { id:'flag_review', label:'Flag for Review' },
  { id:'add_label', label:'Add Label' },
];

export const CATEGORIES = [
  'ID Data Extraction','ID Verification','Address Validation',
  'Fraud Detection','Age Verification','Document Classification','Watchlist Screening',
];

export function genExpr(conds: Condition[]): string {
  if (!conds.length || !conds[0].field) return '';
  const groups = [...new Set(conds.map(c => c.field.split('.')[0]))];
  const bindings = groups.map(g => `($${g}: ${g} != null)`).join(', ');
  const parts = conds.map((c, i) => {
    const pre = i === 0 ? '' : `${c.conn || 'AND'} `;
    const f = `$${c.field}`;
    if (c.op === 'equals') return `${pre}${f} == "${c.val}"`;
    if (c.op === 'not_equals') return `${pre}${f} != "${c.val}"`;
    if (c.op === 'less_than') return `${pre}Integer.parseInt(${f}) < ${c.val}`;
    if (c.op === 'greater_than') return `${pre}Integer.parseInt(${f}) > ${c.val}`;
    if (c.op === 'not_null') return `${pre}${f} != null`;
    if (c.op === 'is_null') return `${pre}${f} == null`;
    if (c.op === 'contains') return `${pre}${f}.contains("${c.val}")`;
    if (c.op === 'fuzzy_match') return `${pre}matchFuzzyTokenized(${f}, "${c.val}", 80) == false`;
    return `${pre}${f} == "${c.val}"`;
  });
  return `${bindings}\neval(\n  ${parts.join('\n  ')}\n)`;
}

function editDist(a: string, b: string): number {
  const m: number[][] = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      m[i][j] = b[i-1] === a[j-1] ? m[i-1][j-1] : 1 + Math.min(m[i-1][j-1], m[i][j-1], m[i-1][j]);
  return m[b.length][a.length];
}

export type CondResult = Condition & { actualVal: any; passed: boolean; reason: string };
export type SimResult = { ruleId: string; ruleName: string; triggered: boolean; condResults: CondResult[]; scoreContribution: number; explanation: string };

function getVal(facts: any, path: string): any {
  return path.split('.').reduce((o, k) => o?.[k], facts);
}

export function simulate(rule: Rule, facts: Record<string, any>): SimResult {
  const condResults: CondResult[] = rule.conds.map(c => {
    const av = getVal(facts, c.field);
    let passed = false, reason = '';
    switch (c.op) {
      case 'equals': passed = String(av) === String(c.val); reason = passed ? `"${av}" equals "${c.val}"` : `"${av}" ≠ "${c.val}"`; break;
      case 'not_equals': passed = String(av) !== String(c.val); reason = passed ? `"${av}" ≠ "${c.val}"` : `"${av}" equals "${c.val}" (should differ)`; break;
      case 'not_null': passed = av != null && av !== ''; reason = passed ? `Has value: "${av}"` : 'Field is null/empty'; break;
      case 'is_null': passed = av == null || av === ''; reason = passed ? 'Field is null' : `Has value: "${av}" (should be null)`; break;
      case 'less_than': passed = Number(av) < Number(c.val); reason = passed ? `${av} < ${c.val}` : `${av} is not < ${c.val}`; break;
      case 'greater_than': passed = Number(av) > Number(c.val); reason = passed ? `${av} > ${c.val}` : `${av} not > ${c.val}`; break;
      case 'contains': passed = String(av||'').toLowerCase().includes(String(c.val).toLowerCase()); reason = passed ? `"${av}" contains "${c.val}"` : `"${av}" does not contain "${c.val}"`; break;
      case 'fuzzy_match': {
        const a = String(av||''), b = String(c.val||'');
        const longer = a.length > b.length ? a : b, shorter = a.length > b.length ? b : a;
        const sim = longer.length ? Math.round(((longer.length - editDist(longer.toLowerCase(), shorter.toLowerCase())) / longer.length) * 100) : 0;
        passed = sim >= 80; reason = `Similarity: ${sim}% (threshold: 80%) — ${passed ? 'PASSED' : 'FAILED'}`;
        break;
      }
      default: passed = false; reason = 'Unknown operator';
    }
    return { ...c, actualVal: av, passed, reason };
  });
  let ok = condResults[0]?.passed ?? false;
  for (let i = 1; i < condResults.length; i++)
    ok = condResults[i].conn === 'OR' ? ok || condResults[i].passed : ok && condResults[i].passed;
  const failed = condResults.filter(c => !c.passed);
  const explanation = ok
    ? `Rule "${rule.name}" triggered. All ${condResults.length} condition(s) passed. Score +${rule.score} applied.`
    : failed.length
      ? `Rule "${rule.name}" did NOT trigger. Failed condition: "${failed[0].field}" — ${failed[0].reason}.`
      : 'Rule did not trigger.';
  return { ruleId: rule.id, ruleName: rule.name, triggered: ok, condResults, scoreContribution: ok ? rule.score : 0, explanation };
}
