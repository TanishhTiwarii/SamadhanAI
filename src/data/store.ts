import type {
  Complaint,
  ComplaintCluster,
  Notification,
  AuditLogEntry,
  ComplaintStatus,
  ClusterStatus,
  RootCauseStatus,
  ComplaintCategory,
} from '../types';
import { getClusterKey, formatClusterTitle, computeClusterMetrics } from './clustering';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function hoursAgo(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d.toISOString();
}

function generateRef(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

// -------------------------------------------------------------
// SEED COMPLAINTS
// -------------------------------------------------------------

// Generate 50 realistic complaints for Retailer A / Billing / Refund not initiated
const RETAILER_A_NAMES = [
  'Arjun Mehta', 'Sneha Patel', 'Rohan Gupta', 'Pooja Sharma', 'Amit Verma',
  'Deepa Nair', 'Karan Johar', 'Neha Roy', 'Sunil Rao', 'Ananya Iyer',
  'Vikram Seth', 'Meera Joshi', 'Ramesh Sen', 'Kavita Chawla', 'Sanjay Dutt',
  'Divya Menon', 'Rajesh Kulkarni', 'Aditi Rao', 'Manish Pandey', 'Shreya Ghoshal',
  'Naveen Jindal', 'Swati Deshmukh', 'Tarun Bajaj', 'Ritu Kumar', 'Gaurav Kapoor',
  'Bhavna Bhatt', 'Alok Nath', 'Preeti Zinta', 'Mohit Suri', 'Komal Shah',
  'Harish Salve', 'Geeta Phogat', 'Nitin Gadkari', 'Pallavi Sharda', 'Sachin Pilot',
  'Tanvi Azmi', 'Farhan Akhtar', 'Radhika Apte', 'Devendra Fadnavis', 'Kriti Sanon',
  'Raghuram Rajan', 'Asha Bhosle', 'Uday Kotak', 'Twinkle Khanna', 'Kunal Shah',
  'Juhi Chawla', 'Chetan Bhagat', 'Mira Rajput', 'Deepak Parekh', 'Zoya Akhtar',
];

const SEED_RETAILER_A_COMPLAINTS: Complaint[] = RETAILER_A_NAMES.map((name, idx) => {
  const idNum = idx + 1;
  const hours = Math.floor(72 - (idx * 1.3)); // spread across the last 3 days
  const createdTime = hoursAgo(Math.max(1, hours));
  const orderNum = 8000 + idNum;
  
  // A couple have been partially refunded or under review to show live variability
  const isResolved = idNum <= 3;
  const isUnderReview = idNum > 3 && idNum <= 15;
  const status: ComplaintStatus = isResolved ? 'resolved' : isUnderReview ? 'under_review' : 'open';

  return {
    id: `complaint-ra-${idNum}`,
    referenceId: generateRef('SAM-RA', idNum),
    customerName: name,
    customerEmail: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    retailer: 'Retailer A',
    category: 'billing',
    subcategory: 'Refund not initiated',
    orderId: `ORD-RA-${orderNum}`,
    subject: `Return completed for order ORD-RA-${orderNum} but refund not initiated`,
    description: `I returned the package 5 days ago and courier tracking confirmed delivery at Retailer A warehouse. However, the refund of ₹${(1200 + (idNum * 35)) % 4500 + 500} has not been initiated in my banking statement.`,
    status,
    priority: idNum % 5 === 0 ? 'critical' : 'high',
    createdAt: createdTime,
    updatedAt: hoursAgo(Math.max(0, hours - 4)),
    dueDate: daysFromNow(2),
    assignedTo: 'Anita Desai',
    clusterId: 'cluster-ra-billing-refund',
    promiseDeadline: daysFromNow(2),
    refundStatus: isResolved ? 'refund_confirmed_completed' : isUnderReview ? 'refund_processing' : 'refund_requested',
    refundAmount: (1200 + (idNum * 35)) % 4500 + 500,
    refundTransactionId: isResolved ? `SIM-TXN-RA-${9000 + idNum}` : undefined,
    refundVerifiedAt: isResolved ? hoursAgo(12) : undefined,
    timeline: [
      {
        id: `t-ra-${idNum}-1`,
        timestamp: createdTime,
        title: 'Complaint Registered',
        description: 'Customer reported refund delay following warehouse return scan.',
        actor: 'Customer Portal',
        type: 'created',
      },
      ...(isUnderReview || isResolved ? [
        {
          id: `t-ra-${idNum}-2`,
          timestamp: hoursAgo(18),
          title: 'Included in Incident Cluster',
          description: 'Identified as part of Retailer A automated batch settlement delay.',
          actor: 'Operations Triage',
          type: 'cluster_assigned' as const,
        }
      ] : []),
      ...(isResolved ? [
        {
          id: `t-ra-${idNum}-3`,
          timestamp: hoursAgo(12),
          title: 'Simulated Refund Confirmed',
          description: `Simulated gateway batch completed. Transaction ID: SIM-TXN-RA-${9000 + idNum}`,
          actor: 'Settlement Engine',
          type: 'resolved' as const,
        }
      ] : []),
    ],
    tags: ['billing', 'refund-delay', 'batch-incident'],
  };
});

// Additional diverse complaints to populate other clusters
const OTHER_SEED_COMPLAINTS: Complaint[] = [
  // QuickKart Delivery Delays (12 complaints)
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `complaint-qk-${i + 1}`,
    referenceId: generateRef('SAM-QK', i + 1),
    customerName: ['Varun Grover', 'Sonal Chauhan', 'Aakash Chopra', 'Mithali Raj', 'Kapil Dev', 'Saina Nehwal', 'PV Sindhu', 'Leander Paes', 'Abhinav Bindra', 'Mary Kom', 'Neeraj Chopra', 'Sunil Chhetri'][i],
    customerEmail: `customer.qk${i + 1}@example.com`,
    retailer: 'QuickKart Retail',
    category: 'delivery' as ComplaintCategory,
    subcategory: 'Package lost in transit',
    orderId: `ORD-QK-${7100 + i}`,
    subject: `Order stuck at North Hub sorting center for over 6 days`,
    description: `Package was scheduled for same-day delivery via QuickKart but has been sitting at the North Hub without courier movement.`,
    status: (i < 4 ? 'in_progress' : i < 8 ? 'under_review' : 'open') as ComplaintStatus,
    priority: (i === 0 ? 'critical' : 'medium') as Complaint['priority'],
    createdAt: daysAgo(4 - Math.floor(i / 3)),
    updatedAt: hoursAgo(6),
    dueDate: daysFromNow(1),
    assignedTo: 'Rahul Verma',
    clusterId: 'cluster-qk-delivery-transit',
    promiseDeadline: daysFromNow(1),
    refundStatus: 'none' as const,
    timeline: [
      {
        id: `t-qk-${i}-1`,
        timestamp: daysAgo(4 - Math.floor(i / 3)),
        title: 'Delayed Transit Ticket Opened',
        description: 'Customer triggered automatic transit inquiry after 72h SLA breach.',
        actor: 'System',
        type: 'created' as const,
      },
    ],
    tags: ['delivery', 'hub-delay', 'logistics'],
  })),

  // Apex Electronics Damaged Goods (6 complaints)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `complaint-apex-${i + 1}`,
    referenceId: generateRef('SAM-APX', i + 1),
    customerName: ['Ravi Kumar', 'Pankaj Tripathi', 'Manoj Bajpayee', 'Nawazuddin Siddiqui', 'Jaideep Ahlawat', 'Kay Kay Menon'][i],
    customerEmail: `apex.cust${i + 1}@example.com`,
    retailer: 'Apex Electronics',
    category: 'product_quality' as ComplaintCategory,
    subcategory: 'Damaged screen on delivery',
    orderId: `ORD-APX-${4000 + i}`,
    subject: `Display glass shattered upon unboxing LED TV panel`,
    description: `Opened the manufacturer sealed box to find internal LED panel cracked. Outer carton had puncture holes. Photos attached.`,
    status: (i < 2 ? 'escalated' : 'open') as ComplaintStatus,
    priority: 'critical' as Complaint['priority'],
    createdAt: daysAgo(3 - Math.floor(i / 2)),
    updatedAt: hoursAgo(2),
    dueDate: daysAgo(1), // Overdue!
    assignedTo: 'Anita Desai',
    clusterId: 'cluster-apex-quality-screen',
    promiseDeadline: daysAgo(1),
    refundStatus: 'refund_requested' as const,
    refundAmount: 24999,
    timeline: [
      {
        id: `t-apx-${i}-1`,
        timestamp: daysAgo(3 - Math.floor(i / 2)),
        title: 'Damage Claim Filed',
        description: 'Photos uploaded showing unboxing structural defect.',
        actor: 'Customer Portal',
        type: 'created' as const,
      },
    ],
    tags: ['damaged-product', 'high-value', 'transit-damage'],
  })),

  // MetroFresh Goods No-Show (4 complaints)
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `complaint-mf-${i + 1}`,
    referenceId: generateRef('SAM-MF', i + 1),
    customerName: ['Smriti Mandhana', 'Harmanpreet Kaur', 'Jemimah Rodrigues', 'Shafali Verma'][i],
    customerEmail: `metro.cust${i + 1}@example.com`,
    retailer: 'MetroFresh Goods',
    category: 'customer_service' as ComplaintCategory,
    subcategory: 'Delivery partner no-show',
    orderId: `ORD-MF-${3100 + i}`,
    subject: `Grocery slot booked 10am-12pm, delivery partner marked attempted without calling`,
    description: `Waited all morning at home. The app suddenly displayed "Customer unavailable". Security gate confirms no delivery agent entered.`,
    status: 'in_progress' as ComplaintStatus,
    priority: 'medium' as Complaint['priority'],
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(4),
    dueDate: daysFromNow(2),
    assignedTo: 'Priya Sharma',
    clusterId: 'cluster-mf-service-noshow',
    promiseDeadline: daysFromNow(2),
    refundStatus: 'none' as const,
    timeline: [
      {
        id: `t-mf-${i}-1`,
        timestamp: daysAgo(1),
        title: 'Missed Delivery Escalated',
        description: 'Customer disputed "Attempted" delivery status.',
        actor: 'Customer Portal',
        type: 'created' as const,
      },
    ],
    tags: ['no-show', 'grocery', 'dispute'],
  })),

  // Zenith Apparel Payment Expiry (3 complaints, resolved)
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `complaint-zen-${i + 1}`,
    referenceId: generateRef('SAM-ZEN', i + 1),
    customerName: ['Sonam Kapoor', 'Anushka Sharma', 'Deepika Padukone'][i],
    customerEmail: `zenith.cust${i + 1}@example.com`,
    retailer: 'Zenith Apparel',
    category: 'technical' as ComplaintCategory,
    subcategory: 'Payment gateway session expired',
    orderId: `ORD-ZEN-${1100 + i}`,
    subject: `Bank account debited ₹3,499 but order screen timed out`,
    description: `UPI amount deducted from HDFC account. Zenith order confirmation page threw 504 Gateway Timeout.`,
    status: 'resolved' as ComplaintStatus,
    priority: 'low' as Complaint['priority'],
    createdAt: daysAgo(6),
    updatedAt: daysAgo(2),
    dueDate: daysAgo(3),
    assignedTo: 'Karan Gupta',
    clusterId: 'cluster-zen-tech-timeout',
    promiseDeadline: daysAgo(2),
    refundStatus: 'refund_confirmed_completed' as const,
    refundAmount: 3499,
    refundTransactionId: `SIM-TXN-ZEN-${8800 + i}`,
    refundVerifiedAt: daysAgo(2),
    timeline: [
      {
        id: `t-zen-${i}-1`,
        timestamp: daysAgo(6),
        title: 'Timeout Discrepancy Logged',
        description: 'Webhook failed to acknowledge payment receipt.',
        actor: 'System',
        type: 'created' as const,
      },
      {
        id: `t-zen-${i}-2`,
        timestamp: daysAgo(2),
        title: 'Simulated Refund Verified',
        description: `Order reinstated and ₹3,499 auto-reversed with ID SIM-TXN-ZEN-${8800 + i}.`,
        actor: 'Karan Gupta',
        type: 'resolved' as const,
      },
    ],
    tags: ['payment-timeout', 'upi', 'webhook'],
  })),
];

