export type ComplaintStatus = 'open' | 'in_progress' | 'under_review' | 'resolved' | 'escalated' | 'closed';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';
export type ClusterSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintCategory =
  | 'billing'
  | 'product_quality'
  | 'delivery'
  | 'customer_service'
  | 'technical'
  | 'refund'
  | 'other';

export type RefundStatus =
  | 'none'
  | 'refund_requested'
  | 'refund_approved'
  | 'refund_processing'
  | 'refund_confirmed_completed'
  | 'refund_failed'
  | 'refund_unknown';

export type ClusterStatus =
  | 'detecting'
  | 'investigating'
  | 'action_proposed'
  | 'action_approved'
  | 'in_progress'
  | 'resolved'
  | 'monitoring';

export type RootCauseStatus = 'suspected' | 'verified' | 'unidentified';

export type PromiseOutcomeStatus =
  | 'confirmed_completed'
  | 'still_pending'
  | 'failed'
  | 'unknown_unverified';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
  type: 'created' | 'updated' | 'note' | 'escalated' | 'resolved' | 'closed' | 'cluster_assigned';
}

export interface Complaint {
  id: string;
  referenceId: string;
  customerName: string;
  customerEmail: string;
  retailer: string;
  category: ComplaintCategory;
  subcategory: string;
  orderId: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  assignedTo: string;
  timeline: TimelineEvent[];
  tags: string[];
  resolution?: string;
  refundStatus?: RefundStatus;
  refundAmount?: number;
  refundTransactionId?: string;
  refundVerifiedAt?: string;
  clusterId?: string;
  promiseDeadline?: string;
}

export interface ClusterAction {
  id: string;
  timestamp: string;
  actor: string;
  type:
    | 'status_change'
    | 'note'
    | 'owner_assigned'
    | 'action_proposed'
    | 'action_approved'
    | 'action_rejected'
    | 'verification_run'
    | 'resolution_recorded'
    | 'refund_batch_run';
  title: string;
  details: string;
}

export interface ProposedAction {
  actionText: string;
  proposedBy: string;
  proposedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface PromiseVerificationDetails {
  verifiedAt: string;
  confirmedCount: number;
  pendingCount: number;
  failedCount: number;
  unknownCount: number;
  notes: string;
  simulationBatchId?: string;
}

export interface ComplaintCluster {
  id: string;
  key: string; // retailer::category::subcategory
  title: string;
  retailer: string;
  category: ComplaintCategory;
  subcategory: string;
  complaintIds: string[];
  affectedCount: number;
  affectedCustomersCount: number;
  firstReportedAt: string;
  lastReportedAt: string;
  oldestAgeDays: number;
  severity: ClusterSeverity;
  priority: ComplaintPriority;
  status: ClusterStatus;
  rootCauseStatus: RootCauseStatus;
  rootCauseDetails?: string;
  assignedTo?: string;
  assignedTeam?: string;
  resolutionProgress: number; // 0 to 100
  nextRecommendedAction: string;
  proposedAction?: ProposedAction;
  resolutionPlan?: string;
  resolutionOutcome?: string;
  promiseDeadline?: string;
  promiseOutcome?: PromiseOutcomeStatus;
  promiseVerificationDetails?: PromiseVerificationDetails;
  actionHistory: ClusterAction[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'cluster' | 'promise' | 'alert' | 'info' | 'warning' | 'success' | 'error';
  severity?: ClusterSeverity;
  complaintId?: string;
  clusterId?: string;
  affectedCount?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  category: string;
  targetId: string;
  targetType: 'cluster' | 'complaint' | 'system' | 'resolution' | 'promise';
  details: string;
  status: 'success' | 'warning' | 'info';
}

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  billing: 'Billing & Payments',
  product_quality: 'Product Quality',
  delivery: 'Delivery & Shipping',
  customer_service: 'Customer Service',
  technical: 'Technical Issue',
  refund: 'Refund Request',
  other: 'Other',
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  under_review: 'Under Review',
  resolved: 'Resolved',
  escalated: 'Escalated',
  closed: 'Closed',
};

export const CLUSTER_STATUS_LABELS: Record<ClusterStatus, string> = {
  detecting: 'Detecting Pattern',
  investigating: 'Investigating',
  action_proposed: 'Action Proposed',
  action_approved: 'Action Approved',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  monitoring: 'Monitoring Post-Fix',
};

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const SEVERITY_LABELS: Record<ClusterSeverity, string> = {
  low: 'Low Severity',
  medium: 'Medium Severity',
  high: 'High Severity',
  critical: 'Critical Impact',
};

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  none: 'Not Applicable',
  refund_requested: 'Refund Requested',
  refund_approved: 'Refund Approved',
  refund_processing: 'Refund Processing',
  refund_confirmed_completed: 'Refund Confirmed (Verified)',
  refund_failed: 'Refund Failed',
  refund_unknown: 'Refund Status Unknown / Unverified',
};

export const ROOT_CAUSE_LABELS: Record<RootCauseStatus, string> = {
  suspected: 'Root Cause Suspected',
  verified: 'Root Cause Verified',
  unidentified: 'Unidentified / Triage',
};

export const AVAILABLE_RETAILERS = [
  'Retailer A',
  'QuickKart Retail',
  'Apex Electronics',
  'MetroFresh Goods',
  'Zenith Apparel',
] as const;
