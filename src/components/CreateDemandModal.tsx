import { useEffect, useState } from 'react';
import type { ToastType } from '../types';

interface CreateDemandModalProps {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string, type?: ToastType) => void;
}

const EMPTY_FORM = {
  name: '',
  type: 'New System (Turnkey)',
  businessUnit: '',
  lead: 'Unassigned',
  goLive: '',
  priority: 'Medium',
  justification: '',
};

export default function CreateDemandModal({ visible, onClose, showToast }: CreateDemandModalProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, onClose]);

  const handleChange = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = () => {
    if (!form.name.trim()) {
      showToast('Please enter a demand name', 'warn');
      return;
    }
    showToast('Demand saved as draft', 'success');
    setForm({ ...EMPTY_FORM });
    onClose();
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      showToast('Please enter a demand name', 'warn');
      return;
    }
    if (!form.businessUnit.trim()) {
      showToast('Please enter a business unit', 'warn');
      return;
    }
    if (!form.justification.trim()) {
      showToast('Please add a business justification', 'warn');
      return;
    }
    showToast('Demand submitted successfully!', 'success');
    setForm({ ...EMPTY_FORM });
    onClose();
  };

  if (!visible) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Head */}
        <div className="modal-head">
          <div className="modal-head-icon" style={{ background: 'linear-gradient(135deg,#0d5c37,#1a7a4e)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div>
            <div className="modal-no">NEW DEMAND</div>
            <div className="modal-title">Create Demand Request</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Demand Name *</label>
              <input
                placeholder="Enter demand name…"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Demand Type *</label>
              <select value={form.type} onChange={(e) => handleChange('type', e.target.value)}>
                <option>New System (Turnkey)</option>
                <option>Enhancement Request</option>
                <option>POC / Feasibility</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Business Unit *</label>
              <input
                placeholder="e.g. Finance, Operations…"
                value={form.businessUnit}
                onChange={(e) => handleChange('businessUnit', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>IT Lead</label>
              <select value={form.lead} onChange={(e) => handleChange('lead', e.target.value)}>
                <option>Unassigned</option>
                <option>Sara Al Hashimi</option>
                <option>Omar Al Falasi</option>
                <option>Fatima Al Zaabi</option>
                <option>Amina Al Dhaheri</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Planned Go Live Date</label>
              <input
                type="date"
                value={form.goLive}
                onChange={(e) => handleChange('goLive', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => handleChange('priority', e.target.value)}>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group form-full">
              <label>Business Justification *</label>
              <textarea
                placeholder="Describe the business need and expected outcomes…"
                value={form.justification}
                onChange={(e) => handleChange('justification', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-foot">
          <button className="mf-btn-s" onClick={onClose}>Cancel</button>
          <button className="mf-btn-s" onClick={handleSaveDraft}>Save as Draft</button>
          <button className="mf-btn-p" onClick={handleSubmit}>Submit Demand →</button>
        </div>
      </div>
    </div>
  );
}
