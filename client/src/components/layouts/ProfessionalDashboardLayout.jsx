import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logOut } from "../../redux/features/auth/authSlice";
import { apiSlice } from "../../redux/api/apiSlice";
import {
  BarChart3,
  User,
  LogOut,
  Star,
  Bell,
  Newspaper,
  Package,
  Wrench,
  FileText,
  Calendar,
  Users,
  Wallet,
  FileSpreadsheet
} from "lucide-react";
import { useGetProfessionalProfileQuery } from "../../redux/features/professional/professionalApiSlice";
import { toImageUrl } from "../../utils/imageUtils";
import NotificationBell from "../../components/dashboard/company/NotificationBell";

import styles from "../../styles/Dashboard.module.css";
const ProfessionalDashboardLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: professional } = useGetProfessionalProfileQuery(undefined, {
    pollingInterval: 3000,
  });

  const authUser = useSelector((state) => state.auth.user);
  const permissions = authUser?.permissions || [];
  const hasPermission = (perm) => permissions.includes(perm) || permissions.includes("all_access");

  const mainMenu = [
    { path: "/professional/stats", label: "Dashboard",   icon: <BarChart3 size={20} />, show: true },
    { path: "/professional/produits", label: "Mes Produits", icon: <Package size={20} />, show: hasPermission("manage_catalog") },
    { path: "/professional/services", label: "Mes Services", icon: <Wrench size={20} />, show: hasPermission("manage_catalog") },
    { path: "/professional/commandes", label: "Commandes & RDV", icon: <Calendar size={20} />, show: hasPermission("manage_sales") },
    { path: "/professional/documents", label: "Documents", icon: <FileText size={20} />, show: hasPermission("manage_documents") },
    { path: "/professional/invoices", label: "Mes Factures", icon: <FileSpreadsheet size={20} />, show: hasPermission("manage_documents") },
    { path: "/professional/posts", label: "Mes Publications", icon: <Newspaper size={20} />, show: hasPermission("manage_posts") },
    { path: "/professional/reviews", label: "Avis clients", icon: <Star size={20} />, show: true },
    { path: "/professional/gains", label: "Mes gains", icon: <Wallet size={20} />, show: hasPermission("manage_sales") },
    { path: "/professional/users", label: "Gestion des accès", icon: <Users size={20} />, show: hasPermission("manage_access") },
  ];

  const handleLogout = () => {
    dispatch(logOut());
    dispatch(apiSlice.util.resetApiState());
    navigate("/auth/login");
  };

  const handleProfileClick = () => {
    navigate("/professional/profile");
  };

  return (
    <div className={styles.dashboard}>
      <nav className={styles.sidebar}>
        {/* PROFESSIONAL PROFILE */}
        <div
          className={styles.companyProfile}
          onClick={handleProfileClick}
          style={{ cursor: "pointer" }}
        >
          <img
            src={toImageUrl(professional?.photoProfessional) || "https://via.placeholder.com/60"}
            alt="photo"
            className={styles.companyLogo}
          />
          <div className={styles.companyInfo}>
            <p className={styles.companyName}>
              {professional?.fullName || "Professionnel"}
            </p>
            <span className={styles.viewProfile}>Voir profil</span>
          </div>
        </div>

        {/* MENU PRINCIPAL */}
        <p className={styles.menuLabel}>Menu principal</p>

        <ul className={styles.menu}>
          {mainMenu
            .filter((item) => item.show)
            .map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    isActive ? styles.activeLink : styles.link
                  }
                >
                  <span className={styles.icon}>{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
        </ul>

        {/* LOGOUT */}
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </nav>

      <main className={styles.content}>
        <div className={styles.topBar}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <span style={{ fontWeight: "700", color: "#1e293b" }}>
              Tableau de bord Professionnel
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <NotificationBell type="Professional" />
            </div>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
};

export default ProfessionalDashboardLayout;
