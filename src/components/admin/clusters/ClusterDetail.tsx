import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  ExternalLink,
  PlusCircle,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useCluster, useComplaints, useStoreActions } from '../../../hooks/useStore';
import {
  SeverityBadge,
  ClusterStatusBadge,
  RootCauseBadge,
  StatusBadge,
  RefundStatusBadge,
  PromiseOutcomeBadge,
} from '../../shared/AdminBadges';
import { CATEGORY_LABELS } from '../../../types';
import type { ClusterStatus, RootCauseStatus } from '../../../types';

export function ClusterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cluster = useCluster(id || '');
  const allComplaints = useComplaints();
  const {
    updateClusterStatus,
    assignClusterOwner,
    updateClusterRootCause,
    addClusterNote,
    proposeClusterAction,
    approveClusterAction,
    rejectClusterAction,
    executeSimulatedRefundBatch,
    runPromiseVerification,
  } = useStoreActions();

  // State for interactive actions
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const pageSize = 10;

  const [noteTitle, setNoteTitle] = useState('');
  const [noteDetails, setNoteDetails] = useState('');
  const [proposedText, setProposedText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const [newOwner, setNewOwner] = useState(cluster?.assignedTo || '');
  const [newTeam, setNewTeam] = useState(cluster?.assignedTeam || '');
  const [editingOwner, setEditingOwner] = useState(false);

  const [editingRootCause, setEditingRootCause] = useState(false);
  const [rootCauseStatus, setRootCauseStatus] = useState<RootCauseStatus>(cluster?.rootCauseStatus || 'suspected');
  const [rootCauseText, setRootCauseText] = useState(cluster?.rootCauseDetails || '');

  const [batchRunFeedback, setBatchRunFeedback] = useState<{ count: number; batchId: string } | null>(null);

  // Retrieve member complaints
  const memberComplaints = useMemo(() => {
    if (!cluster) return [];
    return allComplaints.filter((c) => c.clusterId === cluster.id || cluster.complaintIds.includes(c.id));
  }, [cluster, allComplaints]);

  // Filter member complaints inside cluster
  const filteredMembers = useMemo(() => {
    let list = memberComplaints;
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.referenceId.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.orderId.toLowerCase().includes(q) ||
          c.customerEmail.toLowerCase().includes(q)
      );
    }
    return list;
  }, [memberComplaints, memberSearch]);

  const paginatedMembers = useMemo(() => {
    const start = (memberPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, memberPage]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;

  if (!cluster) {
    return (
      <div style={styles.notFoundCard}>
        <h2>Incident Cluster Not Found</h2>
        <p>The requested cluster does not exist or may have been merged.</p>
        <button style={styles.backBtn} onClick={() => navigate('/admin/clusters')}>
          <ArrowLeft size={16} /> Return to Cluster Directory
        </button>
      </div>
    );
  }

  const isBillingRefund = cluster.category === 'billing' || cluster.category === 'refund';

  const handleSaveRootCause = () => {
    updateClusterRootCause(cluster.id, rootCauseStatus, rootCauseText, 'Anita Desai (Admin)');
    setEditingRootCause(false);
  };

  const handleSaveOwner = () => {
    if (newOwner.trim()) {
      assignClusterOwner(cluster.id, newOwner.trim(), newTeam.trim() || 'Retailer Escalations', 'Anita Desai');
      setEditingOwner(false);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteTitle.trim() && noteDetails.trim()) {
      addClusterNote(cluster.id, noteTitle.trim(), noteDetails.trim(), 'Anita Desai (Admin)');
      setNoteTitle('');
      setNoteDetails('');
    }
  };

  const handleProposeAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (proposedText.trim()) {
      proposeClusterAction(cluster.id, proposedText.trim(), 'Anita Desai (Admin)');
      setProposedText('');
    }
  };

  const handleApproveAction = () => {
    approveClusterAction(cluster.id, 'Priya Sharma (Lead Operations Director)');
  };

  const handleRejectAction = () => {
    if (rejectReason.trim()) {
      rejectClusterAction(cluster.id, 'Priya Sharma (Lead Operations Director)', rejectReason.trim());
      setRejectReason('');
      setShowRejectForm(false);
    }
  };

  const handleExecuteSimulatedRefunds = () => {
    const result = executeSimulatedRefundBatch(cluster.id, 'Settlement Automation Engine');
    setBatchRunFeedback({ count: result.updatedCount, batchId: result.batchId });
  };

  const handleRunPromiseAudit = () => {
    runPromiseVerification(cluster.id, 'SLA Monitor Bot');
  };

  return (
    <div style={styles.container}>
      {/* NAVIGATION & BREADCRUMB */}
      <div style={styles.topNavRow}>
        <button style={styles.backBtn} onClick={() => navigate('/admin/clusters')}>
          <ArrowLeft size={15} /> All Incident Clusters
        </button>
        <span style={styles.breadcrumbDivider}>/</span>
        <span style={styles.breadcrumbActive}>{cluster.title}</span>
      </div>

      {/* CLUSTER HEADER HERO */}
      <div style={styles.heroCard}>
        <div style={styles.heroTop}>
          <div style={styles.heroMetaTags}>
            <span style={styles.retailerPill}>{cluster.retailer}</span>
            <span style={styles.dot}>•</span>
            <span style={styles.catPill}>{CATEGORY_LABELS[cluster.category] || cluster.category}</span>
            <span style={styles.dot}>•</span>
            <span style={styles.subcatPill}>{cluster.subcategory}</span>
          </div>

          <div style={styles.heroBadges}>
            <RootCauseBadge status={cluster.rootCauseStatus} size="md" />
            <SeverityBadge severity={cluster.severity} size="md" />
            <ClusterStatusBadge status={cluster.status} size="md" />
          </div>
        </div>

        <h1 style={styles.heroTitle}>{cluster.title}</h1>

        {/* METRICS ROW */}
        <div style={styles.heroStatsGrid}>
          <div style={styles.heroStatItem}>
            <span style={styles.statLabel}>AFFECTED TICKETS</span>
            <span style={styles.statValHighlight}>{cluster.affectedCount} complaints</span>
            <span style={styles.statSub}>Grouped under 1 incident</span>
          </div>

          <div style={styles.heroStatItem}>
            <span style={styles.statLabel}>AFFECTED CUSTOMERS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={16} color="#38BDF8" />
              <span style={styles.statVal}>{cluster.affectedCustomersCount} individuals</span>
            </div>
            <span style={styles.statSub}>Unique verified accounts</span>
          </div>

          <div style={styles.heroStatItem}>
            <span style={styles.statLabel}>OLDEST COMPLAINT AGE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="#FBBF24" />
              <span style={styles.statVal}>{cluster.oldestAgeDays} days</span>
            </div>
            <span style={styles.statSub}>First reported {new Date(cluster.firstReportedAt).toLocaleDateString()}</span>
          </div>

          <div style={styles.heroStatItem}>
            <span style={styles.statLabel}>PROMISE DEADLINE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PromiseOutcomeBadge outcome={cluster.promiseOutcome} />
            </div>
            <span style={styles.statSub}>
              {cluster.promiseDeadline ? `Target: ${new Date(cluster.promiseDeadline).toLocaleDateString()}` : 'No deadline set'}
            </span>
          </div>

          <div style={styles.heroStatItem}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={styles.statLabel}>RESOLUTION PROGRESS</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{cluster.resolutionProgress}%</span>
            </div>
            <div style={styles.progressBg}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${cluster.resolutionProgress}%`,
                  backgroundColor: cluster.resolutionProgress === 100 ? '#059669' : '#3B82F6',
                }}
              />
            </div>
            <span style={styles.statSub}>
              {memberComplaints.filter((c) => c.status === 'resolved').length} of {memberComplaints.length} tickets resolved
            </span>
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNER (IF BATCH EXECUTED) */}
      {batchRunFeedback && (
        <div style={styles.feedbackBanner}>
          <CheckCircle2 size={20} color="#059669" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#059669' }}>
              Simulated Refund Reconciliation Batch Completed
            </div>
            <div style={{ fontSize: 12, color: '#CBD5E1' }}>
              Successfully processed simulated refund transitions for {batchRunFeedback.count} orders. Batch Reference:{' '}
              <code>{batchRunFeedback.batchId}</code>.
            </div>
          </div>
          <button style={styles.dismissBtn} onClick={() => setBatchRunFeedback(null)}>
            ✕
          </button>
        </div>
      )}

      {/* 2-COLUMN WORKSPACE: LEFT (MEMBERS & DETAILS) / RIGHT (ACTIONS & AUDIT) */}
      <div style={styles.layoutCols}>
        {/* LEFT COLUMN */}
        <div style={styles.leftCol}>
          {/* ROOT CAUSE INVESTIGATION PANEL */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} color="#38BDF8" />
                <h3 style={styles.sectionTitle}>Root Cause Analysis & Telemetry</h3>
              </div>
              <button
                style={styles.actionLinkBtn}
                onClick={() => setEditingRootCause(!editingRootCause)}
              >
                {editingRootCause ? 'Cancel' : 'Edit Analysis'}
              </button>
            </div>

            {editingRootCause ? (
              <div style={styles.editRootCauseForm}>
                <div style={styles.formRow}>
                  <label style={styles.fieldLabel}>Root Cause Verification State</label>
                  <select
                    style={styles.fieldSelect}
                    value={rootCauseStatus}
                    onChange={(e) => setRootCauseStatus(e.target.value as RootCauseStatus)}
                  >
                    <option value="suspected">Root Cause Suspected (Under Investigation)</option>
                    <option value="verified">Root Cause Verified (Root Cause Confirmed)</option>
                    <option value="unidentified">Unidentified (Active Triage)</option>
                  </select>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.fieldLabel}>Investigation Findings & Technical Notes</label>
                  <textarea
                    style={styles.fieldTextarea}
                    rows={4}
                    value={rootCauseText}
                    onChange={(e) => setRootCauseText(e.target.value)}
                    placeholder="Describe verified error logs, API response payloads, or operational failures..."
                  />
                </div>
                <button style={styles.primaryBtn} onClick={handleSaveRootCause}>
                  Update Root Cause Record
                </button>
              </div>
            ) : (
              <div style={styles.rootCauseDisplay}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <RootCauseBadge status={cluster.rootCauseStatus} />
                  <span style={{ fontSize: 12, color: '#6B7280' }}>
                    {cluster.rootCauseStatus === 'verified'
                      ? 'Corroborated by telemetry & merchant systems'
                      : 'Hypothesis logged by triage admin; awaiting merchant verification'}
                  </span>
                </div>
                <p style={styles.rootCauseBody}>
                  {cluster.rootCauseDetails ||
                    'No technical root cause description has been recorded for this cluster yet. Use Edit Analysis to record telemetry findings.'}
                </p>
              </div>
            )}
          </div>

          {/* MEMBER COMPLAINTS TABLE (ALL 50 COMPLAINTS) */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="#059669" />
                  <h3 style={styles.sectionTitle}>Member Complaints ({memberComplaints.length})</h3>
                </div>
                <p style={styles.sectionSubtitle}>
                  All {memberComplaints.length} individual tickets associated with this incident cluster
                </p>
              </div>

              {/* SEARCH INSIDE CLUSTER */}
              <div style={styles.tableSearchBox}>
                <Search size={14} color="#6B7280" />
                <input
                  style={styles.tableSearchInput}
                  placeholder="Filter 50 members by name, order, email..."
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setMemberPage(1);
                  }}
                />
              </div>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Reference</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Refund State</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Reported</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.map((comp) => (
                    <tr key={comp.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.refCode}>{comp.referenceId}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>{comp.customerName}</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>{comp.customerEmail}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.orderCode}>{comp.orderId}</span>
                      </td>
                      <td style={styles.td}>
                        <RefundStatusBadge status={comp.refundStatus} />
                        {comp.refundTransactionId && (
                          <div style={{ fontSize: 10, color: '#059669', fontFamily: 'monospace', marginTop: 2 }}>
                            {comp.refundTransactionId}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <StatusBadge status={comp.status} />
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>
                          {new Date(comp.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.rowInspectBtn}
                          onClick={() => navigate(`/admin/complaint/${comp.id}`)}
                          title="View complaint details"
                        >
                          <ExternalLink size={13} color="#38BDF8" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredMembers.length === 0 && (
                <div style={styles.tableEmpty}>No member complaints match your query.</div>
              )}
            </div>

            {/* PAGINATION FOR 50 TICKETS */}
            <div style={styles.paginationRow}>
              <span style={styles.paginationInfo}>
                Showing {(memberPage - 1) * pageSize + 1} to{' '}
                {Math.min(memberPage * pageSize, filteredMembers.length)} of {filteredMembers.length} complaints
              </span>
              <div style={styles.paginationBtns}>
                <button
                  style={styles.pageBtn}
                  disabled={memberPage === 1}
                  onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={styles.pageIndicator}>
                  Page {memberPage} of {totalPages}
                </span>
                <button
                  style={styles.pageBtn}
                  disabled={memberPage >= totalPages}
                  onClick={() => setMemberPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIONS, OWNER, PROPOSALS & ACTION HISTORY */}
        <div style={styles.rightCol}>
          {/* ASSIGNED OWNER CARD */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={16} color="#A78BFA" />
                <h3 style={styles.sectionTitle}>Incident Ownership</h3>
              </div>
              <button
                style={styles.actionLinkBtn}
                onClick={() => setEditingOwner(!editingOwner)}
              >
                {editingOwner ? 'Cancel' : 'Reassign'}
              </button>
            </div>

            {editingOwner ? (
              <div style={styles.editOwnerForm}>
                <input
                  style={styles.fieldInput}
                  placeholder="Owner Name (e.g. Anita Desai)"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                />
                <input
                  style={styles.fieldInput}
                  placeholder="Team / Department (e.g. Retailer Operations)"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                />
                <button style={styles.primaryBtn} onClick={handleSaveOwner}>
                  Save Assignment
                </button>
              </div>
            ) : (
              <div style={styles.ownerInfoBox}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                    {cluster.assignedTo || 'Unassigned'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{cluster.assignedTeam || 'Retailer Escalations'}</div>
                </div>
                <div style={styles.stateSelectBox}>
                  <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>CLUSTER STATUS</label>
                  <select
                    style={styles.statusDropdown}
                    value={cluster.status}
                    onChange={(e) => updateClusterStatus(cluster.id, e.target.value as ClusterStatus, undefined, 'Admin')}
                  >
                    <option value="detecting">Detecting</option>
                    <option value="investigating">Investigating</option>
                    <option value="action_proposed">Action Proposed</option>
                    <option value="action_approved">Action Approved</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="monitoring">Monitoring</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* RESOLUTION ACTIONS & PROPOSALS */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} color="#F59E0B" />
                <h3 style={styles.sectionTitle}>Operational Action Center</h3>
              </div>
            </div>

            {/* CURRENT PROPOSED ACTION */}
            {cluster.proposedAction ? (
              <div style={styles.proposedActionCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={styles.actionStatusPill}>
                    ACTION STATUS: {cluster.proposedAction.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>
                    by {cluster.proposedAction.proposedBy}
                  </span>
                </div>
                <p style={styles.proposedActionText}>{cluster.proposedAction.actionText}</p>

                {cluster.proposedAction.status === 'pending' && (
                  <div style={styles.actionDecisionRow}>
                    <button style={styles.approveBtn} onClick={handleApproveAction}>
                      <CheckCircle2 size={14} /> Approve Action
                    </button>
                    <button
                      style={styles.rejectBtn}
                      onClick={() => setShowRejectForm(!showRejectForm)}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}

                {showRejectForm && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      style={styles.fieldInput}
                      placeholder="Reason for rejection..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <button style={styles.dangerBtn} onClick={handleRejectAction}>
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleProposeAction} style={styles.newActionForm}>
                <label style={styles.fieldLabel}>Propose Resolution Action</label>
                <textarea
                  style={styles.fieldTextarea}
                  rows={2}
                  placeholder="e.g. Trigger batch refund reconciliation for all 50 orders..."
                  value={proposedText}
                  onChange={(e) => setProposedText(e.target.value)}
                />
                <button
                  type="submit"
                  style={styles.primaryBtn}
                  disabled={!proposedText.trim()}
                >
                  <Send size={13} /> Submit Proposal
                </button>
              </form>
            )}

            {/* SIMULATED REFUND BATCH TRIGGER (FOR REFUND/BILLING CLUSTERS) */}
            {isBillingRefund && (
              <div style={styles.simulatedActionBox}>
                <div style={styles.simulatedActionHeader}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#FCD34D' }}>
                    Batch Settlement Automation (Simulated)
                  </div>
                  <span style={styles.simulatedFlag}>Local Mock Engine</span>
                </div>
                <p style={styles.simulatedActionDesc}>
                  Reconcile all unfulfilled customer returns against merchant logs and disburse simulated refunds
                  honestly with transaction IDs.
                </p>
                <button
                  style={styles.executeBatchBtn}
                  onClick={handleExecuteSimulatedRefunds}
                  disabled={cluster.status === 'resolved'}
                >
                  <Zap size={14} /> Run Simulated Refund Batch for Cluster
                </button>
              </div>
            )}

            {/* PROMISE VERIFICATION TRIGGER */}
            <div style={styles.promiseVerifyBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0' }}>Promise SLA Audit</span>
                <button style={styles.secondaryBtn} onClick={handleRunPromiseAudit}>
                  Verify Outcomes
                </button>
              </div>
              {cluster.promiseVerificationDetails && (
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6, lineHeight: 1.4 }}>
                  {cluster.promiseVerificationDetails.notes}
                </div>
              )}
            </div>
          </div>

          {/* ADD INVESTIGATION NOTE */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Add Investigation Note</h3>
            </div>
            <form onSubmit={handleAddNote} style={styles.noteForm}>
              <input
                style={styles.fieldInput}
                placeholder="Note Headline (e.g. Merchant sync completed)"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <textarea
                style={styles.fieldTextarea}
                rows={2}
                placeholder="Detailed investigation findings or coordination notes..."
                value={noteDetails}
                onChange={(e) => setNoteDetails(e.target.value)}
              />
              <button
                type="submit"
                style={styles.primaryBtn}
                disabled={!noteTitle.trim() || !noteDetails.trim()}
              >
                <PlusCircle size={13} /> Record Note
              </button>
            </form>
          </div>

          {/* ACTION HISTORY AUDIT STREAM */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Cluster Action History</h3>
              <span style={{ fontSize: 11, color: '#6B7280' }}>{cluster.actionHistory.length} events</span>
            </div>

            <div style={styles.timelineList}>
              {cluster.actionHistory.map((act) => (
                <div key={act.id} style={styles.timelineItem}>
                  <div style={styles.timelineDot} />
                  <div style={{ flex: 1 }}>
                    <div style={styles.timelineTop}>
                      <span style={styles.timelineTitle}>{act.title}</span>
                      <span style={styles.timelineTime}>
                        {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p style={styles.timelineDetails}>{act.details}</p>
                    <span style={styles.timelineActor}>by {act.actor}</span>
                  </div>
                </div>
              ))}
              {cluster.actionHistory.length === 0 && (
                <div style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', padding: '16px 0' }}>
                  No historical actions recorded yet.
                </div>
              )}
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
    maxWidth: 1400,
    margin: '0 auto',
  },
  topNavRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
  breadcrumbDivider: {
    color: '#475569',
  },
  breadcrumbActive: {
    color: '#111827',
    fontSize: 13,
    fontWeight: 500,
  },
  notFoundCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: 40,
    textAlign: 'center' as const,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '20px 24px',
  },
  heroTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  heroMetaTags: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
  },
  retailerPill: {
    color: '#38BDF8',
  },
  catPill: {
    color: '#6B7280',
  },
  subcatPill: {
    color: '#111827',
  },
  dot: {
    color: '#475569',
  },
  heroBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#111827',
    margin: '0 0 16px',
    letterSpacing: '-0.02em',
  },
  heroStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    paddingTop: 16,
    borderTop: '1px solid #E5E7EB',
  },
  heroStatItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.04em',
  },
  statVal: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
  },
  statValHighlight: {
    fontSize: 18,
    fontWeight: 800,
    color: '#FBBF24',
  },
  statSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  progressBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
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
  layoutCols: {
    display: 'grid',
    gridTemplateColumns: '7fr 5fr',
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '16px 20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    margin: '2px 0 0',
  },
  actionLinkBtn: {
    background: 'transparent',
    border: 'none',
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  rootCauseDisplay: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '14px',
  },
  rootCauseBody: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 1.5,
    margin: 0,
  },
  editRootCauseForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6B7280',
  },
  fieldSelect: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    color: '#111827',
    fontSize: 12,
    padding: '8px 10px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  fieldTextarea: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    color: '#111827',
    fontSize: 12,
    padding: '8px 10px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical' as const,
    lineHeight: 1.4,
  },
  fieldInput: {
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
    padding: '8px 14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    alignSelf: 'flex-start',
  },
  secondaryBtn: {
    backgroundColor: '#E5E7EB',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#111827',
    fontSize: 11,
    fontWeight: 600,
    padding: '5px 10px',
    cursor: 'pointer',
  },
  tableSearchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '5px 10px',
    width: 240,
  },
  tableSearchInput: {
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#111827',
    fontSize: 12,
    fontFamily: 'inherit',
    width: '100%',
  },
  tableWrap: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 12,
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tr: {
    borderBottom: '1px solid #E5E7EB',
  },
  td: {
    padding: '10px 12px',
    verticalAlign: 'middle' as const,
  },
  refCode: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    fontWeight: 600,
    color: '#059669',
  },
  orderCode: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    color: '#CBD5E1',
  },
  rowInspectBtn: {
    backgroundColor: '#E5E7EB',
    border: '1px solid #334155',
    borderRadius: 4,
    padding: '4px 6px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableEmpty: {
    textAlign: 'center' as const,
    padding: 24,
    color: '#6B7280',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
  },
  paginationInfo: {
    fontSize: 11,
  },
  paginationBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    backgroundColor: '#E5E7EB',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#111827',
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 8px',
    cursor: 'pointer',
  },
  pageIndicator: {
    fontSize: 11,
    color: '#6B7280',
  },
  editOwnerForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  ownerInfoBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '12px 14px',
  },
  stateSelectBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
  },
  statusDropdown: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#111827',
    fontSize: 12,
    padding: '4px 8px',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  proposedActionCard: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: 12,
  },
  actionStatusPill: {
    fontSize: 10,
    fontWeight: 700,
    color: '#FCD34D',
    letterSpacing: '0.04em',
  },
  proposedActionText: {
    fontSize: 12,
    color: '#111827',
    margin: '8px 0 12px',
    lineHeight: 1.4,
  },
  actionDecisionRow: {
    display: 'flex',
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
    fontSize: 11,
    fontWeight: 600,
    padding: '6px 10px',
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
    fontSize: 11,
    fontWeight: 600,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  dangerBtn: {
    backgroundColor: '#DC2626',
    border: 'none',
    borderRadius: 4,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 600,
    padding: '6px 10px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  newActionForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  simulatedActionBox: {
    marginTop: 14,
    backgroundColor: '#FAFBFC',
    border: '1px dashed #D97706',
    borderRadius: 6,
    padding: '12px 14px',
  },
  simulatedActionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simulatedFlag: {
    fontSize: 10,
    fontWeight: 700,
    color: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: '2px 6px',
    borderRadius: 4,
  },
  simulatedActionDesc: {
    fontSize: 11,
    color: '#6B7280',
    margin: '6px 0 10px',
    lineHeight: 1.4,
  },
  executeBatchBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    border: 'none',
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 12px',
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
  },
  promiseVerifyBox: {
    marginTop: 12,
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '10px 12px',
  },
  noteForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 4,
  },
  timelineItem: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    position: 'relative' as const,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#3B82F6',
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
  timelineDetails: {
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
};
