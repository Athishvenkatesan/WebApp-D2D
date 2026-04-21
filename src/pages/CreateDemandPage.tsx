import { useState } from 'react';
import type { AuthUser, EnhancementDemand, ToastType } from '../types';
import { getReviewers, getApprovers } from '../auth';
import { createDemand, updateDemand, getAllDemands, generateId } from '../store';

// ── Form state ───────────────────────────────────────────────────
type FormState = {
  demandTitle: string;
  demandReference: string;
  currentState: string;
  challengesGaps: string;
  expectedDelivery: string;
  businessRules: string;
  detailedRequirement: string;
  systemType: 'SAP' | 'Non-SAP' | '';
  module: string;
  subModule: string;
  strategicObjectives: string;
  reviewerUsername: string;
  approverUsername: string;
  benefitImpact: string;
  benefitType: string;
  benefitStatement: string;
  targetValue: string;
  budgetAvailability: 'Yes' | 'No' | '';
  budgetCode: string;
  commentsKeyPoints: string;
  attachments: string[];
};

const BLANK: FormState = {
  demandTitle: '',
  demandReference: 'new',
  currentState: '',
  challengesGaps: '',
  expectedDelivery: '',
  businessRules: '',
  detailedRequirement: '',
  systemType: '',
  module: '',
  subModule: '',
  strategicObjectives: '',
  reviewerUsername: '',
  approverUsername: '',
  benefitImpact: '',
  benefitType: '',
  benefitStatement: '',
  targetValue: '',
  budgetAvailability: '',
  budgetCode: '',
  commentsKeyPoints: '',
  attachments: [],
};

// ── Fields tracked for completion % ─────────────────────────────
const TRACKED: Array<{ key: keyof FormState; label: string }> = [
  { key: 'demandTitle',        label: 'Demand Title' },
  { key: 'currentState',       label: 'Current State' },
  { key: 'challengesGaps',     label: 'Challenges / Gaps' },
  { key: 'expectedDelivery',   label: 'Expected Delivery' },
  { key: 'businessRules',      label: 'Business Rules' },
  { key: 'detailedRequirement',label: 'Detailed Requirement' },
  { key: 'systemType',         label: 'System Type' },
  { key: 'module',             label: 'Module / Platform' },
  { key: 'subModule',          label: 'Sub Module / App' },
  { key: 'strategicObjectives',label: 'Strategic Objectives' },
  { key: 'reviewerUsername',   label: 'Reviewer' },
  { key: 'approverUsername',   label: 'Approver' },
  { key: 'benefitImpact',      label: 'Benefit Impact' },
  { key: 'benefitType',        label: 'Benefit Type' },
  { key: 'benefitStatement',   label: 'Benefit Statement (ROI)' },
  { key: 'targetValue',        label: 'Target Value (AED)' },
  { key: 'budgetAvailability', label: 'Budget Availability' },
  { key: 'commentsKeyPoints',  label: 'Comments & Key Points' },
];

// ── AI Suggestions ───────────────────────────────────────────────
type AISuggestions = {
  systemType: 'SAP' | 'Non-SAP';
  module: string;
  subModule: string;
  strategicObjectives: string;
  benefitImpact: string;
  benefitType: string;
  benefitStatement: string;
  businessRules: string;
  detailedRequirement: string;
  expectedDelivery: string;
  isNewProject: boolean;
};

function buildAISuggestions(title: string, state: string, challenges: string): AISuggestions {
  const text = `${title} ${state} ${challenges}`.toLowerCase();
  const yr   = new Date().getFullYear();

  const sapKw = ['sap', 's/4hana', 'fiori', 'hcm', ' fi ', ' co ', ' mm ', ' sd ',
    'erp', 'plant maintenance', 'payroll', 'materials management', 'asset accounting'];
  const isSAP = sapKw.some(w => text.includes(w));

  let module    = isSAP ? 'Finance & Controlling'  : 'Digital Platforms';
  let subModule = isSAP ? 'General Ledger'          : 'Web Application';

  if (/hr|human resource|employee|leave|payroll|hcm/.test(text)) {
    module = isSAP ? 'Human Capital Management' : 'HR Systems';
    subModule = isSAP ? 'Employee Self-Service'  : 'HR Portal';
  } else if (/customer|portal|self.?service|cx/.test(text)) {
    module = isSAP ? 'Customer Experience'  : 'Customer Channels';
    subModule = isSAP ? 'CX Portal'         : 'Self-Service Portal';
  } else if (/finance|financial|budget|accounting|invoice|billing/.test(text)) {
    module = isSAP ? 'Finance & Controlling'      : 'Finance Systems';
    subModule = isSAP ? 'General Ledger & Reporting' : 'Financial Dashboard';
  } else if (/vendor|supplier|procure|purchase|contract/.test(text)) {
    module = isSAP ? 'Materials Management'       : 'Procurement Systems';
    subModule = isSAP ? 'Vendor Lifecycle Management' : 'Vendor Portal';
  } else if (/asset|maintenance|plant|facility/.test(text)) {
    module = isSAP ? 'Plant Maintenance' : 'Operations Technology';
    subModule = isSAP ? 'Asset Management' : 'IoT Asset Tracking';
  } else if (/grid|power|energy|scada|monitoring|outage/.test(text)) {
    module = 'Grid Operations';
    subModule = 'Real-Time Monitoring & Control';
  } else if (/chatbot|helpdesk|service desk|itsm|ticket/.test(text)) {
    module = 'IT Service Management';
    subModule = 'AI & Automation';
  } else if (/data|warehouse|analytics|report|dashboard|bi/.test(text)) {
    module = isSAP ? 'Business Intelligence' : 'Data & Analytics';
    subModule = isSAP ? 'SAP Analytics Cloud' : 'Data Warehouse';
  } else if (/mobile|app|field|inspection/.test(text)) {
    module = 'Digital Channels';
    subModule = 'Mobile Application';
  }

  let benefitType = 'Efficiency Improvement';
  if (/cost|saving|reduc.*cost/.test(text))             benefitType = 'Cost Saving';
  else if (/revenue|income|profit/.test(text))           benefitType = 'Revenue Generation';
  else if (/risk|compliance|audit|security/.test(text))  benefitType = 'Risk Mitigation';
  else if (/customer.*satisf|cx|user.*experience/.test(text)) benefitType = 'Customer Experience';

  const isNewProject = ['new system','new platform','greenfield','build from scratch',
    'create new','develop new','brand new'].some(w => text.includes(w));

  const t = title.trim() || 'This initiative';
  const firstChallenge = (challenges || '').split(/[.,;]/)[0].trim().toLowerCase();

  return {
    systemType: isSAP ? 'SAP' : 'Non-SAP',
    module,
    subModule,
    strategicObjectives: 'Digital Transformation, Operational Excellence, Customer & Employee Experience',
    benefitImpact: 'High',
    benefitType,
    benefitStatement: `${t} is expected to deliver measurable improvements in operational efficiency, reduce manual effort, and enhance stakeholder experience. The initiative directly supports DEWA's ${yr} digital transformation roadmap.`,
    businessRules: `All components must comply with DEWA IT governance standards, security policies, and PDPL data protection requirements. Integration points must follow DEWA API standards. Role-based access control (RBAC) must be enforced. Audit logs must be maintained for all critical transactions.`,
    detailedRequirement: `The solution must address the identified operational gaps${firstChallenge ? ` by resolving "${firstChallenge}"` : ''}. Key requirements: (1) Intuitive UI with role-based access; (2) Seamless integration with existing DEWA enterprise systems; (3) Comprehensive reporting and audit trail; (4) Scalable architecture aligned with DEWA cloud strategy; (5) Full compliance with DEWA IT security and data governance standards; (6) Provision for UAT, training, and knowledge transfer.`,
    expectedDelivery: `Phase 1 – Core development & integration: Q3 ${yr}\nPhase 2 – Testing, UAT & training: Q4 ${yr}\nFull go-live & hypercare: Q1 ${yr + 1}`,
    isNewProject,
  };
}

