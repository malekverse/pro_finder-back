import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import AdminRoles from "./components/dashboard/admin/AdminRoles";
// Layout et Auth
import RootLayout from './components/RootLayout';
import RequireRole from "./components/auth/RequireRole";
import RequireAuth from './components/auth/RequireAuth';
import { ROLES } from "./constants/roles";

// Pages Auth
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Pages Client & Company
import Profile from './pages/client/Profile';
import UserManagement from './pages/company/UserManagement';
import DashboardLayout from './pages/company/DashboardLayout';
import Statistiques from './pages/company/Statistiques';
import Produits from './pages/company/Produits';
import CompanyProfile from './components/dashboard/Company/CompanyProfile';

// Pages Admin
import AdminDashboardLayout from "./components/dashboard/admin/AdminDashboardLayout";
import AdminHome from "./components/dashboard/admin/AdminHome";
import AdminGeography from "./components/dashboard/admin/AdminGeography";
import AdminTaxonomy from "./components/dashboard/admin/AdminTaxonomy";
import AdminModeration from "./components/dashboard/admin/AdminModeration";
import AdminUsers from "./components/dashboard/admin/AdminUsers";
import AdminProfile from "./components/dashboard/admin/AdminProfile"; // Assure-toi de l'import

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Redirection par défaut vers le login */}
        <Route index element={<Navigate to="/auth/login" replace />} />

        {/* ROUTES PUBLIQUES */}
        <Route path="auth/login" element={<Login />} />
        <Route path="auth/signup" element={<Signup />} />

        {/* ROUTES PROTEGEES - CLIENT (Utilisateur standard) */}
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

        {/* ROUTES PROTEGEES - ADMIN PANEL */}
        <Route
          path="admin"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={["admin"]}>
                <AdminDashboardLayout />
              </RequireRole>
            </RequireAuth>
          }
        >
          {/* Routes enfants du Dashboard Admin */}
          <Route index element={<AdminHome />} />
          <Route path="dashboard" element={<AdminHome />} />
          <Route path="geography" element={<AdminGeography />} />
          <Route path="taxonomy" element={<AdminTaxonomy />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="profile" element={<AdminProfile />} /> 
        <Route path="roles" element={<AdminRoles />} />
        </Route>

        {/* ROUTES PROTEGEES - DASHBOARD COMPANY & STAFF */}
        <Route 
          path="company" 
          element={
            <RequireAuth>
              <RequireRole allowedRoles={[ROLES.COMPANY, "admin", "assistant_manager", "viewer"]}>
                <DashboardLayout />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<Statistiques />} /> 
          <Route path="stats" element={<Statistiques />} />
          <Route path="produits" element={<Produits />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="profile" element={<CompanyProfile />} />
        </Route>

        {/* FALLBACK : Si aucune route ne correspond, retour au début */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;