// Combine all complaints (~75 complaints)
const ALL_SEED_COMPLAINTS: Complaint[] = [
  ...SEED_RETAILER_A_COMPLAINTS,
  ...OTHER_SEED_COMPLAINTS,
];

// -------------------------------------------------------------
// SEED CLUSTERS
// -------------------------------------------------------------

const SEED_CLUSTERS: ComplaintCluster[] = [
  {
    id: 'cluster-ra-billing-refund',
    key: getClusterKey('Retailer A', 'billing', 'Refund not initiated'),
    title: formatClusterTitle('Retailer A', 'billing', 'Refund not initiated'),
    retailer: 'Retailer A',
    category: 'billing',
    subcategory: 'Refund not initiated',
    complaintIds: SEED_RETAILER_A_COMPLAINTS.map((c) => c.id),
    affectedCount: 50,
    affectedCustomersCount: 50,
    firstReportedAt: SEED_RETAILER_A_COMPLAINTS[0].createdAt,
    lastReportedAt: SEED_RETAILER_A_COMPLAINTS[SEED_RETAILER_A_COMPLAINTS.length - 1].createdAt,
    oldestAgeDays: 3.1,
    severity: 'critical',
    priority: 'critical',
    status: 'investigating',
    rootCauseStatus: 'suspected',
    rootCauseDetails:
      'Settlement gateway batch scheduler experienced an authentication handshake timeout with Retailer A warehouse return API during the Friday maintenance cycle.',
    assignedTo: 'Anita Desai',
    assignedTeam: 'Retailer Escalations Unit',
    resolutionProgress: 6, // 3 resolved out of 50
    nextRecommendedAction:
      'Approve simulated batch settlement verification to reconcile all 50 affected order balances.',
    proposedAction: {
      actionText:
        'Execute simulated settlement verification audit against Retailer A return log #BAT-RA-9901 and synchronize refund states.',
      proposedBy: 'Anita Desai',
      proposedAt: hoursAgo(8),
      status: 'pending',
    },
    resolutionPlan:
      '1. Verify return warehouse scan receipts against order IDs.\n2. Execute simulated gateway refund disbursement.\n3. Dispatch automated resolution notifications to customers with simulated transaction IDs.',
    promiseDeadline: daysFromNow(2),
    promiseOutcome: 'still_pending',
    promiseVerificationDetails: {
      verifiedAt: hoursAgo(6),
      confirmedCount: 3,
      pendingCount: 47,
      failedCount: 0,
      unknownCount: 0,
      notes: 'Initial partial verification completed for pilot test orders. 47 orders pending execution.',
      simulationBatchId: 'SIM-BATCH-RA-9901',
    },
    actionHistory: [
      {
        id: 'act-ra-1',
        timestamp: daysAgo(3),
        actor: 'Clustering Engine',
        type: 'status_change',
        title: 'Cluster Created Automatically',
        details: 'Deterministic key matches Retailer A + Billing + Refund not initiated. 15 initial complaints aggregated.',
      },
      {
        id: 'act-ra-2',
        timestamp: daysAgo(2),
        actor: 'Anita Desai',
        type: 'owner_assigned',
        title: 'Investigator Assigned',
        details: 'Anita Desai assigned as Lead Incident Owner.',
      },
      {
        id: 'act-ra-3',
        timestamp: daysAgo(1),
        actor: 'Anita Desai',
        type: 'note',
        title: 'Root Cause Hypothesis Logged',
        details: 'API logs show 401 Unauthorized errors on webhook endpoint between warehouse scanning service and billing gateway.',
      },
      {
        id: 'act-ra-4',
        timestamp: hoursAgo(8),
        actor: 'Anita Desai',
        type: 'action_proposed',
        title: 'Simulated Batch Refund Proposed',
        details: 'Proposed automated simulation run for remaining 47 unfulfilled customer refunds.',
      },
    ],
  },
  {
    id: 'cluster-qk-delivery-transit',
    key: getClusterKey('QuickKart Retail', 'delivery', 'Package lost in transit'),
    title: formatClusterTitle('QuickKart Retail', 'delivery', 'Package lost in transit'),
    retailer: 'QuickKart Retail',
    category: 'delivery',
    subcategory: 'Package lost in transit',
    complaintIds: ALL_SEED_COMPLAINTS.filter((c) => c.clusterId === 'cluster-qk-delivery-transit').map((c) => c.id),
    affectedCount: 12,
    affectedCustomersCount: 12,
    firstReportedAt: daysAgo(4),
    lastReportedAt: hoursAgo(2),
    oldestAgeDays: 4.0,
    severity: 'high',
    priority: 'high',
    status: 'in_progress',
    rootCauseStatus: 'verified',
    rootCauseDetails:
      'North Hub automated conveyor belt breakdown caused physical backlog of regional freight parcels. Maintenance team resolved hardware at 04:00 AM.',
    assignedTo: 'Rahul Verma',
    assignedTeam: 'Logistics Escalations',
    resolutionProgress: 35,
    nextRecommendedAction: 'Coordinate priority rerouting with BlueDart & Delhivery dispatch fleets.',
    promiseDeadline: daysFromNow(1),
    promiseOutcome: 'still_pending',
    actionHistory: [
      {
        id: 'act-qk-1',
        timestamp: daysAgo(4),
        actor: 'Clustering Engine',
        type: 'status_change',
        title: 'Transit Delay Pattern Flagged',
        details: 'Cluster generated for QuickKart North Hub delay.',
      },
    ],
  },
  {
    id: 'cluster-apex-quality-screen',
    key: getClusterKey('Apex Electronics', 'product_quality', 'Damaged screen on delivery'),
    title: formatClusterTitle('Apex Electronics', 'product_quality', 'Damaged screen on delivery'),
    retailer: 'Apex Electronics',
    category: 'product_quality',
    subcategory: 'Damaged screen on delivery',
    complaintIds: ALL_SEED_COMPLAINTS.filter((c) => c.clusterId === 'cluster-apex-quality-screen').map((c) => c.id),
    affectedCount: 6,
    affectedCustomersCount: 6,
    firstReportedAt: daysAgo(3),
    lastReportedAt: hoursAgo(4),
    oldestAgeDays: 3.2,
    severity: 'critical',
    priority: 'critical',
    status: 'investigating',
    rootCauseStatus: 'suspected',
    rootCauseDetails:
      'Warehouse pallet stacker operator loaded heavy freight directly atop fragile LED TV boxes without secondary foam buffers.',
    assignedTo: 'Anita Desai',
    assignedTeam: 'Merchant Quality Assurance',
    resolutionProgress: 15,
    nextRecommendedAction: 'Issue merchant recall advisory and inspect packaging SOPs at Gurgaon fulfillment center.',
    promiseDeadline: daysAgo(1), // OVERDUE!
    promiseOutcome: 'failed',
    actionHistory: [
      {
        id: 'act-apx-1',
        timestamp: daysAgo(3),
        actor: 'Clustering Engine',
        type: 'status_change',
        title: 'Severe Damage Cluster Formed',
        details: 'Multiple high-value display claims detected.',
      },
    ],
  },
  {
    id: 'cluster-mf-service-noshow',
    key: getClusterKey('MetroFresh Goods', 'customer_service', 'Delivery partner no-show'),
    title: formatClusterTitle('MetroFresh Goods', 'customer_service', 'Delivery partner no-show'),
    retailer: 'MetroFresh Goods',
    category: 'customer_service',
    subcategory: 'Delivery partner no-show',
    complaintIds: ALL_SEED_COMPLAINTS.filter((c) => c.clusterId === 'cluster-mf-service-noshow').map((c) => c.id),
    affectedCount: 4,
    affectedCustomersCount: 4,
    firstReportedAt: daysAgo(1),
    lastReportedAt: hoursAgo(3),
    oldestAgeDays: 1.1,
    severity: 'medium',
    priority: 'medium',
    status: 'action_proposed',
    rootCauseStatus: 'unidentified',
    assignedTo: 'Priya Sharma',
    assignedTeam: 'Field Operations',
    resolutionProgress: 25,
    nextRecommendedAction: 'Audit geofence logs for South Delhi gig delivery roster.',
    promiseDeadline: daysFromNow(2),
    promiseOutcome: 'still_pending',
    actionHistory: [],
  },
  {
    id: 'cluster-zen-tech-timeout',
    key: getClusterKey('Zenith Apparel', 'technical', 'Payment gateway session expired'),
    title: formatClusterTitle('Zenith Apparel', 'technical', 'Payment gateway session expired'),
    retailer: 'Zenith Apparel',
    category: 'technical',
    subcategory: 'Payment gateway session expired',
    complaintIds: ALL_SEED_COMPLAINTS.filter((c) => c.clusterId === 'cluster-zen-tech-timeout').map((c) => c.id),
    affectedCount: 3,
    affectedCustomersCount: 3,
    firstReportedAt: daysAgo(6),
    lastReportedAt: daysAgo(5),
    oldestAgeDays: 6.0,
    severity: 'low',
    priority: 'low',
    status: 'resolved',
    rootCauseStatus: 'verified',
    rootCauseDetails: 'SSL renegotiation timeout on legacy HDFC PG redirect endpoint patched by DevOps.',
    assignedTo: 'Karan Gupta',
    assignedTeam: 'Core Infrastructure',
    resolutionProgress: 100,
    nextRecommendedAction: 'Keep under monitoring for 7 days.',
    resolutionOutcome: 'All 3 affected customers received simulated UPI reversals and orders were confirmed.',
    promiseDeadline: daysAgo(2),
    promiseOutcome: 'confirmed_completed',
    actionHistory: [
      {
        id: 'act-zen-1',
        timestamp: daysAgo(2),
        actor: 'Karan Gupta',
        type: 'resolution_recorded',
        title: 'Cluster Resolved',
        details: 'Simulated payment reconciliations complete. Closed all 3 tickets.',
      },
    ],
  },
];

