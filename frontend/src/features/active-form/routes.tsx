import ActiveFormAddPage from './pages/ActiveFormAddPage';
import ActiveFormEditPage from './pages/ActiveFormEditPage';

export const activeFormRoutes = [
  { path: '/active-form', element: <ActiveFormAddPage /> },
  { path: '/active-form/new/:childId', element: <ActiveFormAddPage /> },
  { path: '/active-form/edit/:childId/:id', element: <ActiveFormEditPage /> },
];
