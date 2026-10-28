import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Zap,
  CheckCircle2,
  XCircle,
  Send,
  ExternalLink,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { useClusters, useComplaints, useStoreActions } from '../../../hooks/useStore';
import {
  ClusterStatusBadge,
  SeverityBadge,
  RefundStatusBadge,
  StatusBadge,
} from '../../shared/AdminBadges';
import { CATEGORY_LABELS } from '../../../types';

export function ResolutionCentre() {
  const navigate = useNavigate();
  const clusters = useClusters();
  const complaints = useComplaints();
  const {
    assignClusterOwner,
    proposeClusterAction,
    approveClusterAction,
    rejectClusterAction,
    executeSimulatedRefundBatch,
    addClusterNote,
  } = useStoreActions();

  // Selected cluster for active operations
  const [selectedClusterId, setSelectedClusterId] = useState<string>(
    clusters[0]?.id || ''
  );

  const selectedCluster = useMemo(() => {
    return clusters.find((c) => c.id === selectedClusterId) || clusters[0];
  }, [clusters, selectedClusterId]);

  const memberComplaints = useMemo(() => {
    if (!selectedCluster) return [];
    return complaints.filter(
      (c) => c.clusterId === selectedCluster.id || selectedCluster.complaintIds.includes(c.id)
    );
  }, [selectedCluster, complaints]);

  // Form states
  const [proposalText, setProposalText] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [ownerInput, setOwnerInput] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDetails, setNoteDetails] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [batchFeedback, setBatchFeedback] = useState<{ count: number; batchId: string } | null>(null);

  // Filter clusters in sidebar list
  const filteredClusters = useMemo(() => {
    if (filterState === 'all') return clusters;
    if (filterState === 'pending') {
      return clusters.filter(
        (c) => c.proposedAction?.status === 'pending' || c.status === 'action_proposed'
      );
    }
    if (filterState === 'in_progress') {
      return clusters.filter(
        (c) => c.status === 'investigating' || c.status === 'action_approved' || c.status === 'in_progress'
      );
    }
    return clusters.filter((c) => c.status === 'resolved' || c.status === 'monitoring');
  }, [clusters, filterState]);

  // Refund lifecycle statistics for selected cluster
  const refundBreakdown = useMemo(() => {
    const counts = {
      requested: 0,
      approved: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      unknown: 0,
      none: 0,
    };
    memberComplaints.forEach((c) => {
      if (c.refundStatus === 'refund_requested') counts.requested++;
      else if (c.refundStatus === 'refund_approved') counts.approved++;
      else if (c.refundStatus === 'refund_processing') counts.processing++;
      else if (c.refundStatus === 'refund_confirmed_completed') counts.completed++;
      else if (c.refundStatus === 'refund_failed') counts.failed++;
      else if (c.refundStatus === 'refund_unknown') counts.unknown++;
      else counts.none++;
    });
    return counts;
  }, [memberComplaints]);

  const handlePropose = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCluster && proposalText.trim()) {
      proposeClusterAction(selectedCluster.id, proposalText.trim(), 'Operations Triage Lead');
      setProposalText('');
    }
  };

  const handleApprove = () => {
    if (selectedCluster) {
      approveClusterAction(selectedCluster.id, 'Operations Director');
    }
  };

  const handleReject = () => {
    if (selectedCluster && rejectionReason.trim()) {
      rejectClusterAction(selectedCluster.id, 'Operations Director', rejectionReason.trim());
      setRejectionReason('');
      setShowRejectForm(false);
    }
  };

  const handleRunSimulatedBatch = () => {
    if (!selectedCluster) return;
    const res = executeSimulatedRefundBatch(selectedCluster.id, 'Resolution Center Automation');
    setBatchFeedback({ count: res.updatedCount, batchId: res.batchId });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCluster && noteTitle.trim() && noteDetails.trim()) {
      addClusterNote(selectedCluster.id, noteTitle.trim(), noteDetails.trim(), 'Admin Console');
      setNoteTitle('');
      setNoteDetails('');
    }
  };

  const handleAssignOwner = () => {
    if (selectedCluster && ownerInput.trim()) {
      assignClusterOwner(selectedCluster.id, ownerInput.trim(), 'Merchant Resolutions', 'Admin');
      setOwnerInput('');
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={styles.titleRow}>
          <div style={styles.iconBox}>
            <CheckSquare size={20} color="#059669" />
          </div>
          <div>
            <h1 style={styles.title}>Incident Resolution Centre</h1>
            <p style={styles.subtitle}>
              Action authorization workbench, simulated settlement reconciliation, and merchant remediation
            </p>
          </div>
        </div>

        <div style={styles.filterPills}>
          {(['all', 'pending', 'in_progress', 'resolved'] as const).map((s) => (
            <button
              key={s}
              style={{
                ...styles.pillBtn,
                backgroundColor: filterState === s ? '#E5E7EB' : 'transparent',
                color: filterState === s ? '#059669' : '#6B7280',
                borderColor: filterState === s ? '#059669' : 'transparent',
              }}
              onClick={() => setFilterState(s)}
            >
              {s === 'all'
                ? 'All Incidents'
                : s === 'pending'
                ? 'Pending Approval'
                : s === 'in_progress'
                ? 'In Flight'
                : 'Resolved'}
            </button>
          ))}
        </div>
      </div>

      {/* WORKSPACE: LEFT QUEUE + RIGHT ACTIVE WORKBENCH */}
      <div style={styles.workspace}>
        {/* LEFT COLUMN: CLUSTERS QUEUE */}
        <div style={styles.queueCol}>
          <div style={styles.queueHeader}>
            <span style={styles.queueTitle}>INCIDENT QUEUE</span>
            <span style={styles.queueCount}>{filteredClusters.length} items</span>
          </div>

          <div style={styles.queueList}>
            {filteredClusters.map((cluster) => {
              const active = cluster.id === selectedCluster?.id;
              const hasPendingAction = cluster.proposedAction?.status === 'pending';

              return (
                <div
                  key={cluster.id}
                  style={{
                    ...styles.queueItem,
                    backgroundColor: active ? '#E5E7EB' : '#FFFFFF',
                    borderColor: active ? '#059669' : '#E5E7EB',
                  }}
                  onClick={() => {
                    setSelectedClusterId(cluster.id);
                    setBatchFeedback(null);
                  }}
                >
                  <div style={styles.queueItemTop}>
                    <span style={styles.queueRetailer}>{cluster.retailer}</span>
                    <SeverityBadge severity={cluster.severity} />
                  </div>
                  <div style={styles.queueItemTitle}>{cluster.title}</div>
                  <div style={styles.queueItemMeta}>
                    <span style={{ color: '#FBBF24', fontWeight: 700 }}>
                      {cluster.affectedCount} tickets
                    </span>
                    <span>•</span>
                    <ClusterStatusBadge status={cluster.status} />
                  </div>
                  {hasPendingAction && (
                    <div style={styles.pendingActionFlag}>
                      <Zap size={11} color="#F59E0B" />
                      <span>Action Approval Required</span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredClusters.length === 0 && (
              <div style={styles.queueEmpty}>No clusters match the selected queue filter.</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE RESOLUTION WORKBENCH */}
        {selectedCluster ? (
          <div style={styles.workbenchCol}>
            {/* HERO BAR */}
            <div style={styles.card}>
              <div style={styles.heroTop}>
                <div>
                  <div style={styles.heroMetaRow}>
                    <span style={{ color: '#38BDF8', fontWeight: 600 }}>{selectedCluster.retailer}</span>
                    <span style={{ color: '#475569' }}>•</span>
                    <span style={{ color: '#6B7280' }}>{CATEGORY_LABELS[selectedCluster.category]}</span>
                    <span style={{ color: '#475569' }}>•</span>
                    <span style={{ color: '#111827' }}>{selectedCluster.subcategory}</span>
                  </div>
                  <h2 style={styles.workbenchTitle}>{selectedCluster.title}</h2>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    style={styles.inspectClusterBtn}
                    onClick={() => navigate(`/admin/clusters/${selectedCluster.id}`)}
                  >
                    <span>Full Investigation View</span>
                    <ExternalLink size={13} />
                  </button>
                  <ClusterStatusBadge status={selectedCluster.status} size="md" />
                </div>
              </div>

              {/* ACTION / PROPOSAL STATUS BAR */}
              <div style={styles.actionWorkflowBar}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                    PROPOSED RESOLUTION PLAN
                  </div>
                  <div style={{ fontSize: 13, color: '#111827', marginTop: 4, lineHeight: 1.4 }}>
                    {selectedCluster.proposedAction
                      ? selectedCluster.proposedAction.actionText
                      : 'No formal resolution proposal has been recorded yet.'}
                  </div>
                  {selectedCluster.proposedAction && (
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                      Proposed by {selectedCluster.proposedAction.proposedBy} • Status:{' '}
                      <strong style={{ color: '#FCD34D' }}>{selectedCluster.proposedAction.status.toUpperCase()}</strong>
                    </div>
                  )}
                </div>

                {selectedCluster.proposedAction?.status === 'pending' && (
                  <div style={styles.approvalButtons}>
                    <button style={styles.approveBtn} onClick={handleApprove}>
                      <CheckCircle2 size={15} /> Approve Action
                    </button>
                    <button
                      style={styles.rejectBtn}
                      onClick={() => setShowRejectForm(!showRejectForm)}
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                )}
              </div>

              {showRejectForm && (
                <div style={styles.rejectionBox}>
                  <label style={styles.fieldLabel}>Rejection Reason / Required Revisions</label>
                  <input
                    style={styles.inputField}
                    placeholder="Describe why this action is rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <button style={styles.dangerBtn} onClick={handleReject}>
                    Submit Rejection
                  </button>
                </div>
              )}
            </div>

            {/* BATCH RUN FEEDBACK */}
            {batchFeedback && (
              <div style={styles.feedbackBanner}>
                <CheckCircle2 size={18} color="#059669" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#059669', fontSize: 13 }}>
                    Simulated Refund Batch Execution Confirmed
                  </div>
                  <div style={{ fontSize: 12, color: '#CBD5E1' }}>
                    Reconciled {batchFeedback.count} orders. Batch ID: <code>{batchFeedback.batchId}</code>. Member ticket
                    statuses updated to Resolved.
                  </div>
                </div>
                <button style={styles.dismissBtn} onClick={() => setBatchFeedback(null)}>
                  ✕
                </button>
              </div>
            )}

            {/* REFUND LIFECYCLE BREAKDOWN (CRITICAL FOR HONESTY REQUIREMENT) */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} color="#059669" />
                  <h3 style={styles.cardTitle}>Refund Lifecycle & Settlement Status</h3>
                </div>
                <span style={styles.honestIndicator}>
                  Honest State Tracking • Simulated Logs
                </span>
              </div>

              <div style={styles.lifecycleGrid}>
                <div style={styles.lifecycleStep}>
                  <span style={styles.lifecycleLabel}>REFUND REQUESTED</span>
                  <span style={styles.lifecycleCount}>{refundBreakdown.requested}</span>
                  <span style={styles.lifecycleSub}>Pending verification</span>
                </div>
                <div style={styles.lifecycleStep}>
                  <span style={styles.lifecycleLabel}>REFUND APPROVED</span>
                  <span style={styles.lifecycleCount}>{refundBreakdown.approved}</span>
                  <span style={styles.lifecycleSub}>Authorized for payout</span>
                </div>
                <div style={styles.lifecycleStep}>
                  <span style={styles.lifecycleLabel}>PROCESSING</span>
                  <span style={styles.lifecycleCount}>{refundBreakdown.processing}</span>
                  <span style={styles.lifecycleSub}>In gateway queue</span>
                </div>
                <div style={{ ...styles.lifecycleStep, borderColor: '#059669' }}>
                  <span style={{ ...styles.lifecycleLabel, color: '#34D399' }}>CONFIRMED (VERIFIED)</span>
                  <span style={{ ...styles.lifecycleCount, color: '#059669' }}>{refundBreakdown.completed}</span>
                  <span style={styles.lifecycleSub}>Simulated completion</span>
                </div>
                <div style={styles.lifecycleStep}>
                  <span style={styles.lifecycleLabel}>FAILED / UNVERIFIED</span>
                  <span style={{ ...styles.lifecycleCount, color: '#EF4444' }}>
                    {refundBreakdown.failed + refundBreakdown.unknown}
                  </span>
                  <span style={styles.lifecycleSub}>Reconciliation flagged</span>
                </div>
              </div>

              {/* AUTOMATION TRIGGER */}
              <div style={styles.reconcileActionBox}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>
                    Execute Batch Settlement Verification (Simulated)
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                    Processes simulated bank reverse entries for all {refundBreakdown.requested + refundBreakdown.processing} unfulfilled
                    orders in this cluster.
                  </div>
                </div>
                <button
                  style={styles.batchRunBtn}
                  onClick={handleRunSimulatedBatch}
                  disabled={selectedCluster.status === 'resolved'}
                >
                  <RotateCw size={14} /> Run Simulated Batch Settlement
                </button>
              </div>
            </div>

            {/* ACTION FORMS ROW: PROPOSE NEW ACTION & ADD NOTES */}
            <div style={styles.actionFormsRow}>
              {/* PROPOSE ACTION */}
              <div style={styles.halfCard}>
                <h4 style={styles.subCardTitle}>Propose New Remediation Action</h4>
                <form onSubmit={handlePropose} style={styles.formCol}>
                  <textarea
                    style={styles.textarea}
                    rows={3}
                    placeholder="Describe specific operational steps to remediate this cluster..."
                    value={proposalText}
                    onChange={(e) => setProposalText(e.target.value)}
                  />
                  <button
                    type="submit"
                    style={styles.submitBtn}
                    disabled={!proposalText.trim()}
                  >
                    <Send size={13} /> Submit Proposal for Approval
                  </button>
                </form>
              </div>

              {/* QUICK NOTE / ASSIGNMENT */}
              <div style={styles.halfCard}>
                <h4 style={styles.subCardTitle}>Incident Ownership & Notes</h4>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <input
                    style={styles.inputField}
                    placeholder="Reassign Owner (e.g. Rahul Verma)"
                    value={ownerInput}
                    onChange={(e) => setOwnerInput(e.target.value)}
                  />
                  <button style={styles.assignBtn} onClick={handleAssignOwner}>
                    Assign
                  </button>
                </div>

                <form onSubmit={handleAddNote} style={styles.formCol}>
                  <input
                    style={styles.inputField}
                    placeholder="Note Headline..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                  />
                  <textarea
                    style={styles.textarea}
                    rows={2}
                    placeholder="Investigation findings or update..."
                    value={noteDetails}
                    onChange={(e) => setNoteDetails(e.target.value)}
                  />
                  <button
                    type="submit"
                    style={styles.submitBtn}
                    disabled={!noteTitle.trim() || !noteDetails.trim()}
                  >
                    Add Investigation Note
                  </button>
                </form>
              </div>
            </div>

            {/* MEMBER COMPLAINTS LIST PREVIEW */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Affected Tickets Sample ({memberComplaints.length})</h3>
                <span style={{ fontSize: 11, color: '#6B7280' }}>
                  Showing top 6 of {memberComplaints.length} member complaints
                </span>
              </div>

              <div style={styles.sampleList}>
                {memberComplaints.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    style={styles.sampleRow}
                    onClick={() => navigate(`/admin/complaint/${c.id}`)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={styles.refCode}>{c.referenceId}</span>
                        <span style={styles.customerName}>{c.customerName}</span>
                        <span style={styles.orderCode}>{c.orderId}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{c.subject}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <RefundStatusBadge status={c.refundStatus} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyWorkbench}>
            <p>Select a cluster from the incident queue to begin resolution workflow.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxWidth: 1400,
    margin: '0 auto',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#064E3B',
    border: '1px solid #059669',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    margin: '3px 0 0',
  },
  filterPills: {
    display: 'flex',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: 3,
    gap: 2,
  },
  pillBtn: {
    padding: '5px 12px',
    borderRadius: 4,
    border: '1px solid transparent',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  workspace: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: 16,
    alignItems: 'start',
  },
  queueCol: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 160px)',
  },
  queueHeader: {
    padding: '12px 14px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.05em',
  },
  queueCount: {
    fontSize: 11,
    color: '#6B7280',
  },
  queueList: {
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  queueItem: {
    padding: '12px 14px',
    borderBottom: '1px solid #E5E7EB',
    borderLeft: '3px solid transparent',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  queueItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  queueRetailer: {
    fontSize: 11,
    fontWeight: 700,
    color: '#38BDF8',
  },
  queueItemTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 6,
    lineHeight: 1.3,
  },
  queueItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: '#6B7280',
  },
  pendingActionFlag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: 700,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: '2px 6px',
    borderRadius: 3,
  },
  queueEmpty: {
    padding: 24,
    textAlign: 'center' as const,
    color: '#6B7280',
    fontSize: 12,
  },
  workbenchCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '18px 20px',
  },
  heroTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  heroMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    marginBottom: 4,
  },
  workbenchTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  inspectClusterBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E5E7EB',
    border: '1px solid #334155',
    color: '#111827',
    fontSize: 11,
    fontWeight: 600,
    padding: '5px 10px',
    borderRadius: 4,
    cursor: 'pointer',
  },
  actionWorkflowBar: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  approvalButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  approveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#064E3B',
    border: '1px solid #059669',
    borderRadius: 4,
    color: '#34D399',
    fontSize: 12,
    fontWeight: 700,
    padding: '7px 12px',
    cursor: 'pointer',
  },
  rejectBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#380B0F',
    border: '1px solid #991B1B',
    borderRadius: 4,
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: 700,
    padding: '7px 12px',
    cursor: 'pointer',
  },
  rejectionBox: {
    marginTop: 10,
    backgroundColor: '#FAFBFC',
    border: '1px solid #380B0F',
    borderRadius: 6,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  dangerBtn: {
    backgroundColor: '#DC2626',
    border: 'none',
    borderRadius: 4,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 600,
    padding: '6px 12px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  feedbackBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #059669',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  dismissBtn: {
    background: 'transparent',
    border: 'none',
    color: '#6B7280',
    cursor: 'pointer',
    fontSize: 14,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  honestIndicator: {
    fontSize: 11,
    color: '#FCD34D',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    padding: '2px 8px',
    borderRadius: 4,
    fontWeight: 600,
  },
  lifecycleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: 10,
    marginBottom: 14,
  },
  lifecycleStep: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  lifecycleLabel: {
    fontSize: 9,
    fontWeight: 800,
    color: '#6B7280',
    letterSpacing: '0.04em',
  },
  lifecycleCount: {
    fontSize: 18,
    fontWeight: 800,
    color: '#111827',
    lineHeight: 1.2,
  },
  lifecycleSub: {
    fontSize: 10,
    color: '#6B7280',
  },
  reconcileActionBox: {
    backgroundColor: '#FAFBFC',
    border: '1px dashed #059669',
    borderRadius: 6,
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  batchRunBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    border: 'none',
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 14px',
    cursor: 'pointer',
  },
  actionFormsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  halfCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '16px',
  },
  subCardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 10px',
  },
  formCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
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
  inputField: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    color: '#111827',
    fontSize: 12,
    padding: '7px 10px',
    fontFamily: 'inherit',
    outline: 'none',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 600,
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    border: 'none',
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 600,
    padding: '7px 12px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  assignBtn: {
    backgroundColor: '#E5E7EB',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#111827',
    fontSize: 12,
    fontWeight: 600,
    padding: '0 12px',
    cursor: 'pointer',
  },
  sampleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sampleRow: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  refCode: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    fontWeight: 700,
    color: '#059669',
  },
  customerName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
  },
  orderCode: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    color: '#6B7280',
  },
  emptyWorkbench: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: 60,
    textAlign: 'center' as const,
    color: '#6B7280',
  },
};
