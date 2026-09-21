import { Routes, Route } from 'react-router-dom';
import { MainLayout, AuthLayout } from '../layouts';

import ClientPage from '../features/client/pages/ClientPage';
import LoginPage from './LoginPage';
import NotFoundPage from './NotFoundPage';

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
         <Route path="/" element={<ClientPage />} />     
        <Route path="/clients" element={<ClientPage />} />        
      </Route>

      {/* Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}