// -------------------------------------------------------------
// SEED NOTIFICATIONS (Aggregated Operational Alerts)
// -------------------------------------------------------------

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-agg-1',
    title: 'High-Volume Incident Alert',
    message: '50 customers have reported refund-not-initiated issues for Retailer A.',
    timestamp: hoursAgo(2),
    read: false,
    type: 'cluster',
    severity: 'critical',
    clusterId: 'cluster-ra-billing-refund',
    affectedCount: 50,
  },
  {
    id: 'notif-agg-2',
    title: 'Resolution SLA Overdue',
    message: 'Promise deadline expired for Apex Electronics Damaged Screen cluster (6 complaints).',
    timestamp: hoursAgo(5),
    read: false,
    type: 'promise',
    severity: 'critical',
    clusterId: 'cluster-apex-quality-screen',
    affectedCount: 6,
  },
  {
    id: 'notif-agg-3',
    title: 'Cluster Growth Warning',
    message: 'QuickKart transit delay cluster expanded to 12 complaints following North Hub alert.',
    timestamp: hoursAgo(8),
    read: false,
    type: 'cluster',
    severity: 'high',
    clusterId: 'cluster-qk-delivery-transit',
    affectedCount: 12,
  },
  {
    id: 'notif-agg-4',
    title: 'Simulated Resolution Verified',
    message: 'Zenith Apparel payment timeout cluster marked resolved after automated simulated reversal.',
    timestamp: daysAgo(2),
    read: true,
    type: 'success',
    severity: 'low',
    clusterId: 'cluster-zen-tech-timeout',
    affectedCount: 3,
  },
  {
    id: 'notif-agg-5',
    title: 'Action Approval Required',
    message: 'Anita Desai submitted a proposed batch simulation action for Retailer A.',
    timestamp: hoursAgo(8),
    read: false,
    type: 'alert',
    severity: 'medium',
    clusterId: 'cluster-ra-billing-refund',
  },
];

