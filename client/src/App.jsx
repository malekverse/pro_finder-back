import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import AdminRoles from "./components/dashboard/admin/AdminRoles";
import RootLayout from './components/RootLayout';
import RequireRole from "./components/auth/RequireRole";
import RequireAuth from './components/auth/RequireAuth';
import { ROLES } from "./constants/roles";

// Pages Auth
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Pages Client
import Home from './pages/client/Home';
import Profile from './pages/client/Profile';
import UserDashboard from './pages/client/UserDashboard';
import ClientPurchases from './pages/client/ClientPurchases';
import ClientDocuments from './pages/client/ClientDocuments';
import CompanyPublicProfile from './pages/client/CompanyPublicProfile';

// Pages Company
import UserManagement from './pages/company/UserManagement';
import DashboardLayout from './pages/company/DashboardLayout';
import Statistiques from './pages/company/Statistiques';
import Produits from './pages/company/Produits';
import MesServices from './pages/company/MesServices';
import Quotes from './pages/company/Quotes';
import Contracts from './pages/company/Contracts';
import CompanyDocuments from './pages/company/CompanyDocuments';
import CompanyProfile from './components/dashboard/Company/CompanyProfile';
import Publication from './pages/company/Publication';
import Commandes from './pages/company/Commandes';
import Reviews from './pages/company/Reviews';

// Pages Admin
import AdminDashboardLayout from "./components/dashboard/admin/AdminDashboardLayout";
import AdminHome from "./components/dashboard/admin/AdminHome";
import AdminGeography from "./components/dashboard/admin/AdminGeography";
import AdminTaxonomy from "./components/dashboard/admin/AdminTaxonomy";
import AdminModeration from "./components/dashboard/admin/AdminModeration";
import AdminUsers from "./components/dashboard/admin/AdminUsers";
import AdminProfile from "./components/dashboard/admin/AdminProfile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Home />} />

        {/* PUBLIQUES */}
        <Route path="auth/login"  element={<Login />} />
        <Route path="auth/signup" element={<Signup />} />

        <Route path="unauthorized" element={<div>Accès non autorisé</div>} />

        {/* CLIENT - Profil */}
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
        <Route
          path="purchases"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={[ROLES.USER]}>
                <ClientPurchases />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="documents"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={[ROLES.USER]}>
                <ClientDocuments />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* CLIENT - Dashboard / Feed */}
        <Route
          path="user/dashboard"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={[ROLES.USER]}>
                <UserDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="user/company/:companyId"
          element={<CompanyPublicProfile />}
        />

        {/* ADMIN */}
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
          <Route index element={<AdminHome />} />
          <Route path="dashboard"  element={<AdminHome />} />
          <Route path="geography"  element={<AdminGeography />} />
          <Route path="taxonomy"   element={<AdminTaxonomy />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="users"      element={<AdminUsers />} />
          <Route path="profile"    element={<AdminProfile />} />
          <Route path="roles"      element={<AdminRoles />} />
        </Route>

        {/* COMPANY & STAFF */}
        <Route
          path="company"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={[ROLES.COMPANY, "admin", "ANY_TEAM_MEMBER"]}>
                <DashboardLayout />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<Statistiques />} />
          <Route path="stats"     element={<Statistiques />} />
          <Route path="quotes"    element={<Quotes />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="documents" element={<CompanyDocuments />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="reviews"   element={<Reviews />} />
          <Route path="produits"  element={<Produits />} />
          <Route path="services"  element={<MesServices />} />
          <Route path="users"     element={<UserManagement />} />
          <Route path="profile"   element={<CompanyProfile />} />
          <Route path="posts"     element={<Publication />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;