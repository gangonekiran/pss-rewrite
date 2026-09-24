import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">      

      <div className="flex-1 flex flex-col">
        <Header pathname={location.pathname} />

        <main className="flex-1 bg-gray-100">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}