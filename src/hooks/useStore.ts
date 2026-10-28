import { useSyncExternalStore, useCallback } from 'react';
import { store } from '../data/store';
import type { Complaint, ComplaintCluster, Notification, AuditLogEntry } from '../types';

function subscribe(cb: () => void) {
  return store.subscribe(cb);
}

export function useComplaints(): Complaint[] {
  return useSyncExternalStore(subscribe, () => store.getComplaints());
}

export function useComplaint(id: string): Complaint | undefined {
  return useSyncExternalStore(subscribe, () => store.getComplaint(id));
}

export function useClusters(): ComplaintCluster[] {
  return useSyncExternalStore(subscribe, () => store.getClusters());
}

export function useCluster(id: string): ComplaintCluster | undefined {
  return useSyncExternalStore(subscribe, () => store.getCluster(id));
}

export function useNotifications(): Notification[] {
  return useSyncExternalStore(subscribe, () => store.getNotifications());
}

export function useAuditLogs(): AuditLogEntry[] {
  return useSyncExternalStore(subscribe, () => store.getAuditLogs());
}

export function useStoreActions() {
  return {
    addComplaint: useCallback(store.addComplaint.bind(store), []),
    updateStatus: useCallback(store.updateStatus.bind(store), []),
    addNote: useCallback(store.addNote.bind(store), []),
    getComplaintByRef: useCallback(store.getComplaintByRef.bind(store), []),
    updateClusterStatus: useCallback(store.updateClusterStatus.bind(store), []),
    assignClusterOwner: useCallback(store.assignClusterOwner.bind(store), []),
    updateClusterRootCause: useCallback(store.updateClusterRootCause.bind(store), []),
    addClusterNote: useCallback(store.addClusterNote.bind(store), []),
    proposeClusterAction: useCallback(store.proposeClusterAction.bind(store), []),
    approveClusterAction: useCallback(store.approveClusterAction.bind(store), []),
    rejectClusterAction: useCallback(store.rejectClusterAction.bind(store), []),
    executeSimulatedRefundBatch: useCallback(store.executeSimulatedRefundBatch.bind(store), []),
    runPromiseVerification: useCallback(store.runPromiseVerification.bind(store), []),
    markNotificationRead: useCallback(store.markNotificationRead.bind(store), []),
    markAllNotificationsRead: useCallback(store.markAllNotificationsRead.bind(store), []),
  };
}
