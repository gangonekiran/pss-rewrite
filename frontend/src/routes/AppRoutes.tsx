import { Routes, Route } from 'react-router-dom';
import { MainLayout, AuthLayout } from '../layouts';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import ClientPage from '../features/client/pages/ClientPage';
import LoginPage from './LoginPage';
import NotFoundPage from './NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
