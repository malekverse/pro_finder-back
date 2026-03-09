import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';

// Layout et Auth
import RootLayout from './components/RootLayout';
import RequireRole from "./components/auth/RequireRole";
import RequireAuth from './components/auth/RequireAuth';
import { ROLES } from "./constants/roles";
import Cookies from 'js-cookie';

// Pages Auth
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Pages Client & Company
import Profile from './pages/client/Profile';
import UserManagement from './pages/company/UserManagement'; // Import renommé
import DashboardLayout from './pages/company/DashboardLayout'; // Import du nouveau Layout
import Statistiques from './pages/company/Statistiques';       // À créer si vide
import Produits from './pages/company/Produits';               // À créer si vide

function App() {
  const accessToken = Cookies.get('accessToken');

  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Home */}
        <Route index element={<h1>Authentication App</h1>} />

        {/* AUTH ROUTES */}
        <Route path="auth/login" element={<Login />} />
        <Route path="auth/signup" element={<Signup />} />

        {/* PROTECTED ROUTES - USER */}
        <Route
          path="profile"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={[ROLES.USER]}>
                <Profile />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* NOUVELLE STRUCTURE DASHBOARD COMPANY (Plus de ReferenceError) */}
        <Route 
          path="company" 
          element={
            <RequireAuth>
              <RequireRole allowedRoles={[ROLES.COMPANY]}>
                <DashboardLayout />
              </RequireRole>
            </RequireAuth>
          }
        >
          {/* Sous-routes qui s'afficheront dans l'Outlet de DashboardLayout */}
          <Route index element={<Statistiques />} /> 
          <Route path="stats" element={<Statistiques />} />
          <Route path="produits" element={<Produits />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;