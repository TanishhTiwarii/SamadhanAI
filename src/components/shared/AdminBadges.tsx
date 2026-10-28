import React from 'react';
import type {
  ComplaintStatus,
  ComplaintPriority,
  ClusterSeverity,
  ClusterStatus,
  RefundStatus,
  RootCauseStatus,
  PromiseOutcomeStatus,
} from '../../types';
import {
  STATUS_LABELS,
  SEVERITY_LABELS,
  CLUSTER_STATUS_LABELS,
  ROOT_CAUSE_LABELS,
} from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  bg: string;
  color: string;
  border?: string;
  size?: 'sm' | 'md';
}

function BaseBadge({ children, bg, color, border, size = 'sm' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        borderRadius: 4,
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        backgroundColor: bg,
        color,
        border: border ? `1px solid ${border}` : 'none',
        lineHeight: '1.4',
      }}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, size }: { status: ComplaintStatus; size?: 'sm' | 'md' }) {
  switch (status) {
    case 'open':
      return <BaseBadge bg="#2B1A04" color="#FBBF24" border="#78350F" size={size}>{STATUS_LABELS.open}</BaseBadge>;
    case 'in_progress':
      return <BaseBadge bg="#0B2545" color="#60A5FA" border="#1D4ED8" size={size}>{STATUS_LABELS.in_progress}</BaseBadge>;
    case 'under_review':
      return <BaseBadge bg="#1E1B4B" color="#A78BFA" border="#4338CA" size={size}>{STATUS_LABELS.under_review}</BaseBadge>;
    case 'escalated':
      return <BaseBadge bg="#360C0E" color="#F87171" border="#991B1B" size={size}>{STATUS_LABELS.escalated}</BaseBadge>;
    case 'resolved':
      return <BaseBadge bg="#062E20" color="#34D399" border="#047857" size={size}>{STATUS_LABELS.resolved}</BaseBadge>;
    case 'closed':
    default:
      return <BaseBadge bg="#1E293B" color="#94A3B8" border="#334155" size={size}>{STATUS_LABELS.closed}</BaseBadge>;
  }
}

export function PriorityBadge({ priority, size }: { priority: ComplaintPriority; size?: 'sm' | 'md' }) {
  switch (priority) {
    case 'critical':
      return <BaseBadge bg="#380B0F" color="#FCA5A5" border="#B91C1C" size={size}>CRITICAL</BaseBadge>;
    case 'high':
      return <BaseBadge bg="#2D1702" color="#FDBA74" border="#C2410C" size={size}>HIGH</BaseBadge>;
    case 'medium':
      return <BaseBadge bg="#092742" color="#93C5FD" border="#1D4ED8" size={size}>MEDIUM</BaseBadge>;
    case 'low':
    default:
      return <BaseBadge bg="#1E293B" color="#CBD5E1" border="#334155" size={size}>LOW</BaseBadge>;
  }
}

export function SeverityBadge({ severity, size }: { severity: ClusterSeverity; size?: 'sm' | 'md' }) {
  switch (severity) {
    case 'critical':
      return (
        <BaseBadge bg="#3A080C" color="#FCA5A5" border="#DC2626" size={size}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
          {SEVERITY_LABELS.critical}
        </BaseBadge>
      );
    case 'high':
      return (
        <BaseBadge bg="#311703" color="#FDBA74" border="#EA580C" size={size}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
          {SEVERITY_LABELS.high}
        </BaseBadge>
      );
    case 'medium':
      return (
        <BaseBadge bg="#0C2548" color="#93C5FD" border="#2563EB" size={size}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} />
          {SEVERITY_LABELS.medium}
        </BaseBadge>
      );
    case 'low':
    default:
      return (
        <BaseBadge bg="#1E293B" color="#94A3B8" border="#475569" size={size}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748B', display: 'inline-block' }} />
          {SEVERITY_LABELS.low}
        </BaseBadge>
      );
  }
}

