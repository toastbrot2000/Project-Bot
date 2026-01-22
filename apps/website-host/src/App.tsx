import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

const UserApp = React.lazy(() => import('userApp/Main'));
const AdminApp = React.lazy(() => import('adminApp/Dashboard'));

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <header className="bg-gray-800 text-white p-4">
      <nav className="flex gap-4">
        <Link to="/" className="hover:text-blue-300">Home</Link>
        <Link to="/app" className="hover:text-blue-300">User App</Link>
        <Link to="/admin" className="hover:text-blue-300">Admin App</Link>
      </nav>
    </header>
    <main className="flex-grow p-4">
      {children}
    </main>
    <footer className="bg-gray-100 p-4 text-center">
      Host Footer
    </footer>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={
              <div>
                <h1 className="text-2xl font-bold">Welcome to the Platform</h1>
                <p>Select an app from the menu.</p>
              </div>
            } />
            <Route path="/app/*" element={<UserApp />} />
            <Route path="/admin/*" element={<AdminApp />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
