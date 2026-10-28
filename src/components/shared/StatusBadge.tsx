import type { ComplaintStatus, ComplaintPriority } from '../../types';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../types';

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  open: 'background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;',
  in_progress: 'background: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE;',
  under_review: 'background: #E0E7FF; color: #3730A3; border: 1px solid #C7D2FE;',
  resolved: 'background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0;',
  escalated: 'background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA;',
  closed: 'background: #F3F4F6; color: #374151; border: 1px solid #E5E7EB;',
};

const PRIORITY_STYLES: Record<ComplaintPriority, string> = {
  low: 'background: #F3F4F6; color: #6B7280; border: 1px solid #E5E7EB;',
  medium: 'background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;',
  high: 'background: #FFEDD5; color: #9A3412; border: 1px solid #FED7AA;',
  critical: 'background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA;',
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        ...parseCss(STATUS_STYLES[status]),
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ComplaintPriority }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        ...parseCss(PRIORITY_STYLES[priority]),
      }}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function parseCss(css: string): React.CSSProperties {
  const result: Record<string, string> = {};
  css.split(';').forEach((part) => {
    const [key, val] = part.split(':').map((s) => s.trim());
    if (key && val) {
      const camel = key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      result[camel] = val;
    }
  });
  return result as React.CSSProperties;
}
