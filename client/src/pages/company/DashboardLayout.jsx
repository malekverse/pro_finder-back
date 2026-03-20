import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { 
  BarChart3, 
  LayoutDashboard, 
  Package, 
  Wrench,
  FileText, 
  Users,
  LogOut 
} from "lucide-react";
import { useGetCompanyProfileQuery } from "../../redux/features/company/companyApiSlice";

import styles from "../../styles/Dashboard.module.css";

const DashboardLayout = () => {

  const navigate = useNavigate(); 
  const dispatch = useDispatch();

  const { data: company } = useGetCompanyProfileQuery();

  const mainMenu = [
    { path: "/company/stats", label: "Statistiques", icon: <BarChart3 size={20} /> },
    { path: "/company/posts", label: "Publications", icon: <LayoutDashboard size={20} /> },
    { path: "/company/documents", label: "Documents", icon: <FileText size={20} /> },
  ];

  const managementMenu = [
    { path: "/company/products", label: "Mes Produits", icon: <Package size={20} /> },
    { path: "/company/services", label: "Mes Services", icon: <Wrench size={20} /> },
    { path: "/company/users", label: "Gestion des accès", icon: <Users size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/auth/login"); 
  };

  const handleProfileClick = () => {
    navigate("/company/profile");
  };

  return (
    <div className={styles.dashboard}>
      
      <nav className={styles.sidebar}>

        {/* COMPANY PROFILE */}
        <div 
          className={styles.companyProfile}
          onClick={handleProfileClick}
          style={{cursor:"pointer"}}
        >
          <img
            src={
              company?.logoUrl
                ? `http://localhost:5000/${company.logoUrl}`
                : "https://via.placeholder.com/60"
            }
            alt="logo"
            className={styles.companyLogo}
          />

          <div className={styles.companyInfo}>
            <p className={styles.companyName}>
              {company?.companyName || "Company"}
            </p>
            <span className={styles.viewProfile}>
              Voir profil
            </span>
          </div>
        </div>


        {/* MENU PRINCIPAL */}
        <p className={styles.menuLabel}>Menu principal</p>

        <ul className={styles.menu}>
          {mainMenu.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? styles.activeLink : styles.link}
              >
                <span className={styles.icon}>{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>


        {/* GESTION */}
        <p className={styles.menuLabel}>Gestion</p>

        <ul className={styles.menu}>
          {managementMenu.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? styles.activeLink : styles.link}
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
          <span>Dashboard Fournisseur</span>
        </div>

        <Outlet />
      </main>

    </div>
  );
};

export default DashboardLayout;