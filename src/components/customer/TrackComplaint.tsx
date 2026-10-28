import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Package, Clock } from 'lucide-react';
import { useStoreActions, useComplaints } from '../../hooks/useStore';
import { StatusBadge, PriorityBadge } from '../shared/StatusBadge';
import { Timeline } from '../shared/Timeline';
import { CATEGORY_LABELS } from '../../types';
import { format } from 'date-fns';
import type { Complaint } from '../../types';

export function TrackComplaint() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getComplaintByRef } = useStoreActions();
  const allComplaints = useComplaints();
  const [refInput, setRefInput] = useState(searchParams.get('ref') || '');
  const [complaint, setComplaint] = useState<Complaint | null>(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      return getComplaintByRef(ref) ?? null;
    }
    return null;
  });
  const [searched, setSearched] = useState(!!searchParams.get('ref'));

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setRefInput(ref);
      setComplaint(getComplaintByRef(ref) ?? null);
      setSearched(true);
    }
  }, [searchParams, getComplaintByRef]);

  useEffect(() => {
    if (!searched || !refInput.trim()) return;
    const current = allComplaints.find((item) => item.referenceId.toLowerCase() === refInput.trim().toLowerCase());
    if (current) setComplaint(current);
  }, [allComplaints, searched, refInput]);

  function handleSearch(ev: React.FormEvent) {
    ev.preventDefault();
    const result = getComplaintByRef(refInput.trim());
    setComplaint(result ?? null);
    setSearched(true);
  }

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={styles.card}>
        <h2 style={styles.title}>Track Your Complaint</h2>
        <p style={styles.subtitle}>
          Enter your complaint reference number to view the current status and timeline.
        </p>
        <form onSubmit={handleSearch} style={styles.searchRow}>
          <div style={styles.searchWrap}>
            <Search size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input
              style={styles.searchInput}
              placeholder="Enter reference number (e.g. SAM-2024-A1B2)"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
            />
          </div>
          <button type="submit" style={styles.searchBtn}>
            Search
          </button>
        </form>
      </div>

      {searched && !complaint && (
        <div style={styles.emptyCard}>
          <Package size={40} color="#D1D5DB" />
          <p style={styles.emptyTitle}>No complaint found</p>
          <p style={styles.emptyText}>
            Please check your reference number and try again. Reference numbers start with "SAM-".
          </p>
        </div>
      )}

      {complaint && (
        <div style={styles.detailCard}>
          <div style={styles.detailHeader}>
            <div>
              <div style={styles.refRow}>
                <span style={styles.refId}>{complaint.referenceId}</span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
              <h3 style={styles.detailTitle}>{complaint.subject}</h3>
            </div>
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Merchant / Retailer</span>
              <span style={{ ...styles.infoValue, color: '#059669', fontWeight: 600 }}>{complaint.retailer}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Category</span>
              <span style={styles.infoValue}>{CATEGORY_LABELS[complaint.category]} ({complaint.subcategory})</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Order ID</span>
              <span style={styles.infoValue}>{complaint.orderId}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Filed On</span>
              <span style={styles.infoValue}>{format(new Date(complaint.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>

          <div style={styles.descSection}>
            <h4 style={styles.sectionLabel}>Description</h4>
            <p style={styles.descText}>{complaint.description}</p>
          </div>

          {complaint.resolution && (
            <div style={styles.resolutionBox}>
              <h4 style={styles.sectionLabel}>Resolution</h4>
              <p style={styles.descText}>{complaint.resolution}</p>
            </div>
          )}

          {complaint.updatedAt && complaint.updatedAt !== complaint.createdAt && (
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 8, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#065F46', fontSize: 13 }}>
              <strong>Latest update:</strong> Your complaint is currently <strong>{complaint.status.replace(/_/g, ' ')}</strong>. Last updated {format(new Date(complaint.updatedAt), 'MMM d, yyyy · h:mm a')}.
            </div>
          )}

          <div style={styles.timelineSection}>
            <h4 style={styles.sectionLabel}>
              <Clock size={16} /> Activity Timeline
            </h4>
            <Timeline events={complaint.timeline} />
          </div>
        </div>
      )}
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
    margin: '0 0 20px',
  },
  searchRow: {
    display: 'flex',
    gap: 12,
  },
  searchWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 12px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    background: '#fff',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '10px 0',
    fontSize: 14,
    color: '#111827',
    fontFamily: 'inherit',
  },
  searchBtn: {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    background: '#059669',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  emptyCard: {
    textAlign: 'center' as const,
    padding: '48px 32px',
    marginTop: 20,
    background: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#374151',
    margin: '12px 0 4px',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    margin: 0,
  },
  detailCard: {
    background: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: 28,
    marginTop: 20,
  },
  detailHeader: {
    marginBottom: 20,
  },
  refRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    flexWrap: 'wrap' as const,
  },
  refId: {
    fontSize: 13,
    fontWeight: 600,
    color: '#059669',
    fontFamily: 'ui-monospace, monospace',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 16,
    padding: '16px 0',
    borderTop: '1px solid #F3F4F6',
    borderBottom: '1px solid #F3F4F6',
    marginBottom: 20,
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#9CA3AF',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
  },
  descSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 8px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  descText: {
    fontSize: 14,
    color: '#6B7280',
    margin: 0,
    lineHeight: '1.6',
  },
  resolutionBox: {
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  timelineSection: {
    paddingTop: 16,
    borderTop: '1px solid #F3F4F6',
  },
};
