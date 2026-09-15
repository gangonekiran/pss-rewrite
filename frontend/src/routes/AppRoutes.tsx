import { Routes, Route } from 'react-router-dom';
import { MainLayout, AuthLayout } from '../layouts';

import ClientPage from '../features/client/pages/ClientPage';

import ComingSoon from '../features/coming_soon/pages/ComingSoonPage';

import LoginPage from './LoginPage';
import NotFoundPage from './NotFoundPage';
import { ActiveFormAddPage, ActiveFormEditPage } from '../features/active-form';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Authentication */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Main Application */}
      <Route element={<MainLayout />}>
        {/* Implemented */}
        <Route path="/" element={<ComingSoon title="Dashboard" />}/>
        <Route path="/clients" element={<ClientPage />} />    

        <Route path="/active-form" element={<ActiveFormAddPage />} />
        <Route path="/active-form/edit/:childId/:id" element={<ActiveFormEditPage />} />
        <Route path="/active-form/new/:childId" element={<ActiveFormAddPage />} />

        {/* Under Development */}
        <Route
          path="/nopr-forms"
          element={<ComingSoon title="NOPR Forms" />}
        />

        <Route
          path="/referral-forms"
          element={<ComingSoon title="Referral Forms" />}
        />

        <Route
          path="/cos-forms"
          element={<ComingSoon title="COS Forms" />}
        />

        <Route
          path="/insurance"
          element={<ComingSoon title="Insurance" />}
        />

        <Route
          path="/reports"
          element={<ComingSoon title="Reports" />}
        />

        <Route
          path="/users"
          element={<ComingSoon title="Users" />}
        />

        <Route
          path="/settings"
          element={<ComingSoon title="Settings" />}
        />
      </Route>

      {/* Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}