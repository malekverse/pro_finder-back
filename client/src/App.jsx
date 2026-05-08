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
import ClaimCompany from './pages/auth/ClaimCompany';

// Pages Client
import Home from './pages/client/Home';
import Marketplace from './pages/client/Marketplace';
import Profile from './pages/client/Profile';
import UserDashboard from './pages/client/UserDashboard';
import ClientPurchases from './pages/client/ClientPurchases';
import ClientDocuments from './pages/client/ClientDocuments';
import CompanyPublicProfile from './pages/client/CompanyPublicProfile';
import ProfessionalPublicProfile from './pages/client/ProfessionalPublicProfile';
import ClientInvoices from './pages/client/ClientInvoices';

// Pages Company
import UserManagement from './pages/company/UserManagement';
import DashboardLayout from './pages/company/DashboardLayout';
import Statistiques from './pages/company/Statistiques';
import Produits from './pages/company/Produits';
import MesServices from './pages/company/MesServices';
import Quotes from './pages/company/Quotes';
import Contracts from './pages/company/Contracts';
import CompanyDocuments from './pages/company/CompanyDocuments';
import Invoices from './pages/company/Invoices';
import CompanyProfile from './components/dashboard/Company/CompanyProfile';
import Publication from './pages/company/Publication';
import Commandes from './pages/company/Commandes';
import Reviews from './pages/company/Reviews';
import Gains from './pages/company/Gains';

// Pages Professional
import ProfessionalDashboardLayout from './pages/professional/ProfessionalDashboardLayout';
import ProfessionalProfile from './pages/professional/ProfessionalProfile';
import ProfessionalStats from './pages/professional/ProfessionalStats';
import ProfessionalProduits from './pages/professional/ProfessionalProduits';
import ProfessionalServices from './pages/professional/ProfessionalServices';
import ProfessionalCommandes from './pages/professional/ProfessionalCommandes';
import ProfessionalDocuments from './pages/professional/ProfessionalDocuments';
import ProfessionalReviews from './pages/professional/ProfessionalReviews';
import ProfessionalInvoices from './pages/professional/ProfessionalInvoices';
import ProfessionalUserManagement from './pages/professional/ProfessionalUserManagement';

// Pages Payment
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentFail from './pages/payment/PaymentFail';

// Pages Admin
import AdminDashboardLayout from "./components/dashboard/admin/AdminDashboardLayout";
import AdminHome from "./components/dashboard/admin/AdminHome";
import AdminGeography from "./components/dashboard/admin/AdminGeography";
import AdminTaxonomy from "./components/dashboard/admin/AdminTaxonomy";
import AdminModeration from "./components/dashboard/admin/AdminModeration";
import AdminUsers from "./components/dashboard/admin/AdminUsers";
import AdminProfile from "./components/dashboard/admin/AdminProfile";
import AiScraperTool from './components/AiScraperTool';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Home />} />
        <Route path="marketplace" element={<Marketplace />} />

        {/* PUBLIQUES */}
        <Route path="auth/login" element={<Login />} />
        <Route path="auth/signup" element={<Signup />} />
        <Route path="claim" element={<ClaimCompany />} />

        <Route path="unauthorized" element={<div>Accès non autorisé</div>} />

        {/* PAIEMENT - PUBLIC & RACINE */}
        <Route path="payment/success" element={<PaymentSuccess />} />
        <Route path="payment/fail" element={<PaymentFail />} />

        {/* CLIENT - Profil & Espace Sécurisé */}
        <Route
          path="user"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={[ROLES.USER, ROLES.COMPANY, ROLES.PROFESSIONAL, "admin"]} />
            </RequireAuth>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="purchases" element={<ClientPurchases />} />
          <Route path="documents" element={<ClientDocuments />} />
          <Route path="invoices" element={<ClientInvoices />} />
        </Route>

        {/* PROFIL PUBLIC */}
        <Route path="user/company/:companyId" element={<CompanyPublicProfile />} />
        <Route path="user/professional/:professionalId" element={<ProfessionalPublicProfile />} />

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
          <Route path="dashboard" element={<AdminHome />} />
          <Route path="geography" element={<AdminGeography />} />
          <Route path="taxonomy" element={<AdminTaxonomy />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="scraper" element={<AiScraperTool />} />
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
          <Route path="stats" element={<Statistiques />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="documents" element={<CompanyDocuments />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="produits" element={<Produits />} />
          <Route path="services" element={<MesServices />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="profile" element={<CompanyProfile />} />
          <Route path="posts" element={<Publication />} />
          <Route path="gains" element={<Gains />} />
        </Route>

        {/* PROFESSIONAL */}
        <Route
          path="professional"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={[ROLES.PROFESSIONAL]}>
                <ProfessionalDashboardLayout />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<ProfessionalStats />} />
          <Route path="stats" element={<ProfessionalStats />} />
          <Route path="produits" element={<ProfessionalProduits />} />
          <Route path="services" element={<ProfessionalServices />} />
          <Route path="commandes" element={<ProfessionalCommandes />} />
          <Route path="documents" element={<ProfessionalDocuments />} />
          <Route path="invoices" element={<ProfessionalInvoices />} />
          <Route path="posts" element={<Publication />} />
          <Route path="profile" element={<ProfessionalProfile />} />
          <Route path="reviews" element={<ProfessionalReviews />} />
          <Route path="users" element={<ProfessionalUserManagement />} />
          <Route path="gains" element={<Gains />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;