// ── BRD content builder ──────────────────────────────────────────
interface BRDSection { title: string; body: string }

function buildBRD(form: FormState, author: string) {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const docNo = `BRD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3,'0')}`;
  const isNonSAP = form.systemType === 'Non-SAP';
  const sections: BRDSection[] = [
    {
      title: '1. Executive Summary',
      body: form.demandTitle
        ? `This Business Requirements Document outlines the requirements for "${form.demandTitle}". The demand has been raised to address current operational challenges and deliver measurable business value in alignment with DEWA's strategic objectives. Prepared by: ${author}. Reference: ${docNo}.`
        : 'To be defined.',
    },
    { title: '2. Current State & Problem Statement', body: form.currentState       || 'To be defined.' },
    { title: '3. Challenges & Gaps',                  body: form.challengesGaps    || 'To be defined.' },
    {
      title: '4. Proposed Solution & Deliverables',
      body: form.detailedRequirement || form.expectedDelivery || 'To be defined.',
    },
    { title: '5. Business Rules & Validation Criteria', body: form.businessRules   || 'Standard DEWA IT governance and compliance rules apply.' },
    {
      title: '6. System & Technical Details',
      body: [
        form.systemType && `System Type: ${form.systemType}`,
        form.module     && `${isNonSAP ? 'Platform' : 'Module'}: ${form.module}`,
        form.subModule  && `${isNonSAP ? 'Application Name' : 'Sub Module'}: ${form.subModule}`,
      ].filter(Boolean).join('\n') || 'To be defined.',
    },
    { title: '7. Strategic Alignment',   body: form.strategicObjectives || 'To be defined.' },
    {
      title: '8. Business Benefits & ROI',
      body: [
        form.benefitType      && `Benefit Type: ${form.benefitType}`,
        form.benefitImpact    && `Impact Level: ${form.benefitImpact}`,
        form.benefitStatement && `\nBenefit Statement:\n${form.benefitStatement}`,
        form.targetValue      && `\nTarget Value: AED ${Number(form.targetValue).toLocaleString()}`,
      ].filter(Boolean).join('\n') || 'To be defined.',
    },
    {
      title: '9. Budget Information',
      body: [
        form.budgetAvailability && `Budget Available: ${form.budgetAvailability}`,
        form.budgetCode         && `Budget Code: ${form.budgetCode}`,
      ].filter(Boolean).join('\n') || 'Budget details to be confirmed.',
    },
    { title: '10. Comments & Key Points', body: form.commentsKeyPoints || 'None.' },
  ];
  return { docNo, date: today, title: form.demandTitle || 'Untitled Demand', sections };
}

