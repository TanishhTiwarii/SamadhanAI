import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  Tag,
  StickyNote,
  Send,
  Layers,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useComplaint, useCluster, useStoreActions } from '../../hooks/useStore';
import {
  StatusBadge,
  PriorityBadge,
  RefundStatusBadge,
} from '../shared/AdminBadges';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../types';
import type { ComplaintStatus } from '../../types';

export function AdminComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const complaint = useComplaint(id || '');
  const cluster = useCluster(complaint?.clusterId || '');
  const { updateStatus, addNote } = useStoreActions();

  const [newStatus, setNewStatus] = useState<ComplaintStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');

  if (!complaint) {
    return (
      <div style={styles.notFound}>
        <h3>Complaint Record Not Found</h3>
        <p>The ticket ID may be invalid or archived.</p>
        <button style={styles.backBtn} onClick={() => navigate('/admin/inbox')}>
          <ArrowLeft size={15} /> Back to Inbox
        </button>
      </div>
    );
  }

  const isOverdue =
    !['resolved', 'closed'].includes(complaint.status) &&
    new Date(complaint.dueDate).getTime() < new Date().getTime();

  const handleStatusChange = () => {
    if (!newStatus) return;
    updateStatus(complaint.id, newStatus, statusNote.trim() || undefined, 'Admin');
    setNewStatus('');
    setStatusNote('');
  };

  const handleAddNote = () => {
    if (!noteTitle.trim() || !noteDesc.trim()) return;
    addNote(complaint.id, noteTitle.trim(), noteDesc.trim(), 'Admin');
    setNoteTitle('');
    setNoteDesc('');
  };

  return (
    <div style={styles.container}>
      {/* NAVIGATION */}
      <div style={styles.topNav}>
        <button style={styles.backBtn} onClick={() => navigate('/admin/inbox')}>
          <ArrowLeft size={15} /> Back to Complaint Inbox
        </button>
        {cluster && (
          <button
            style={styles.parentClusterBtn}
            onClick={() => navigate(`/admin/clusters/${cluster.id}`)}
          >
            <Layers size={13} color="#059669" />
            <span>Parent Cluster: {cluster.title}</span>
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      {/* HEADER CARD */}
      <div style={styles.card}>
        <div style={styles.cardTopRow}>
          <div>
            <div style={styles.refRow}>
              <span style={styles.refCode}>{complaint.referenceId}</span>
              <StatusBadge status={complaint.status} size="md" />
              <PriorityBadge priority={complaint.priority} size="md" />
              {isOverdue && <span style={styles.overdueBadge}>OVERDUE SLA</span>}
            </div>
            <h2 style={styles.subject}>{complaint.subject}</h2>
          </div>

          <div style={styles.retailerBox}>
            <span style={styles.retailerLabel}>MERCHANT / RETAILER</span>
            <span style={styles.retailerValue}>{complaint.retailer}</span>
          </div>
        </div>

        {/* METRICS ROW */}
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <User size={15} color="#6B7280" />
            <div>
              <div style={styles.infoLabel}>CUSTOMER</div>
              <div style={styles.infoVal}>{complaint.customerName}</div>
              <div style={styles.infoSub}>{complaint.customerEmail}</div>
            </div>
          </div>

          <div style={styles.infoItem}>
            <Tag size={15} color="#6B7280" />
            <div>
              <div style={styles.infoLabel}>CATEGORY / SUBCATEGORY</div>
              <div style={styles.infoVal}>{CATEGORY_LABELS[complaint.category]}</div>
              <div style={styles.infoSub}>{complaint.subcategory}</div>
            </div>
          </div>

          <div style={styles.infoItem}>
            <Clock size={15} color="#6B7280" />
            <div>
              <div style={styles.infoLabel}>ORDER REFERENCE</div>
              <div style={{ ...styles.infoVal, fontFamily: 'monospace' }}>{complaint.orderId}</div>
              <div style={styles.infoSub}>
                Filed {new Date(complaint.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={styles.infoItem}>
            <ShieldCheck size={15} color="#059669" />
            <div>
              <div style={styles.infoLabel}>REFUND RECONCILIATION</div>
              <div><RefundStatusBadge status={complaint.refundStatus} /></div>
              {complaint.refundTransactionId && (
                <div style={styles.refundTxn}>{complaint.refundTransactionId}</div>
              )}
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div style={styles.descSection}>
          <h4 style={styles.sectionLabel}>Customer Statement</h4>
          <p style={styles.descText}>{complaint.description}</p>
        </div>

        {/* RESOLUTION (IF RESOLVED) */}
        {complaint.resolution && (
          <div style={styles.resolutionBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <CheckCircle2 size={16} color="#059669" />
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#059669' }}>
                Resolution Outcome
              </h4>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#E2E8F0', lineHeight: 1.4 }}>
              {complaint.resolution}
            </p>
          </div>
        )}
      </div>

      {/* 2-COL: ACTION & TIMELINE */}
      <div style={styles.layoutCols}>
        {/* LEFT: ACTIONS */}
        <div style={styles.leftCol}>
          {/* UPDATE STATUS */}
          <div style={styles.card}>
            <h4 style={styles.sectionTitle}>
              <Send size={15} color="#3B82F6" /> Update Ticket Status
            </h4>
            <div style={styles.formCol}>
              <select
                style={styles.select}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
              >
                <option value="">Select Target Status...</option>
                {Object.entries(STATUS_LABELS)
                  .filter(([k]) => k !== complaint.status)
                  .map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
              </select>
              <textarea
                style={styles.textarea}
                rows={2}
                placeholder="Resolution note or status update rationale..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
              <button
                style={styles.primaryBtn}
                disabled={!newStatus}
                onClick={handleStatusChange}
              >
                Apply Status Transition
              </button>
            </div>
          </div>

          {/* ADD NOTE */}
          <div style={styles.card}>
            <h4 style={styles.sectionTitle}>
              <StickyNote size={15} color="#F59E0B" /> Add Investigation Note
            </h4>
            <div style={styles.formCol}>
              <input
                style={styles.input}
                placeholder="Note Title (e.g. Courier call transcript)"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <textarea
                style={styles.textarea}
                rows={3}
                placeholder="Details of customer contact, merchant escalation..."
                value={noteDesc}
                onChange={(e) => setNoteDesc(e.target.value)}
              />
              <button
                style={styles.primaryBtn}
                disabled={!noteTitle.trim() || !noteDesc.trim()}
                onClick={handleAddNote}
              >
                Record Note to History
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: TIMELINE */}
        <div style={styles.rightCol}>
          <div style={styles.card}>
            <h4 style={styles.sectionTitle}>
              <Clock size={15} color="#8B5CF6" /> Ticket Audit Timeline
            </h4>
            <div style={styles.timelineList}>
              {complaint.timeline.map((event) => (
                <div key={event.id} style={styles.timelineItem}>
                  <div style={styles.timelineDot} />
                  <div style={{ flex: 1 }}>
                    <div style={styles.timelineTop}>
                      <span style={styles.timelineTitle}>{event.title}</span>
                      <span style={styles.timelineTime}>
                        {new Date(event.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p style={styles.timelineDesc}>{event.description}</p>
                    <span style={styles.timelineActor}>by {event.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxWidth: 1200,
    margin: '0 auto',
  },
  topNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'transparent',
    border: 'none',
    color: '#6B7280',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  parentClusterBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '6px 12px',
    color: '#111827',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '20px',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  refRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap' as const,
  },
  refCode: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 14,
    fontWeight: 800,
    color: '#059669',
  },
  overdueBadge: {
    fontSize: 10,
    fontWeight: 800,
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #991B1B',
    padding: '2px 6px',
    borderRadius: 3,
  },
  subject: {
    fontSize: 20,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  retailerBox: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '8px 14px',
    textAlign: 'right' as const,
  },
  retailerLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.04em',
    display: 'block',
  },
  retailerValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#38BDF8',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    padding: '16px 0',
    borderTop: '1px solid #E5E7EB',
    borderBottom: '1px solid #E5E7EB',
  },
  infoItem: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.04em',
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
  },
  infoSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  refundTxn: {
    fontSize: 10,
    fontFamily: 'ui-monospace, monospace',
    color: '#059669',
    marginTop: 4,
  },
  descSection: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    margin: '0 0 6px',
  },
  descText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 1.5,
    margin: 0,
    backgroundColor: '#FAFBFC',
    padding: '12px 14px',
    borderRadius: 6,
    border: '1px solid #E5E7EB',
  },
  resolutionBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid #059669',
    borderRadius: 6,
    padding: '12px 14px',
    marginTop: 14,
  },
  layoutCols: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  formCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  select: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    color: '#111827',
    fontSize: 12,
    padding: '8px 10px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  textarea: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    color: '#111827',
    fontSize: 12,
    padding: '8px 10px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical' as const,
  },
  input: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    color: '#111827',
    fontSize: 12,
    padding: '8px 10px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  primaryBtn: {
    backgroundColor: '#059669',
    border: 'none',
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 600,
    padding: '8px 14px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  timelineItem: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#8B5CF6',
    marginTop: 5,
    flexShrink: 0,
  },
  timelineTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
  },
  timelineTime: {
    fontSize: 10,
    color: '#6B7280',
  },
  timelineDesc: {
    fontSize: 11,
    color: '#6B7280',
    margin: 0,
    lineHeight: 1.4,
  },
  timelineActor: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    display: 'block',
  },
  notFound: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: 40,
    textAlign: 'center' as const,
  },
};
