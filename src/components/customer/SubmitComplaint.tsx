import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useStoreActions } from '../../hooks/useStore';
import { CATEGORY_LABELS, AVAILABLE_RETAILERS } from '../../types';
import type { ComplaintCategory, Complaint } from '../../types';

export function SubmitComplaint() {
  const navigate = useNavigate();
  const { addComplaint } = useStoreActions();
  const [submitted, setSubmitted] = useState<Complaint | null>(null);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    retailer: 'Retailer A',
    category: '' as ComplaintCategory | '',
    subcategory: '',
    orderId: '',
    subject: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = 'Name is required';
    if (!form.customerEmail.trim()) e.customerEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.customerEmail)) e.customerEmail = 'Invalid email';
    if (!form.retailer) e.retailer = 'Select a merchant/retailer';
    if (!form.category) e.category = 'Select a category';
    if (!form.orderId.trim()) e.orderId = 'Order ID is required';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.trim().length < 20) e.description = 'Please provide more detail (min 20 characters)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    const result = addComplaint({
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim(),
      retailer: form.retailer,
      category: form.category as ComplaintCategory,
      subcategory: form.subcategory.trim() || undefined,
      orderId: form.orderId.trim(),
      subject: form.subject.trim(),
      description: form.description.trim(),
    });
    setSubmitted(result);
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>
            <CheckCircle2 size={48} color="#059669" />
          </div>
          <h2 style={styles.successTitle}>Complaint Submitted Successfully</h2>
          <p style={styles.successText}>
            Your complaint has been registered with merchant {submitted.retailer}. Please save your reference number for tracking:
          </p>
          <div style={styles.refBox}>
            <span style={styles.refLabel}>Reference Number</span>
            <span style={styles.refValue}>{submitted.referenceId}</span>
          </div>
          <p style={styles.successNote}>
            You can track the status of your complaint using this reference number at any time.
          </p>
          <div style={styles.successActions}>
            <button style={styles.primaryBtn} onClick={() => navigate(`/track?ref=${submitted.referenceId}`)}>
              Track Complaint
            </button>
            <button
              style={styles.secondaryBtn}
              onClick={() => {
                setSubmitted(null);
                setForm({
                  customerName: '',
                  customerEmail: '',
                  retailer: 'Retailer A',
                  category: '',
                  subcategory: '',
                  orderId: '',
                  subject: '',
                  description: '',
                });
              }}
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={styles.card}>
        <h2 style={styles.title}>Submit a Complaint</h2>
        <p style={styles.subtitle}>
          Please provide details about your issue. We'll triage and coordinate directly with the merchant partner.
        </p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name *</label>
              <input
                style={{ ...styles.input, ...(errors.customerName ? styles.inputError : {}) }}
                placeholder="Enter your full name"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
              {errors.customerName && <span style={styles.error}>{errors.customerName}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email Address *</label>
              <input
                type="email"
                style={{ ...styles.input, ...(errors.customerEmail ? styles.inputError : {}) }}
                placeholder="you@example.com"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              />
              {errors.customerEmail && <span style={styles.error}>{errors.customerEmail}</span>}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Merchant / Retailer *</label>
              <select
                style={{ ...styles.input, ...(errors.retailer ? styles.inputError : {}) }}
                value={form.retailer}
                onChange={(e) => setForm({ ...form, retailer: e.target.value })}
              >
                {AVAILABLE_RETAILERS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.retailer && <span style={styles.error}>{errors.retailer}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Order ID / Receipt # *</label>
              <input
                style={{ ...styles.input, ...(errors.orderId ? styles.inputError : {}) }}
                placeholder="e.g. ORD-RA-8051"
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
              />
              {errors.orderId && <span style={styles.error}>{errors.orderId}</span>}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Issue Category *</label>
              <select
                style={{ ...styles.input, ...(errors.category ? styles.inputError : {}) }}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ComplaintCategory })}
              >
                <option value="">Select category</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              {errors.category && <span style={styles.error}>{errors.category}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Specific Subcategory (Optional)</label>
              <input
                style={styles.input}
                placeholder="e.g. Refund not initiated, Lost package..."
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subject *</label>
            <input
              style={{ ...styles.input, ...(errors.subject ? styles.inputError : {}) }}
              placeholder="Brief summary of your issue"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            {errors.subject && <span style={styles.error}>{errors.subject}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description *</label>
            <textarea
              style={{ ...styles.textarea, ...(errors.description ? styles.inputError : {}) }}
              placeholder="Please describe your issue in detail. Include any relevant order numbers, dates, and what resolution you're looking for."
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {errors.description && <span style={styles.error}>{errors.description}</span>}
          </div>

          <button type="submit" style={styles.submitBtn}>
            <Send size={16} /> Submit Complaint
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '32px 20px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    color: '#6B7280',
    fontSize: 14,
    cursor: 'pointer',
    padding: '4px 0',
    marginBottom: 16,
  },
  card: {
    background: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    margin: '0 0 28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    textAlign: 'left',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    transition: 'border-color 0.15s',
    background: '#fff',
    fontFamily: 'inherit',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 8,
    border: 'none',
    background: '#059669',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  successCard: {
    background: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: '48px 32px',
    textAlign: 'center' as const,
    maxWidth: 500,
    margin: '40px auto',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 8px',
  },
  successText: {
    fontSize: 14,
    color: '#6B7280',
    margin: '0 0 20px',
  },
  refBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 16,
  },
  refLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#059669',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  refValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#065F46',
    fontFamily: 'ui-monospace, monospace',
  },
  successNote: {
    fontSize: 13,
    color: '#9CA3AF',
    margin: '0 0 24px',
  },
  successActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  primaryBtn: {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    background: '#059669',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 20px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    background: '#fff',
    color: '#374151',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