// -------------------------------------------------------------
// SEED AUDIT LOGS
// -------------------------------------------------------------

const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    timestamp: hoursAgo(2),
    actor: 'Anita Desai',
    action: 'Cluster Status Updated',
    category: 'Triage',
    targetId: 'cluster-ra-billing-refund',
    targetType: 'cluster',
    details: 'Set cluster status to Investigating and assigned lead ownership.',
    status: 'info',
  },
  {
    id: 'aud-2',
    timestamp: hoursAgo(6),
    actor: 'Settlement Engine',
    action: 'Simulated Audit Check',
    category: 'Verification',
    targetId: 'cluster-ra-billing-refund',
    targetType: 'promise',
    details: 'Verified pilot transactions for 3 orders in batch #SIM-BATCH-RA-9901.',
    status: 'success',
  },
  {
    id: 'aud-3',
    timestamp: hoursAgo(8),
    actor: 'Anita Desai',
    action: 'Proposed Action Recorded',
    category: 'Workflow',
    targetId: 'cluster-ra-billing-refund',
    targetType: 'resolution',
    details: 'Proposed simulated batch refund execution for remaining 47 complaints.',
    status: 'info',
  },
  {
    id: 'aud-4',
    timestamp: daysAgo(1),
    actor: 'Clustering Engine',
    action: 'Incident Cluster Formed',
    category: 'System',
    targetId: 'cluster-ra-billing-refund',
    targetType: 'cluster',
    details: 'Deterministic grouping threshold crossed (50 complaints matched).',
    status: 'warning',
  },
  {
    id: 'aud-5',
    timestamp: daysAgo(2),
    actor: 'Karan Gupta',
    action: 'Cluster Resolution Confirmed',
    category: 'Resolution',
    targetId: 'cluster-zen-tech-timeout',
    targetType: 'cluster',
    details: 'Executed simulated UPI reversal batch for Zenith Apparel order timeout victims.',
    status: 'success',
  },
];

