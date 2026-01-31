import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { BaseLayout, Navbar, Footer, ToastProvider, FunLoader, Logo, Button } from '@project-bot/ui';
import './index.css';
import './index.css';
import Landing from './pages/Landing';
import { getNavLinks } from './utils/nav';

const UserApp = React.lazy(() => import('userApp/Main'));
const AdminApp = React.lazy(() => import('adminApp/Dashboard'));

const AppNavbar = () => {
  const location = useLocation();
  if (location.pathname === '/') {
    // Different nav for landing if needed, but for now consistent
  }

  const links = getNavLinks(location.pathname);

  return (
    <Navbar
      logo={
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <Logo className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary">
            Project Bot
          </span>
        </Link>
      }
      links={links}
      userMenu={
        <div className="flex items-center gap-4">
          <Link to="/app">
            <Button>Launch App</Button>
          </Link>
        </div>
      }
    />
  );
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <BaseLayout>
          <AppNavbar />
          <div className="flex-1" data-testid="website-host-root">
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
