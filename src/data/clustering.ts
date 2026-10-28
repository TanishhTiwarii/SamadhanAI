import type {
  Complaint,
  ComplaintCluster,
  ClusterSeverity,
  ComplaintPriority,
} from '../types';

export function getClusterKey(retailer: string, category: string, subcategory: string): string {
  const normRetailer = (retailer || 'Unassigned Retailer').trim();
  const normCategory = (category || 'other').trim();
  const normSubcategory = (subcategory || 'General Issue').trim();
  return `${normRetailer}::${normCategory}::${normSubcategory}`.toLowerCase();
}

export function formatClusterTitle(retailer: string, category: string, subcategory: string): string {
  const catName = category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  return `[${retailer}] ${catName}: ${subcategory}`;
}

export function computeClusterMetrics(
  complaints: Complaint[],
  existingCluster?: ComplaintCluster
): Omit<ComplaintCluster, 'id' | 'key' | 'title' | 'retailer' | 'category' | 'subcategory' | 'actionHistory'> {
  if (complaints.length === 0) {
    throw new Error('Cannot compute metrics for empty cluster');
  }

  const sortedByDate = [...complaints].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const firstReportedAt = sortedByDate[0].createdAt;
  const lastReportedAt = sortedByDate[sortedByDate.length - 1].createdAt;

  const now = new Date().getTime();
  const oldestTime = new Date(firstReportedAt).getTime();
  const oldestAgeDays = Math.max(0, Math.round(((now - oldestTime) / (1000 * 60 * 60 * 24)) * 10) / 10);

  const uniqueCustomers = new Set(complaints.map((c) => c.customerEmail.toLowerCase().trim()));
  const affectedCustomersCount = uniqueCustomers.size;
  const affectedCount = complaints.length;

  // Priority determination
  let priority: ComplaintPriority = 'low';
  if (complaints.some((c) => c.priority === 'critical')) priority = 'critical';
  else if (complaints.some((c) => c.priority === 'high') || affectedCount >= 10) priority = 'high';
  else if (complaints.some((c) => c.priority === 'medium') || affectedCount >= 3) priority = 'medium';

  // Severity calculation
  let severity: ClusterSeverity = 'low';
  if (affectedCount >= 30 || complaints.some((c) => c.priority === 'critical')) {
    severity = 'critical';
  } else if (affectedCount >= 10 || complaints.some((c) => c.priority === 'high')) {
    severity = 'high';
  } else if (affectedCount >= 3 || complaints.some((c) => c.priority === 'medium')) {
    severity = 'medium';
  }

  // Next recommended action
  let nextRecommendedAction = existingCluster?.nextRecommendedAction;
  if (!nextRecommendedAction) {
    if (affectedCount >= 20) {
      nextRecommendedAction = 'Escalate to merchant operations & trigger batch simulated verification.';
    } else if (complaints.some((c) => c.status === 'open')) {
      nextRecommendedAction = 'Assign lead investigator to review telemetry and dispatch triage response.';
    } else {
      nextRecommendedAction = 'Monitor post-resolution stability for new incoming reports.';
    }
  }

  // Progress calculation
  const resolvedCount = complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const calculatedProgress = Math.round((resolvedCount / affectedCount) * 100);
  const resolutionProgress = calculatedProgress;

  return {
    complaintIds: complaints.map((c) => c.id),
    affectedCount,
    affectedCustomersCount,
    firstReportedAt,
    lastReportedAt,
    oldestAgeDays,
    severity,
    priority,
    status: existingCluster ? existingCluster.status : 'investigating',
    rootCauseStatus: existingCluster ? existingCluster.rootCauseStatus : 'suspected',
    rootCauseDetails: existingCluster?.rootCauseDetails,
    assignedTo: existingCluster?.assignedTo || (affectedCount >= 10 ? 'Senior Triage Team' : 'Unassigned'),
    assignedTeam: existingCluster?.assignedTeam || 'Retailer Operations',
    resolutionProgress,
    nextRecommendedAction,
    proposedAction: existingCluster?.proposedAction,
    resolutionPlan: existingCluster?.resolutionPlan,
    resolutionOutcome: existingCluster?.resolutionOutcome,
    promiseDeadline: existingCluster?.promiseDeadline,
    promiseOutcome: existingCluster?.promiseOutcome,
    promiseVerificationDetails: existingCluster?.promiseVerificationDetails,
  };
}
