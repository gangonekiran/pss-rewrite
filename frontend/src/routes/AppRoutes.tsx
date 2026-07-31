import { Routes, Route } from 'react-router-dom';
import { MainLayout, AuthLayout } from '../layouts';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import ClientsPage from '../features/clients/pages/ClientsPage';
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
        <Route path="/clients" element={<ClientsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
