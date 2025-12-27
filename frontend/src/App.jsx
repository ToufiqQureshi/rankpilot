import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, Outlet } from "react-router-dom";
import { AIAssistantInterface } from "./components/ui/ai-assistant-interface";
import { SignIn } from "./components/ui/sign-in";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";

// 1. Protected Route Wrapper
const ProtectedRoute = ({ isAllowed, redirectPath = '/login', children }) => {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }
  return children ? children : <Outlet />;
};

function App() {
  const navigate = useNavigate();

  // 2. Auth State with Loading
  const [authReady, setAuthReady] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('auth_token');
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("User Parse Error", e);
      return null;
    }
  });

  // 3. Auth Sync across tabs
  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');

      setIsAuthenticated(!!token);
      try {
        setUser(savedUser ? JSON.parse(savedUser) : null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", syncAuth);
    setAuthReady(true); // Mark initial load as done

    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const handleLogin = (email, name) => {
    const userData = { email, name };
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  // 4. Loading State
  if (!authReady) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Route: Login */}
      <Route path="/login" element={
        !isAuthenticated ? <SignIn onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />
      } />

      {/* Protected Routes Wrapper */}
      <Route element={<ProtectedRoute isAllowed={isAuthenticated} />}>

        {/* Main Layout (Shell) */}
        <Route element={<MainLayout />}>

          {/* Dashboard (Default Landing) */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Chat Interface */}
          <Route path="/" element={<AIAssistantInterface user={user} onLogout={handleLogout} />} />
          <Route path="/chat" element={<Navigate to="/" replace />} />
          <Route path="/chat/:chatId" element={<AIAssistantInterface user={user} onLogout={handleLogout} />} />

          {/* <Route path="/brand-voice" element={<BrandVoice />} /> */}
          <Route path="/campaigns" element={<Campaigns />} />

          {/* Placeholders */}
          <Route path="/history" element={<div className="text-white p-10">History Page Coming Soon</div>} />
          <Route path="/settings" element={<div className="text-white p-10">Settings Page Coming Soon</div>} />

        </Route>

      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