// -------------------------------------------------------------
// REACTIVE STORE STATE
// -------------------------------------------------------------

const STORAGE_KEY = 'samadhanai-demo-store-v1';

type PersistedState = {
  complaints: Complaint[];
  clusters: ComplaintCluster[];
  notifications: Notification[];
  auditLogs: AuditLogEntry[];
};

function loadPersistedState(): Partial<PersistedState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedState>) : {};
  } catch {
    return {};
  }
}

const persistedState = loadPersistedState();
let complaints: Complaint[] = Array.isArray(persistedState.complaints) ? persistedState.complaints : [...ALL_SEED_COMPLAINTS];
let clusters: ComplaintCluster[] = Array.isArray(persistedState.clusters) ? persistedState.clusters : [...SEED_CLUSTERS];
let notifications: Notification[] = Array.isArray(persistedState.notifications) ? persistedState.notifications : [...SEED_NOTIFICATIONS];
let auditLogs: AuditLogEntry[] = Array.isArray(persistedState.auditLogs) ? persistedState.auditLogs : [...SEED_AUDIT_LOGS];
let listeners: Array<() => void> = [];

function persistState() {
  if (typeof window === 'undefined') return;
  try {
    const state: PersistedState = { complaints, clusters, notifications, auditLogs };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('SamadhanAI could not persist demo data in this browser.', error);
  }
}

function notify() {
  persistState();
  listeners.forEach((fn) => fn());
}

function logAudit(
  actor: string,
  action: string,
  category: string,
  targetId: string,
  targetType: AuditLogEntry['targetType'],
  details: string,
  status: AuditLogEntry['status'] = 'info'
) {
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    category,
    targetId,
    targetType,
    details,
    status,
  };
  auditLogs = [entry, ...auditLogs];
}