function openPrintWindow(form: FormState, author: string) {
  const brd = buildBRD(form, author);
  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><title>BRD – ${brd.title}</title>
<style>
*{box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;max-width:820px;margin:0 auto;padding:40px 32px;color:#111;font-size:13px}
.logo-bar{display:flex;align-items:center;gap:12px;border-bottom:3px solid #1a7a4e;padding-bottom:12px;margin-bottom:24px}
.logo-txt{font-size:11px;color:#6b7280}
h1{color:#1a7a4e;font-size:22px;margin:0 0 4px}
.meta{color:#6b7280;font-size:11px;margin-bottom:6px}
.demand-title{font-size:15px;font-weight:700;color:#111;padding-bottom:16px;border-bottom:1px solid #e5e7eb;margin-bottom:20px}
.section{margin-bottom:18px;padding:14px 16px;background:#f9fafb;border-radius:8px;border-left:3px solid #1a7a4e;page-break-inside:avoid}
.section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#1a7a4e;margin-bottom:7px}
.section-body{line-height:1.6;white-space:pre-wrap;color:#374151}
.footer{margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
@media print{body{padding:20px}}
</style></head><body>
<div class="logo-bar">
  <div><div style="font-size:18px;font-weight:900;color:#1a7a4e">DEWA</div>
  <div class="logo-txt">Demand to Delivery · D2D Platform</div></div>
</div>
<h1>Business Requirements Document</h1>
<div class="meta">Doc No: ${brd.docNo} &nbsp;|&nbsp; Date: ${brd.date} &nbsp;|&nbsp; Version: 1.0 &nbsp;|&nbsp; Prepared by: ${author}</div>
<div class="demand-title">Demand: ${brd.title}</div>
${brd.sections.map(s => `<div class="section"><div class="section-title">${s.title}</div><div class="section-body">${s.body}</div></div>`).join('')}
<div class="footer">DEWA D2D Platform · Confidential · ${brd.docNo}</div>
</body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 400); }
}

// ── Per-field AI Suggestion Box ──────────────────────────────────
function SuggestionBox({ field, suggestions, onApply }: {
  field: string;
  suggestions: Record<string, string>;
  onApply: (field: string) => void;
}) {
  if (!suggestions[field]) return null;
  return (
    <div className="ai-suggestion-box">
      <div className="ai-suggestion-hdr">
        <span className="ai-suggestion-lbl">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
            <path d="M12 2l1.09 3.26L16 6.5l-2.91.24L12 10l-1.09-3.26L8 5.5l2.91-.24L12 2z"/>
          </svg>
          AI Response
        </span>
        <button className="ai-apply-btn" type="button" onClick={() => onApply(field)}>
          Apply Suggestion
        </button>
      </div>
      <div className="ai-suggestion-text">{suggestions[field]}</div>
    </div>
  );
}

// ── Circular progress SVG ────────────────────────────────────────
function CircleProgress({ pct }: { pct: number }) {
  const R = 28, CIRC = 2 * Math.PI * R;
  const color = pct === 100 ? '#22c55e' : pct > 60 ? '#1a7a4e' : pct > 25 ? '#f59e0b' : '#d1d5db';
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
      <circle cx="36" cy="36" r={R} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle cx="36" cy="36" r={R} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct / 100)}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827">{pct}%</text>
    </svg>
  );
}

// ── BRD Preview Modal ────────────────────────────────────────────
function BRDModal({ form, author, onClose, onPDF }: {
  form: FormState; author: string; onClose: () => void; onPDF: () => void;
}) {
  const brd = buildBRD(form, author);
  return (
    <div className="brd-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="brd-modal">
        <div className="brd-modal-head">
          <div className="brd-modal-head-l">
            <div className="da-panel-hdr-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <div className="brd-modal-title">BRD Preview</div>
              <div className="brd-modal-sub">{brd.docNo} · {brd.date} · Version 1.0</div>
            </div>
          </div>
          <div className="brd-modal-actions">
            <button className="da-btn-generate" onClick={onPDF} type="button" style={{ padding: '8px 14px', fontSize: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Generate PDF
            </button>
            <button className="brd-close-btn" onClick={onClose} type="button">✕</button>
          </div>
        </div>

        <div className="brd-body">
          <div className="brd-doc-title">Business Requirements Document</div>
          <div className="brd-doc-meta">
            Doc: {brd.docNo} &nbsp;·&nbsp; {brd.date} &nbsp;·&nbsp; v1.0 &nbsp;·&nbsp; Prepared by: {author}
          </div>
          <div className="brd-doc-demand">Demand: {brd.title || <em style={{ color: '#9ca3af' }}>Untitled</em>}</div>
          {brd.sections.map((s) => (
            <div key={s.title} className="brd-section">
              <div className="brd-section-title">{s.title}</div>
              <div className={`brd-section-body${s.body === 'To be defined.' || s.body === 'None.' ? ' brd-section-empty' : ''}`}>
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
interface CreateDemandPageProps {
  currentUser: AuthUser;
  onBack: () => void;
  showToast: (msg: string, type?: ToastType) => void;
  editDemand?: EnhancementDemand;
}

export default function CreateDemandPage({ currentUser, onBack, showToast, editDemand }: CreateDemandPageProps) {
  const isEditMode = !!editDemand;
  const [activeSection, setActiveSection] = useState<'basic' | 'system'>('basic');
  const [form, setForm]                   = useState<FormState>(editDemand ? {
    demandTitle:        editDemand.demandTitle,
    demandReference:    editDemand.demandReference,
    currentState:       editDemand.currentState,
    challengesGaps:     editDemand.challengesGaps,
    expectedDelivery:   editDemand.expectedDelivery,
    businessRules:      editDemand.businessRules,
    detailedRequirement:editDemand.detailedRequirement,
    systemType:         editDemand.systemType,
    module:             editDemand.module,
    subModule:          editDemand.subModule,
    strategicObjectives:editDemand.strategicObjectives,
    reviewerUsername:   editDemand.reviewerUsername,
    approverUsername:   editDemand.approverUsername,
    benefitImpact:      editDemand.benefitImpact,
    benefitType:        editDemand.benefitType,
    benefitStatement:   editDemand.benefitStatement,
    targetValue:        editDemand.targetValue,
    budgetAvailability: editDemand.budgetAvailability,
    budgetCode:         editDemand.budgetCode,
    commentsKeyPoints:  editDemand.commentsKeyPoints,
    attachments:        editDemand.attachments ?? [],
  } : { ...BLANK });
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [submitting, setSubmitting]       = useState(false);
  const [aiLoading, setAiLoading]         = useState(false);
  const [aiSuggestCount, setAiSuggestCount] = useState(0);
  const [aiNewProjWarn, setAiNewProjWarn] = useState(false);
  const [aiInputError, setAiInputError]   = useState('');
  const [brdPreview, setBrdPreview]       = useState(false);
  const [suggestions, setSuggestions]     = useState<Record<string, string>>({});

  const reviewers       = getReviewers();
  const approvers       = getApprovers();
  const existingDemands = getAllDemands().filter((d) => d.initiatorUsername === currentUser.username);

  // ── Completion tracking ───────────────────────────────────────
  const filledFields = TRACKED.filter((f) => {
    const v = form[f.key];
    return v !== '' && v !== undefined && String(v).trim().length > 0;
  });
  const completionPct  = Math.round((filledFields.length / TRACKED.length) * 100);
  const missingFields  = TRACKED.filter((f) => {
    const v = form[f.key];
    return !v || String(v).trim().length === 0;
  }).map((f) => f.label);

  const completionTip =
    completionPct === 0   ? 'Start by filling in the Demand Title and Current State.' :
    completionPct < 33    ? "Adding 'Challenges / Gaps' helps AI suggest better solutions." :
    completionPct < 66    ? 'Great progress! Fill System Details to unlock BRD Generator.' :
    completionPct < 100   ? 'Almost there! Complete the remaining fields before submitting.' :
                            'All fields filled — ready to submit!';

  // ── Helpers ───────────────────────────────────────────────────
  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleReferenceChange = (val: string) => {
    set('demandReference', val);
    if (val !== 'new' && val !== '') {
      const e = getAllDemands().find((d) => d.id === val);
      if (e) {
        setForm((prev) => ({
          ...prev, demandReference: val,
          demandTitle: e.demandTitle, currentState: e.currentState,
          challengesGaps: e.challengesGaps, expectedDelivery: e.expectedDelivery,
          businessRules: e.businessRules, detailedRequirement: e.detailedRequirement,
          systemType: e.systemType, module: e.module, subModule: e.subModule,
          strategicObjectives: e.strategicObjectives, reviewerUsername: e.reviewerUsername,
          approverUsername: e.approverUsername, benefitImpact: e.benefitImpact,
          benefitType: e.benefitType, benefitStatement: e.benefitStatement,
          targetValue: e.targetValue, budgetAvailability: e.budgetAvailability,
          budgetCode: e.budgetCode, commentsKeyPoints: e.commentsKeyPoints,
        }));
      }
    }
  };

  // ── Validation ────────────────────────────────────────────────
  const validateBasic = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.demandTitle.trim())    e.demandTitle    = 'Demand Title is required.';
    if (!form.currentState.trim())   e.currentState   = 'Current State is required.';
    if (!form.challengesGaps.trim()) e.challengesGaps = 'Challenges / Gaps is required.';
    if (!form.expectedDelivery.trim()) e.expectedDelivery = 'Expected Delivery is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSystem = (): boolean => {
    const e: Record<string, string> = {};
    const ns = form.systemType === 'Non-SAP';
    if (!form.systemType)              e.systemType         = 'System Type is required.';
    if (!form.module.trim())           e.module             = `${ns ? 'Platform' : 'Module'} is required.`;
    if (!form.subModule.trim())        e.subModule          = `${ns ? 'Application Name' : 'Sub Module'} is required.`;
    if (!form.strategicObjectives.trim()) e.strategicObjectives = 'Strategic Objectives is required.';
    if (!form.reviewerUsername)        e.reviewerUsername   = 'Reviewer is required.';
    if (!form.approverUsername)        e.approverUsername   = 'Approver is required.';
    if (!form.benefitImpact.trim())    e.benefitImpact      = 'Benefit Impact is required.';
    if (!form.benefitType.trim())      e.benefitType        = 'Benefit Type is required.';
    if (!form.benefitStatement.trim()) e.benefitStatement   = 'Benefit Statement is required.';
    if (!form.targetValue.trim())      e.targetValue        = 'Target Value is required.';
    if (!form.budgetAvailability)      e.budgetAvailability = 'Budget Availability is required.';
    if (form.budgetAvailability === 'Yes' && !form.budgetCode.trim()) e.budgetCode = 'Budget Code is required.';
    if (!form.commentsKeyPoints.trim()) e.commentsKeyPoints = 'Comments / Key Points is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── AI Analysis ───────────────────────────────────────────────
  const handleRunAI = () => {
    if (!form.demandTitle.trim()) { setAiInputError('Please fill in Demand Title first.'); return; }
    if (!form.currentState.trim()) { setAiInputError('Please fill in Current State first.'); return; }
    setAiInputError('');
    setAiLoading(true);
    setAiNewProjWarn(false);
    setSuggestions({});

    setTimeout(() => {
      const s = buildAISuggestions(form.demandTitle, form.currentState, form.challengesGaps);
      const newSuggestions: Record<string, string> = {
        systemType:          s.systemType,
        module:              s.module,
        subModule:           s.subModule,
        strategicObjectives: s.strategicObjectives,
        benefitImpact:       s.benefitImpact,
        benefitType:         s.benefitType,
        benefitStatement:    s.benefitStatement,
        businessRules:       s.businessRules,
        detailedRequirement: s.detailedRequirement,
        expectedDelivery:    s.expectedDelivery,
      };
      setSuggestions(newSuggestions);
      setAiSuggestCount(Object.keys(newSuggestions).length);
      setAiNewProjWarn(s.isNewProject);
      setAiLoading(false);
    }, 1800);
  };

  const applySuggestion = (field: string) => {
    set(field, suggestions[field]);
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ── Save / Submit ─────────────────────────────────────────────
  const buildDemand = (status: 'draft' | 'submitted'): EnhancementDemand => {
    const now = new Date().toISOString();
    return {
      ...form, id: generateId(), createdAt: now, updatedAt: now,
      initiatorUsername: currentUser.username, initiatorName: currentUser.name,
      status, reviewerComments: '', approverComments: '',
      reviewerActionDate: '', approverActionDate: '',
    };
  };

  const handleSave = () => {
    if (isEditMode) {
      updateDemand(editDemand!.id, { ...form, status: 'draft', updatedAt: new Date().toISOString() });
    } else {
      createDemand(buildDemand('draft'));
    }
    showToast(`"${form.demandTitle || 'Demand'}" saved as Draft.`, 'success');
    onBack();
  };

  const handleNextSection = () => {
    if (!validateBasic()) return;
    setActiveSection('system');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    if (activeSection === 'basic') { if (!validateBasic()) return; setActiveSection('system'); return; }
    if (!validateBasic() || !validateSystem()) {
      showToast('Please fix all required fields before submitting.', 'warn');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      if (isEditMode) {
        updateDemand(editDemand!.id, { ...form, status: 'submitted', updatedAt: new Date().toISOString() });
      } else {
        createDemand(buildDemand('submitted'));
      }
      setSubmitting(false);
      showToast(`"${form.demandTitle}" ${isEditMode ? 're-submitted' : 'submitted'} for review!`, 'success');
      onBack();
    }, 700);
  };

  const handleCancel = () => {
    if (window.confirm('Cancel? All unsaved data will be lost.')) onBack();
  };

  const isNonSAP   = form.systemType === 'Non-SAP';
  const canRunAI   = !!form.demandTitle.trim() && !!form.currentState.trim();

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="create-demand-page">

      {/* ── Header ── */}
      <div className="cdp-header">
        <button className="cdp-back-btn" onClick={onBack} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <div className="cdp-header-content">
          <div className="cdp-badge">{isEditMode ? 'Edit Demand' : 'Enhancement Demand'}</div>
          <h1 className="cdp-title">{isEditMode ? `Editing: ${editDemand!.id}` : 'New Enhancement Request'}</h1>
          <p className="cdp-sub">{isEditMode ? 'Update fields and re-submit or save as draft.' : 'Fill all required fields. Use AI Analysis to auto-suggest content.'}</p>
        </div>
        <div className="cdp-header-actions">
          <button className="cdp-btn-cancel" onClick={handleCancel} type="button">Cancel</button>
          <button className="cdp-btn-save"   onClick={handleSave}   type="button">Save as Draft</button>
          <button className={`cdp-btn-submit${submitting ? ' loading' : ''}`}
            onClick={handleSubmit} type="button" disabled={submitting}>
            {submitting ? <span className="login-spinner" /> : 'Submit for Review →'}
          </button>
        </div>
      </div>

      {/* ── Section stepper ── */}
      {(() => {
        const basicDone = ['demandTitle','currentState','challengesGaps','expectedDelivery'].every(k => !!(form as Record<string,unknown>)[k]);
        const systemDone = completionPct === 100;
        const connectorClass = basicDone ? 'done' : activeSection === 'system' ? 'active' : '';
        return (
          <div className="cdp-stepper">
            <button
              className={`cdp-step-btn${activeSection === 'basic' ? ' active' : ''}${basicDone ? ' done' : ''}`}
              onClick={() => setActiveSection('basic')} type="button">
              <div className="cdp-step-circle">
                {basicDone
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                  : '1'}
              </div>
              <div className="cdp-step-text">
                <span className="cdp-step-label">Basic Information</span>
                <span className="cdp-step-hint">Title · State · Requirements</span>
              </div>
            </button>

            <div className={`cdp-step-connector ${connectorClass}`} />

            <button
              className={`cdp-step-btn${activeSection === 'system' ? ' active' : ''}${systemDone ? ' done' : ''}`}
              onClick={() => { if (validateBasic()) setActiveSection('system'); }} type="button">
              <div className="cdp-step-circle">
                {systemDone
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                  : '2'}
              </div>
              <div className="cdp-step-text">
                <span className="cdp-step-label">System Details</span>
                <span className="cdp-step-hint">System · Benefits · Approval</span>
              </div>
            </button>
          </div>
        );
      })()}

      {/* ── Two-column layout ── */}
      <div className="cdp-with-panel">

        {/* ─── LEFT: Form ─── */}
        <div className="cdp-form-col">

          {/* SECTION 1 — Basic Information */}
          {activeSection === 'basic' && (
            <div className="cdp-section-card">
              <div className="cdp-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                Basic Information
              </div>

              {/* Demand Reference — hidden in edit mode */}
              {!isEditMode && <div className="cdp-field-group">
                <label className="cdp-label">Demand Reference</label>
                <div className="cdp-radio-row">
                  <label className="cdp-radio-opt">
                    <input type="radio" name="demandReference" value="new"
                      checked={form.demandReference === 'new'}
                      onChange={() => handleReferenceChange('new')} />
                    <span>Create as New</span>
                  </label>
                  <label className="cdp-radio-opt">
                    <input type="radio" name="demandReference" value="existing"
                      checked={form.demandReference !== 'new'}
                      onChange={() => set('demandReference', '')} />
                    <span>Copy from Existing Demand</span>
                  </label>
                </div>
                {form.demandReference !== 'new' && (
                  <select className="cdp-input" value={form.demandReference}
                    onChange={(e) => handleReferenceChange(e.target.value)} style={{ marginTop: 8 }}>
                    <option value="">— Select existing demand —</option>
                    {existingDemands.map((d) => (
                      <option key={d.id} value={d.id}>{d.id} — {d.demandTitle}</option>
                    ))}
                  </select>
                )}
                <div className="cdp-hint">Select an existing demand to auto-populate all fields, or create a fresh request.</div>
              </div>}

              <div className="cdp-grid-2">
                <div className={`cdp-field-group cdp-span-2${errors.demandTitle ? ' has-error' : ''}`}>
                  <label className="cdp-label">Demand Title <span className="cdp-req">*</span></label>
                  <input className="cdp-input" placeholder="Enter a clear, concise demand title…"
                    value={form.demandTitle} onChange={(e) => set('demandTitle', e.target.value)} />
                  {errors.demandTitle && <div className="cdp-error">{errors.demandTitle}</div>}
                </div>

                <div className={`cdp-field-group${errors.currentState ? ' has-error' : ''}`}>
                  <label className="cdp-label">Current State <span className="cdp-req">*</span></label>
                  <textarea className="cdp-textarea" rows={4}
                    placeholder="Describe the current state of the system or process…"
                    value={form.currentState} onChange={(e) => set('currentState', e.target.value)} />
                  {errors.currentState && <div className="cdp-error">{errors.currentState}</div>}
                </div>

                <div className={`cdp-field-group${errors.challengesGaps ? ' has-error' : ''}`}>
                  <label className="cdp-label">Challenges / Gaps <span className="cdp-req">*</span></label>
                  <textarea className="cdp-textarea" rows={4}
                    placeholder="What problems or gaps need to be addressed?…"
                    value={form.challengesGaps} onChange={(e) => set('challengesGaps', e.target.value)} />
                  {errors.challengesGaps && <div className="cdp-error">{errors.challengesGaps}</div>}
                </div>

                <div className={`cdp-field-group${errors.expectedDelivery ? ' has-error' : ''}`}>
                  <label className="cdp-label">Expected Delivery <span className="cdp-req">*</span></label>
                  <textarea className="cdp-textarea" rows={3}
                    placeholder="Describe expected outcome / delivery milestones…"
                    value={form.expectedDelivery} onChange={(e) => set('expectedDelivery', e.target.value)} />
                  {errors.expectedDelivery && <div className="cdp-error">{errors.expectedDelivery}</div>}
                  <SuggestionBox field="expectedDelivery" suggestions={suggestions} onApply={applySuggestion} />
                </div>

                <div className="cdp-field-group">
                  <label className="cdp-label">Business Rules / Validation</label>
                  <textarea className="cdp-textarea" rows={3}
                    placeholder="Any business rules or validation logic…"
                    value={form.businessRules} onChange={(e) => set('businessRules', e.target.value)} />
                  <SuggestionBox field="businessRules" suggestions={suggestions} onApply={applySuggestion} />
                </div>

                <div className="cdp-field-group cdp-span-2">
                  <label className="cdp-label">Detailed Requirement</label>
                  <textarea className="cdp-textarea" rows={4}
                    placeholder="Provide detailed functional and technical requirements…"
                    value={form.detailedRequirement} onChange={(e) => set('detailedRequirement', e.target.value)} />
                  <SuggestionBox field="detailedRequirement" suggestions={suggestions} onApply={applySuggestion} />
                </div>
              </div>

              <div className="cdp-section-footer">
                <button className="cdp-btn-cancel" onClick={handleCancel} type="button">Cancel</button>
                <button className="cdp-btn-next"   onClick={handleNextSection} type="button">
                  Continue to System Details →
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2 — System Details */}
          {activeSection === 'system' && (
            <div className="cdp-section-card">
              <div className="cdp-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
                System Details
              </div>

              <div className="cdp-grid-2">
                {/* System Type */}
                <div className={`cdp-field-group${errors.systemType ? ' has-error' : ''}`}>
                  <label className="cdp-label">System Type <span className="cdp-req">*</span></label>
                  <div className="cdp-radio-row">
                    <label className="cdp-radio-opt">
                      <input type="radio" name="systemType" value="SAP" checked={form.systemType === 'SAP'}
                        onChange={() => { set('systemType','SAP'); set('module',''); set('subModule',''); }} />
                      <span>SAP</span>
                    </label>
                    <label className="cdp-radio-opt">
                      <input type="radio" name="systemType" value="Non-SAP" checked={form.systemType === 'Non-SAP'}
                        onChange={() => { set('systemType','Non-SAP'); set('module',''); set('subModule',''); }} />
                      <span>Non-SAP</span>
                    </label>
                  </div>
                  {errors.systemType && <div className="cdp-error">{errors.systemType}</div>}
                  <SuggestionBox field="systemType" suggestions={suggestions} onApply={applySuggestion} />
                </div>

                <div className={`cdp-field-group${errors.module ? ' has-error' : ''}`}>
                  <label className="cdp-label">{isNonSAP ? 'Platform' : 'Module'} <span className="cdp-req">*</span></label>
                  <input className="cdp-input"
                    placeholder={isNonSAP ? 'e.g. Microsoft Azure, ServiceNow…' : 'e.g. Finance, HR, MM…'}
                    value={form.module} onChange={(e) => set('module', e.target.value)} />
                  {errors.module && <div className="cdp-error">{errors.module}</div>}
                  <SuggestionBox field="module" suggestions={suggestions} onApply={applySuggestion} />
                </div>

                <div className={`cdp-field-group${errors.subModule ? ' has-error' : ''}`}>
                  <label className="cdp-label">{isNonSAP ? 'Application Name' : 'Sub Module'} <span className="cdp-req">*</span></label>
                  <input className="cdp-input"
                    placeholder={isNonSAP ? 'e.g. Power BI, ServiceNow ITSM…' : 'e.g. General Ledger, Payroll…'}
                    value={form.subModule} onChange={(e) => set('subModule', e.target.value)} />
                  {errors.subModule && <div className="cdp-error">{errors.subModule}</div>}
                  <SuggestionBox field="subModule" suggestions={suggestions} onApply={applySuggestion} />
                </div>

                <div className={`cdp-field-group cdp-span-2${errors.strategicObjectives ? ' has-error' : ''}`}>
                  <label className="cdp-label">Strategic Objectives <span className="cdp-req">*</span></label>
                  <textarea className="cdp-textarea" rows={3}
                    placeholder="How does this demand align with DEWA's strategic objectives?…"
                    value={form.strategicObjectives} onChange={(e) => set('strategicObjectives', e.target.value)} />
                  {errors.strategicObjectives && <div className="cdp-error">{errors.strategicObjectives}</div>}
                  <SuggestionBox field="strategicObjectives" suggestions={suggestions} onApply={applySuggestion} />
                </div>

                <div className={`cdp-field-group${errors.reviewerUsername ? ' has-error' : ''}`}>
                  <label className="cdp-label">Reviewer <span className="cdp-req">*</span></label>
                  <select className="cdp-input" value={form.reviewerUsername}
                    onChange={(e) => set('reviewerUsername', e.target.value)}>
                    <option value="">— Select Reviewer —</option>
                    {reviewers.map((r) => <option key={r.username} value={r.username}>{r.name}</option>)}
                  </select>
                  {errors.reviewerUsername && <div className="cdp-error">{errors.reviewerUsername}</div>}
                </div>

                <div className={`cdp-field-group${errors.approverUsername ? ' has-error' : ''}`}>
                  <label className="cdp-label">Approver <span className="cdp-req">*</span></label>
                  <select className="cdp-input" value={form.approverUsername}
                    onChange={(e) => set('approverUsername', e.target.value)}>
                    <option value="">— Select Approver —</option>
                    {approvers.map((a) => <option key={a.username} value={a.username}>{a.name}</option>)}
                  </select>
                  {errors.approverUsername && <div className="cdp-error">{errors.approverUsername}</div>}
                </div>

                <div className={`cdp-field-group${errors.benefitImpact ? ' has-error' : ''}`}>
                  <label className="cdp-label">Benefit Impact <span className="cdp-req">*</span></label>
                  <select className="cdp-input" value={form.benefitImpact}
                    onChange={(e) => set('benefitImpact', e.target.value)}>
                    <option value="">— Select Impact Level —</option>
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                  {errors.benefitImpact && <div className="cdp-error">{errors.benefitImpact}</div>}
                  <SuggestionBox field="benefitImpact" suggestions={suggestions} onApply={applySuggestion} />
                </div>

                <div className={`cdp-field-group${errors.benefitType ? ' has-error' : ''}`}>
                  <label className="cdp-label">Benefit Type <span className="cdp-req">*</span></label>
                  <select className="cdp-input" value={form.benefitType}
                    onChange={(e) => set('benefitType', e.target.value)}>
                    <option value="">— Select Benefit Type —</option>
                    <option>Cost Saving</option>
                    <option>Revenue Generation</option>
                    <option>Efficiency Improvement</option>
                    <option>Risk Mitigation</option>
                    <option>Compliance</option>
                    <option>Customer Experience</option>
                  </select>
                  {errors.benefitType && <div className="cdp-error">{errors.benefitType}</div>}
                  <SuggestionBox field="benefitType" suggestions={suggestions} onApply={applySuggestion} />
                </div>

                <div className={`cdp-field-group cdp-span-2${errors.benefitStatement ? ' has-error' : ''}`}>
                  <label className="cdp-label">Benefit Statement (ROI) <span className="cdp-req">*</span></label>
                  <textarea className="cdp-textarea" rows={3}
                    placeholder="Describe the measurable business benefit expected…"
                    value={form.benefitStatement} onChange={(e) => set('benefitStatement', e.target.value)} />
                  {errors.benefitStatement && <div className="cdp-error">{errors.benefitStatement}</div>}
                  <SuggestionBox field="benefitStatement" suggestions={suggestions} onApply={applySuggestion} />
                </div>

                <div className={`cdp-field-group${errors.targetValue ? ' has-error' : ''}`}>
                  <label className="cdp-label">Target Value (AED) <span className="cdp-req">*</span></label>
                  <div className="cdp-input-prefix-wrap">
                    <span className="cdp-input-prefix">AED</span>
                    <input className="cdp-input cdp-input-prefixed" placeholder="0.00" type="number" min="0"
                      value={form.targetValue} onChange={(e) => set('targetValue', e.target.value)} />
                  </div>
                  {errors.targetValue && <div className="cdp-error">{errors.targetValue}</div>}
                </div>

                <div className={`cdp-field-group${errors.budgetAvailability ? ' has-error' : ''}`}>
                  <label className="cdp-label">Budget Availability <span className="cdp-req">*</span></label>
                  <div className="cdp-radio-row">
                    <label className="cdp-radio-opt">
                      <input type="radio" name="budget" value="Yes" checked={form.budgetAvailability === 'Yes'}
                        onChange={() => set('budgetAvailability','Yes')} /><span>Yes</span>
                    </label>
                    <label className="cdp-radio-opt">
                      <input type="radio" name="budget" value="No" checked={form.budgetAvailability === 'No'}
                        onChange={() => { set('budgetAvailability','No'); set('budgetCode',''); }} /><span>No</span>
                    </label>
                  </div>
                  {errors.budgetAvailability && <div className="cdp-error">{errors.budgetAvailability}</div>}
                </div>

                {form.budgetAvailability === 'Yes' && (
                  <div className={`cdp-field-group${errors.budgetCode ? ' has-error' : ''}`}>
                    <label className="cdp-label">Budget Code <span className="cdp-req">*</span></label>
                    <input className="cdp-input" placeholder="e.g. DEWA-IT-2025-BDG-042"
                      value={form.budgetCode} onChange={(e) => set('budgetCode', e.target.value)} />
                    {errors.budgetCode && <div className="cdp-error">{errors.budgetCode}</div>}
                  </div>
                )}

                <div className={`cdp-field-group cdp-span-2${errors.commentsKeyPoints ? ' has-error' : ''}`}>
                  <label className="cdp-label">Comments / Key Points <span className="cdp-req">*</span></label>
                  <textarea className="cdp-textarea" rows={4}
                    placeholder="Any additional comments, assumptions, or key points for the reviewer…"
                    value={form.commentsKeyPoints} onChange={(e) => set('commentsKeyPoints', e.target.value)} />
                  {errors.commentsKeyPoints && <div className="cdp-error">{errors.commentsKeyPoints}</div>}
                </div>

                <div className="cdp-field-group cdp-span-2">
                  <label className="cdp-label">Attachments</label>
                  <div className="cdp-attachment-area">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"
                      style={{ color: 'var(--ez-text-muted)' }}>
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                    <div className="cdp-attachment-label">Click or drag files here</div>
                    <div className="cdp-attachment-sub">PDF, Word, Excel — max 10MB each</div>
                  </div>
                </div>
              </div>

              <div className="cdp-section-footer">
                <button className="cdp-btn-cancel" onClick={() => setActiveSection('basic')} type="button">← Back</button>
                <button className="cdp-btn-save"   onClick={handleSave}   type="button">Save as Draft</button>
                <button className={`cdp-btn-submit${submitting ? ' loading' : ''}`}
                  onClick={handleSubmit} type="button" disabled={submitting}>
                  {submitting ? <span className="login-spinner" /> : 'Submit for Review →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Assistant Panel ─── */}
        <div className="cdp-assistant-col">

          {/* ── Demand Assistant ── */}
          <div className="da-panel">
            <div className="da-panel-hdr">
              <div className="da-panel-hdr-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              Demand Assistant
            </div>

            {/* Form Completion Ring */}
            <div className="da-completion-row">
              <CircleProgress pct={completionPct} />
              <div>
                <div className="da-comp-title">Form Completion</div>
                <div className="da-comp-sub">{completionTip}</div>
              </div>
            </div>

            {/* Contextual tip */}
            {completionPct > 0 && completionPct < 100 && (
              <div className="da-tip">
                <strong>💡 Tip:</strong>{' '}
                {!form.challengesGaps
                  ? "Adding 'Challenges / Gaps' helps AI suggest better solutions."
                  : !form.systemType
                  ? 'Specify System Type so AI can suggest the right module.'
                  : 'Fill remaining fields or run AI Analysis to auto-suggest content.'}
              </div>
            )}

            {/* Missing fields pills */}
            {missingFields.length > 0 && (
              <>
                <div className="da-missing-lbl">MISSING FIELDS</div>
                <div className="da-pills">
                  {missingFields.slice(0, 4).map((f) => <span key={f} className="da-pill">{f}</span>)}
                  {missingFields.length > 4 && (
                    <span className="da-pill-more">+{missingFields.length - 4} more</span>
                  )}
                </div>
              </>
            )}
            {missingFields.length === 0 && (
              <div className="da-all-done">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                All fields completed — ready to submit!
              </div>
            )}

            {/* AI Analysis card */}
            <div className="da-ai-card">
              <div className="da-ai-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="26" height="26">
                  <path d="M12 2l1.09 3.26L16 6.5l-2.91.24L12 10l-1.09-3.26L8 5.5l2.91-.24L12 2z"/>
                  <path d="M5 12.5l.65 1.96L7.5 15l-1.85.54L5 17.5l-.65-1.96L2.5 15l1.85-.54L5 12.5z"/>
                  <path d="M19 4l.5 1.5L21 6l-1.5.5L19 8l-.5-1.5L17 6l1.5-.5L19 4z"/>
                </svg>
              </div>
              <div className="da-ai-title">
                {aiSuggestCount > 0 ? 'AI Analysis Complete' : 'Unlock AI Insights'}
              </div>
              <div className="da-ai-desc">
                {aiSuggestCount > 0
                  ? `${Object.keys(suggestions).length} suggestion${Object.keys(suggestions).length !== 1 ? 's' : ''} ready — see fields below to apply.`
                  : canRunAI
                  ? 'AI will suggest: System Type, Module, Business Rules, Requirements & more.'
                  : 'Fill in Demand Title and Current State to get intelligent suggestions.'}
              </div>
              <button className={`da-ai-btn${aiLoading ? ' loading' : ''}`}
                onClick={handleRunAI} disabled={aiLoading || !canRunAI} type="button">
                {aiLoading ? (
                  <>
                    <span className="login-spinner" style={{ width:13, height:13, borderWidth:2 }} />
                    Analysing demand…
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M12 2l1.09 3.26L16 6.5l-2.91.24L12 10l-1.09-3.26L8 5.5l2.91-.24L12 2z"/>
                    </svg>
                    {aiSuggestCount > 0 ? 'Re-run AI Analysis' : 'Run AI Analysis'}
                  </>
                )}
              </button>
              {aiInputError && <div className="da-ai-warn">⚠ {aiInputError}</div>}
              {aiSuggestCount > 0 && !aiLoading && (
                <div className="da-ai-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {Object.keys(suggestions).length > 0
                    ? `${Object.keys(suggestions).length} suggestion${Object.keys(suggestions).length !== 1 ? 's' : ''} pending — click "Apply Suggestion" on each field.`
                    : 'All suggestions applied!'}
                </div>
              )}
              {aiNewProjWarn && (
                <div className="da-new-project-warn">
                  <strong>⚠ New Project Detected</strong><br />
                  This demand appears to describe a brand-new system. Consider raising it as a <strong>New Initiative</strong> demand type instead.
                </div>
              )}
            </div>
          </div>

          {/* ── BRD Generator ── */}
          <div className="da-panel">
            <div className="da-panel-hdr">
              <div className="da-panel-hdr-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              BRD Generator
            </div>
            <div className="da-brd-desc">
              Ready to finalize? Review your details and generate the official PDF document.
            </div>
            <div className="da-brd-btns">
              <button className="da-btn-preview" type="button" onClick={() => setBrdPreview(true)}>
                Preview
              </button>
              <button className="da-btn-generate" type="button" onClick={() => openPrintWindow(form, currentUser.name)}>
                Generate PDF
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* BRD Preview Modal */}
      {brdPreview && (
        <BRDModal
          form={form}
          author={currentUser.name}
          onClose={() => setBrdPreview(false)}
          onPDF={() => openPrintWindow(form, currentUser.name)}
        />
      )}

      {/* ── Mobile sticky action bar ── */}
      <div className="cdp-mobile-actions">
        <button className="cdp-btn-save" onClick={handleSave} type="button">Save as Draft</button>
        <button className={`cdp-btn-submit${submitting ? ' loading' : ''}`}
          onClick={handleSubmit} type="button" disabled={submitting}>
          {submitting ? <span className="login-spinner" /> : 'Submit →'}
        </button>
      </div>
    </div>
  );
}
