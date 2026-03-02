import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
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

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<RootLayout />}>

        {/* Home */}
        <Route index element={<h1>Authentication App</h1>} />

        {/* AUTH ROUTES */}
        <Route path="auth">
          <Route
            path="login"
            element={<Login />}
          />

          <Route
            path="signup"
            element={<Signup />}
          />
        </Route>

        {/* PROTECTED ROUTES */}

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

export default App;
