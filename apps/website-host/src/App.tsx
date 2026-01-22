import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import './index.css';

const UserApp = React.lazy(() => import('userApp/Main'));
const AdminApp = React.lazy(() => import('adminApp/Dashboard'));

const NavBar = () => {
  const location = useLocation();
  if (location.pathname === '/') return null; // Hide nav on landing page

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-800">Project Bot</Link>
        <nav className="flex gap-6">
          <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">Home</Link>
          <Link to="/app" className="text-gray-600 hover:text-blue-600 font-medium">User App</Link>
          <Link to="/admin" className="text-gray-600 hover:text-blue-600 font-medium">Admin</Link>
        </nav>
      </div>
    </header>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans text-gray-900 bg-gray-50">
        <NavBar />
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app/*" element={<UserApp />} />
            <Route path="/admin/*" element={<AdminApp />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
