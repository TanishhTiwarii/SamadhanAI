import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from './components/customer/CustomerLayout';
import { CustomerLanding } from './components/customer/CustomerLanding';
import { SubmitComplaint } from './components/customer/SubmitComplaint';
import { TrackComplaint } from './components/customer/TrackComplaint';

import { AdminLayout } from './components/admin/AdminLayout';
import { AdminOverview } from './components/admin/AdminOverview';
import { ClusterList } from './components/admin/clusters/ClusterList';
import { ClusterDetail } from './components/admin/clusters/ClusterDetail';
import { AdminInbox } from './components/admin/AdminInbox';
import { AdminComplaintDetail } from './components/admin/AdminComplaintDetail';
import { ResolutionCentre } from './components/admin/resolution/ResolutionCentre';
import { PromiseTracking } from './components/admin/promises/PromiseTracking';
import { AdminNotifications } from './components/admin/AdminNotifications';
import { AnalyticsDashboard } from './components/admin/analytics/AnalyticsDashboard';
import { AuditLogView } from './components/admin/audit/AuditLogView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Portal */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<CustomerLanding />} />
          <Route path="/submit" element={<SubmitComplaint />} />
          <Route path="/track" element={<TrackComplaint />} />
        </Route>

        {/* Operations Intelligence Admin Dashboard */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="clusters" element={<ClusterList />} />
          <Route path="clusters/:id" element={<ClusterDetail />} />
          <Route path="inbox" element={<AdminInbox />} />
          <Route path="complaint/:id" element={<AdminComplaintDetail />} />
          <Route path="resolution" element={<ResolutionCentre />} />
          <Route path="promises" element={<PromiseTracking />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="audit" element={<AuditLogView />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
