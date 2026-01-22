import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { BaseLayout, Navbar, Footer, ToastProvider, FunLoader } from '@project-bot/ui';
// import { ReactComponent as Logo } from '@project-bot/ui/src/assets/logo.svg'; 
import './index.css';
import Landing from './pages/Landing';

const UserApp = React.lazy(() => import('userApp/Main'));
const AdminApp = React.lazy(() => import('adminApp/Dashboard'));

const AppNavbar = () => {
  const location = useLocation();
  if (location.pathname === '/') {
    // Different nav for landing if needed, but for now consistent
  }

  const links = [
    { label: 'Home', href: '/', active: location.pathname === '/' },
    { label: 'User App', href: '/app', active: location.pathname.startsWith('/app') },
    { label: 'Admin', href: '/admin', active: location.pathname.startsWith('/admin') },
  ];

  return (
    <Navbar
      logo={<span className="text-xl font-bold tracking-tight text-primary">Project Bot</span>}
      links={links}
    />
  );
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <BaseLayout>
          <AppNavbar />
          <div className="flex-1">
            <Suspense fallback={<FunLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/app/*" element={<UserApp />} />
                <Route path="/admin/*" element={<AdminApp />} />
              </Routes>
            </Suspense>
          </div>
          <Footer />
        </BaseLayout>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