export function ClusterStatusBadge({ status, size }: { status: ClusterStatus; size?: 'sm' | 'md' }) {
  switch (status) {
    case 'detecting':
      return <BaseBadge bg="#1E1B4B" color="#C4B5FD" border="#4C1D95" size={size}>{CLUSTER_STATUS_LABELS.detecting}</BaseBadge>;
    case 'investigating':
      return <BaseBadge bg="#2B1A04" color="#FCD34D" border="#92400E" size={size}>{CLUSTER_STATUS_LABELS.investigating}</BaseBadge>;
    case 'action_proposed':
      return <BaseBadge bg="#0A2744" color="#93C5FD" border="#1E40AF" size={size}>{CLUSTER_STATUS_LABELS.action_proposed}</BaseBadge>;
    case 'action_approved':
      return <BaseBadge bg="#062E20" color="#6EE7B7" border="#065F46" size={size}>{CLUSTER_STATUS_LABELS.action_approved}</BaseBadge>;
    case 'in_progress':
      return <BaseBadge bg="#0A2744" color="#60A5FA" border="#2563EB" size={size}>{CLUSTER_STATUS_LABELS.in_progress}</BaseBadge>;
    case 'resolved':
      return <BaseBadge bg="#062E20" color="#34D399" border="#059669" size={size}>{CLUSTER_STATUS_LABELS.resolved}</BaseBadge>;
    case 'monitoring':
      return <BaseBadge bg="#1E293B" color="#CBD5E1" border="#475569" size={size}>{CLUSTER_STATUS_LABELS.monitoring}</BaseBadge>;
    default:
      return <BaseBadge bg="#1E293B" color="#94A3B8" size={size}>{status}</BaseBadge>;
  }
}

export function RootCauseBadge({ status, size }: { status: RootCauseStatus; size?: 'sm' | 'md' }) {
  switch (status) {
    case 'verified':
      return <BaseBadge bg="#062E20" color="#34D399" border="#059669" size={size}>{ROOT_CAUSE_LABELS.verified}</BaseBadge>;
    case 'suspected':
      return <BaseBadge bg="#2D1502" color="#FDBA74" border="#C2410C" size={size}>{ROOT_CAUSE_LABELS.suspected}</BaseBadge>;
    case 'unidentified':
    default:
      return <BaseBadge bg="#1E293B" color="#94A3B8" border="#475569" size={size}>{ROOT_CAUSE_LABELS.unidentified}</BaseBadge>;
  }
}

export function RefundStatusBadge({ status, size }: { status?: RefundStatus; size?: 'sm' | 'md' }) {
  if (!status || status === 'none') {
    return <BaseBadge bg="#1E293B" color="#64748B" size={size}>N/A</BaseBadge>;
  }

  switch (status) {
    case 'refund_confirmed_completed':
      return <BaseBadge bg="#062E20" color="#34D399" border="#059669" size={size}>Refund Confirmed (Verified)</BaseBadge>;
    case 'refund_processing':
      return <BaseBadge bg="#0B2545" color="#60A5FA" border="#1D4ED8" size={size}>Refund Processing</BaseBadge>;
    case 'refund_approved':
      return <BaseBadge bg="#1E1B4B" color="#A78BFA" border="#4338CA" size={size}>Refund Approved</BaseBadge>;
    case 'refund_requested':
      return <BaseBadge bg="#2B1A04" color="#FBBF24" border="#78350F" size={size}>Refund Requested</BaseBadge>;
    case 'refund_failed':
      return <BaseBadge bg="#380B0F" color="#FCA5A5" border="#B91C1C" size={size}>Refund Failed</BaseBadge>;
    case 'refund_unknown':
    default:
      return <BaseBadge bg="#262626" color="#A3A3A3" border="#525252" size={size}>Refund Status Unverified</BaseBadge>;
  }
}

export function PromiseOutcomeBadge({ outcome, size }: { outcome?: PromiseOutcomeStatus; size?: 'sm' | 'md' }) {
  switch (outcome) {
    case 'confirmed_completed':
      return <BaseBadge bg="#062E20" color="#34D399" border="#059669" size={size}>Promise Fulfilled (100%)</BaseBadge>;
    case 'still_pending':
      return <BaseBadge bg="#0B2545" color="#60A5FA" border="#1D4ED8" size={size}>In Flight (Active)</BaseBadge>;
    case 'failed':
      return <BaseBadge bg="#380B0F" color="#FCA5A5" border="#DC2626" size={size}>Overdue / Breached</BaseBadge>;
    case 'unknown_unverified':
    default:
      return <BaseBadge bg="#2B1A04" color="#FBBF24" border="#92400E" size={size}>Pending Verification</BaseBadge>;
  }
}
