import {
  Navigate,
  Route,
  Routes,
  BrowserRouter,
} from 'react-router-dom';

import './App.css';

import RootLayout from './components/RootLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

import Cookies from 'js-cookie';
import RequireAuth from './components/auth/RequireAuth';

function App() {
  const accessToken = Cookies.get('accessToken');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          {/* Home */}
          <Route index element={<h1>Authentication App</h1>} />

          {/* AUTH ROUTES */}
          <Route path="auth/login" element={<Login />} />
          <Route path="auth/signup" element={<Signup />} />

          {/* PROTECTED ROUTES */}
          <Route
            path="dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />

          <Route
            path="profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