export const store = {
  subscribe(fn: () => void) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },

  getComplaints(): Complaint[] {
    return complaints;
  },

  getComplaint(id: string): Complaint | undefined {
    const q = id.trim().toLowerCase();
    return complaints.find((c) => c.id.toLowerCase() === q || c.referenceId.toLowerCase() === q);
  },

  getComplaintByRef(ref: string): Complaint | undefined {
    const q = ref.trim().toLowerCase();
    return complaints.find((c) => c.referenceId.toLowerCase() === q);
  },

  getClusters(): ComplaintCluster[] {
    return clusters;
  },

  getCluster(id: string): ComplaintCluster | undefined {
    const q = id.trim().toLowerCase();
    return clusters.find((c) => c.id.toLowerCase() === q || c.key.toLowerCase() === q);
  },

  getNotifications(): Notification[] {
    return notifications;
  },

  getAuditLogs(): AuditLogEntry[] {
    return auditLogs;
  },

  // -------------------------------------------------------------
  // CUSTOMER / NEW COMPLAINT INGESTION
  // -------------------------------------------------------------
  addComplaint(data: {
    customerName: string;
    customerEmail: string;
    retailer?: string;
    category: ComplaintCategory;
    subcategory?: string;
    orderId: string;
    subject: string;
    description: string;
  }): Complaint {
    const now = new Date().toISOString();
    const id = `complaint-${Date.now()}`;
    const referenceId = `SAM-${Date.now().toString(36).toUpperCase().slice(-5)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const retailer = data.retailer || 'Retailer A';
    const subcategory = data.subcategory || (data.category === 'billing' ? 'Refund not initiated' : 'Customer reported issue');

    // Deterministic grouping key
    const clusterKey = getClusterKey(retailer, data.category, subcategory);
    let targetCluster = clusters.find((c) => c.key === clusterKey);
    const clusterId = targetCluster ? targetCluster.id : `cluster-${Date.now()}`;

    const complaint: Complaint = {
      id,
      referenceId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      retailer,
      category: data.category,
      subcategory,
      orderId: data.orderId,
      subject: data.subject,
      description: data.description,
      status: 'open',
      priority: 'medium',
      createdAt: now,
      updatedAt: now,
      dueDate: daysFromNow(3),
      assignedTo: targetCluster?.assignedTo || 'Unassigned',
      clusterId,
      refundStatus: data.category === 'refund' || data.category === 'billing' ? 'refund_requested' : 'none',
      timeline: [
        {
          id: `t-${Date.now()}`,
          timestamp: now,
          title: 'Complaint Filed by Customer',
          description: `Submitted via Customer Portal for ${retailer}.`,
          actor: 'Customer',
          type: 'created',
        },
      ],
      tags: [data.category, retailer.toLowerCase().replace(/\s+/g, '-')],
    };

    complaints = [complaint, ...complaints];

    // Recompute or create cluster
    if (targetCluster) {
      const memberComplaints = complaints.filter((c) => c.clusterId === targetCluster!.id);
      const metrics = computeClusterMetrics(memberComplaints, targetCluster);
      clusters = clusters.map((c) => (c.id === targetCluster!.id ? { ...c, ...metrics, key: clusterKey } : c));
    } else {
      const newCluster: ComplaintCluster = {
        id: clusterId,
        key: clusterKey,
        title: formatClusterTitle(retailer, data.category, subcategory),
        retailer,
        category: data.category,
        subcategory,
        complaintIds: [complaint.id],
        affectedCount: 1,
        affectedCustomersCount: 1,
        firstReportedAt: now,
        lastReportedAt: now,
        oldestAgeDays: 0,
        severity: 'low',
        priority: 'medium',
        status: 'detecting',
        rootCauseStatus: 'unidentified',
        resolutionProgress: 0,
        nextRecommendedAction: 'Initial pattern detected. Monitor for duplicate customer submissions.',
        actionHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: now,
            actor: 'Clustering Engine',
            type: 'status_change',
            title: 'Cluster Created',
            details: `New cluster initialized for ${retailer} - ${data.category}.`,
          },
        ],
      };
      clusters = [newCluster, ...clusters];
    }

    // Add notification
    notifications = [
      {
        id: `notif-${Date.now()}`,
        title: 'New Complaint Received',
        message: `${data.customerName} filed a complaint for ${retailer} (${subcategory}).`,
        timestamp: now,
        read: false,
        type: 'alert',
        severity: 'medium',
        complaintId: id,
        clusterId: complaint.clusterId,
      },
      ...notifications,
    ];

    logAudit(
      'Customer Portal',
      'Complaint Created',
      'Submission',
      complaint.referenceId,
      'complaint',
      `Filed by ${data.customerName} for ${retailer}. Assigned to cluster ${complaint.clusterId}.`
    );

    notify();
    return complaint;
  },

  // -------------------------------------------------------------
  // CLUSTER OPERATIONS
  // -------------------------------------------------------------
  updateClusterStatus(clusterId: string, status: ClusterStatus, note?: string, actor: string = 'Admin'): void {
    const now = new Date().toISOString();
    clusters = clusters.map((c) => {
      if (c.id !== clusterId) return c;
      const action: ComplaintCluster['actionHistory'][number] = {
        id: `act-${Date.now()}`,
        timestamp: now,
        actor,
        type: 'status_change',
        title: `Status Changed to ${status.replace('_', ' ').toUpperCase()}`,
        details: note || `Cluster workflow state progressed to ${status}.`,
      };
      return {
        ...c,
        status,
        actionHistory: [action, ...c.actionHistory],
      };
    });

    logAudit(actor, 'Cluster Status Changed', 'Workflow', clusterId, 'cluster', `Status set to ${status}. ${note || ''}`);
    notify();
  },

  assignClusterOwner(clusterId: string, owner: string, team: string, actor: string = 'Admin'): void {
    const now = new Date().toISOString();
    clusters = clusters.map((c) => {
      if (c.id !== clusterId) return c;
      return {
        ...c,
        assignedTo: owner,
        assignedTeam: team,
        actionHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: now,
            actor,
            type: 'owner_assigned',
            title: 'Owner Assigned',
            details: `Assigned to ${owner} (${team}).`,
          },
          ...c.actionHistory,
        ],
      };
    });

    logAudit(actor, 'Cluster Assigned', 'Assignment', clusterId, 'cluster', `Assigned to ${owner} (${team}).`);
    notify();
  },

  updateClusterRootCause(clusterId: string, rootCauseStatus: RootCauseStatus, details: string, actor: string = 'Admin'): void {
    const now = new Date().toISOString();
    clusters = clusters.map((c) => {
      if (c.id !== clusterId) return c;
      return {
        ...c,
        rootCauseStatus,
        rootCauseDetails: details,
        actionHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: now,
            actor,
            type: 'note',
            title: `Root Cause ${rootCauseStatus.toUpperCase()}`,
            details,
          },
          ...c.actionHistory,
        ],
      };
    });

    logAudit(actor, 'Root Cause Updated', 'Investigation', clusterId, 'cluster', `${rootCauseStatus.toUpperCase()}: ${details}`);
    notify();
  },

  addClusterNote(clusterId: string, title: string, details: string, actor: string = 'Admin'): void {
    const now = new Date().toISOString();
    clusters = clusters.map((c) => {
      if (c.id !== clusterId) return c;
      return {
        ...c,
        actionHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: now,
            actor,
            type: 'note',
            title,
            details,
          },
          ...c.actionHistory,
        ],
      };
    });

    logAudit(actor, 'Cluster Note Added', 'Investigation', clusterId, 'cluster', `${title}: ${details}`);
    notify();
  },

  proposeClusterAction(clusterId: string, actionText: string, actor: string = 'Admin'): void {
    const now = new Date().toISOString();
    clusters = clusters.map((c) => {
      if (c.id !== clusterId) return c;
      return {
        ...c,
        status: 'action_proposed',
        proposedAction: {
          actionText,
          proposedBy: actor,
          proposedAt: now,
          status: 'pending',
        },
        actionHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: now,
            actor,
            type: 'action_proposed',
            title: 'Resolution Action Proposed',
            details: actionText,
          },
          ...c.actionHistory,
        ],
      };
    });

    logAudit(actor, 'Action Proposed', 'Resolution', clusterId, 'resolution', actionText);
    notify();
  },

  approveClusterAction(clusterId: string, approver: string = 'Lead Operations Admin'): void {
    const now = new Date().toISOString();
    clusters = clusters.map((c) => {
      if (c.id !== clusterId || !c.proposedAction) return c;
      return {
        ...c,
        status: 'action_approved',
        proposedAction: {
          ...c.proposedAction,
          status: 'approved',
          approvedBy: approver,
          approvedAt: now,
        },
        actionHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: now,
            actor: approver,
            type: 'action_approved',
            title: 'Proposed Action Approved',
            details: `Approved by ${approver}. Action is authorized for execution.`,
          },
          ...c.actionHistory,
        ],
      };
    });

    logAudit(approver, 'Action Approved', 'Resolution', clusterId, 'resolution', 'Action approved for deployment.');
    notify();
  },

  rejectClusterAction(clusterId: string, actor: string, reason: string): void {
    const now = new Date().toISOString();
    clusters = clusters.map((c) => {
      if (c.id !== clusterId || !c.proposedAction) return c;
      return {
        ...c,
        status: 'investigating',
        proposedAction: {
          ...c.proposedAction,
          status: 'rejected',
          rejectionReason: reason,
        },
        actionHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: now,
            actor,
            type: 'action_rejected',
            title: 'Proposed Action Rejected',
            details: `Rejected: ${reason}`,
          },
          ...c.actionHistory,
        ],
      };
    });

    logAudit(actor, 'Action Rejected', 'Resolution', clusterId, 'resolution', reason, 'warning');
    notify();
  },

  // -------------------------------------------------------------
  // SIMULATED REFUND BATCH EXECUTION & VERIFICATION
  // -------------------------------------------------------------
  executeSimulatedRefundBatch(clusterId: string, actor: string = 'Admin'): { updatedCount: number; batchId: string } {
    const now = new Date().toISOString();
    const batchId = `SIM-BATCH-${Date.now().toString(36).toUpperCase()}`;

    let count = 0;
    complaints = complaints.map((c) => {
      if (c.clusterId === clusterId && (c.refundStatus === 'refund_requested' || c.refundStatus === 'refund_processing' || c.refundStatus === 'none')) {
        count++;
        const txnId = `SIM-TXN-${batchId.slice(-6)}-${c.id.slice(-4)}`;
        return {
          ...c,
          status: 'resolved' as const,
          refundStatus: 'refund_confirmed_completed' as const,
          refundTransactionId: txnId,
          refundVerifiedAt: now,
          updatedAt: now,
          resolution: `Simulated refund batch ${batchId} executed successfully. Reconciled with transaction ${txnId}.`,
          timeline: [
            ...c.timeline,
            {
              id: `t-sim-${Date.now()}-${count}`,
              timestamp: now,
              title: 'Simulated Refund Confirmed Completed',
              description: `Batch ${batchId} verified in local simulated environment. Settlement ID: ${txnId}`,
              actor,
              type: 'resolved' as const,
            },
          ],
        };
      }
      return c;
    });

    clusters = clusters.map((cluster) => {
      if (cluster.id !== clusterId) return cluster;
      return {
        ...cluster,
        status: 'resolved' as const,
        resolutionProgress: 100,
        resolutionOutcome: `All ${count} complaints resolved via simulated settlement batch ${batchId}. Verified against local transaction logs.`,
        promiseOutcome: 'confirmed_completed' as const,
        promiseVerificationDetails: {
          verifiedAt: now,
          confirmedCount: count,
          pendingCount: 0,
          failedCount: 0,
          unknownCount: 0,
          notes: `Batch reconciliation ${batchId} confirmed 100% completion (simulated environment).`,
          simulationBatchId: batchId,
        },
        actionHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: now,
            actor,
            type: 'refund_batch_run',
            title: 'Simulated Refund Batch Completed',
            details: `Successfully processed simulated refund reconciliation for ${count} orders. Batch ID: ${batchId}.`,
          },
          ...cluster.actionHistory,
        ],
      };
    });

    logAudit(
      actor,
      'Simulated Refund Batch Run',
      'Settlement',
      clusterId,
      'resolution',
      `Processed simulated refunds for ${count} orders in cluster ${clusterId}. Batch ID: ${batchId}.`,
      'success'
    );

    notify();
    return { updatedCount: count, batchId };
  },

  // -------------------------------------------------------------
  // PROMISE VERIFICATION AUDIT
  // -------------------------------------------------------------
  runPromiseVerification(clusterId: string, actor: string = 'Automated Verification Scheduler'): void {
    const now = new Date().toISOString();
    const cluster = clusters.find((c) => c.id === clusterId);
    if (!cluster) return;

    const memberComplaints = complaints.filter((c) => c.clusterId === clusterId);
    const confirmedCount = memberComplaints.filter((c) => c.refundStatus === 'refund_confirmed_completed' || c.status === 'resolved').length;
    const pendingCount = memberComplaints.filter((c) => c.status === 'open' || c.status === 'under_review' || c.status === 'in_progress').length;
    const failedCount = memberComplaints.filter((c) => c.refundStatus === 'refund_failed').length;
    const unknownCount = memberComplaints.filter((c) => c.refundStatus === 'refund_unknown').length;

    let promiseOutcome: ComplaintCluster['promiseOutcome'] = 'still_pending';
    if (confirmedCount === memberComplaints.length && memberComplaints.length > 0) {
      promiseOutcome = 'confirmed_completed';
    } else if (failedCount > 0 || (cluster.promiseDeadline && new Date(cluster.promiseDeadline).getTime() < new Date().getTime())) {
      promiseOutcome = 'failed';
    } else if (unknownCount > 0) {
      promiseOutcome = 'unknown_unverified';
    } else {
      promiseOutcome = 'still_pending';
    }

    clusters = clusters.map((c) => {
      if (c.id !== clusterId) return c;
      return {
        ...c,
        promiseOutcome,
        promiseVerificationDetails: {
          verifiedAt: now,
          confirmedCount,
          pendingCount,
          failedCount,
          unknownCount,
          notes: `Audit conducted at ${new Date(now).toLocaleTimeString()}. Confirmed: ${confirmedCount}, Pending: ${pendingCount}, Failed: ${failedCount}, Unknown: ${unknownCount}.`,
        },
        actionHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: now,
            actor,
            type: 'verification_run',
            title: 'Promise Verification Audit Executed',
            details: `Outcome: ${promiseOutcome.replace('_', ' ').toUpperCase()} (${confirmedCount}/${memberComplaints.length} completed).`,
          },
          ...c.actionHistory,
        ],
      };
    });

    logAudit(
      actor,
      'Promise Verification Audit',
      'Promise SLA',
      clusterId,
      'promise',
      `Audit completed. Result: ${promiseOutcome}. Confirmed: ${confirmedCount}/${memberComplaints.length}.`
    );

    notify();
  },

  // -------------------------------------------------------------
  // COMPLAINT DETAILS & ACTIONS
  // -------------------------------------------------------------
  updateStatus(id: string, status: Complaint['status'], note?: string, actor: string = 'Admin'): void {
    const q = id.trim().toLowerCase();
    complaints = complaints.map((c) => {
      if (c.id.toLowerCase() !== q && c.referenceId.toLowerCase() !== q) return c;
      const now = new Date().toISOString();
      const event: Complaint['timeline'][number] = {
        id: `t-${Date.now()}`,
        timestamp: now,
        title: `Status changed to ${status.replace('_', ' ')}`,
        description: note || `Complaint status updated.`,
        actor,
        type: status === 'resolved' ? 'resolved' : status === 'closed' ? 'closed' : status === 'escalated' ? 'escalated' : 'updated',
      };
      return {
        ...c,
        status,
        updatedAt: now,
        resolution: status === 'resolved' && note ? note : c.resolution,
        timeline: [...c.timeline, event],
      };
    });

    // Recompute and synchronize parent cluster if applicable
    const updated = complaints.find((c) => c.id.toLowerCase() === q || c.referenceId.toLowerCase() === q);
    if (updated?.clusterId) {
      const targetCluster = clusters.find((cl) => cl.id === updated.clusterId);
      if (targetCluster) {
        const memberComplaints = complaints.filter((c) => c.clusterId === targetCluster.id);
        const metrics = computeClusterMetrics(memberComplaints, targetCluster);
        clusters = clusters.map((cl) => (cl.id === targetCluster.id ? { ...cl, ...metrics } : cl));
      }
    }

    if (updated) {
      const statusLabel = status.replace(/_/g, ' ');
      notifications = [
        {
          id: `notif-status-${updated.id}-${Date.now()}`,
          title: status === 'resolved' ? 'Complaint resolved' : 'Complaint status updated',
          message: `${updated.referenceId}: your complaint is now ${statusLabel}.${note ? ` Update: ${note}` : ''}`,
          timestamp: new Date().toISOString(),
          read: false,
          type: status === 'resolved' ? 'success' : 'info',
          complaintId: updated.id,
        },
        ...notifications,
      ];
    }

    logAudit(actor, 'Complaint Status Updated', 'Triage', id, 'complaint', `Set status to ${status}. Note: ${note || 'None'}`);
    notify();
  },

  addNote(id: string, title: string, description: string, actor: string = 'Admin'): void {
    complaints = complaints.map((c) => {
      if (c.id !== id) return c;
      const now = new Date().toISOString();
      return {
        ...c,
        updatedAt: now,
        timeline: [
          ...c.timeline,
          {
            id: `t-${Date.now()}`,
            timestamp: now,
            title,
            description,
            actor,
            type: 'note' as const,
          },
        ],
      };
    });

    logAudit(actor, 'Note Added', 'Investigation', id, 'complaint', `${title}: ${description}`);
    notify();
  },

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  markNotificationRead(id: string): void {
    notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    notify();
  },

  markAllNotificationsRead(): void {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    notify();
  },
};
