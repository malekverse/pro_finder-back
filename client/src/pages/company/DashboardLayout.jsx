import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logOut } from "../../redux/features/auth/authSlice";
import { apiSlice } from "../../redux/app/api/apiSlice";
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
  const authUser = useSelector((state) => state.auth.user);
  const companyId = authUser?.companyId;

  console.log("DashboardLayout AuthUser:", authUser);
  console.log("DashboardLayout CompanyId:", companyId);

  const { data: company, refetch } = useGetCompanyProfileQuery(companyId, {
    skip: !companyId
  });

  const mainMenu = [
    { path: "/company/stats", label: "Dashboard", icon: <BarChart3 size={20} /> },
    { path: "/company/posts", label: "Publications", icon: <LayoutDashboard size={20} /> },
    { path: "/company/documents", label: "Documents", icon: <FileText size={20} /> },
  ];

  const managementMenu = [
    { path: "/company/produits", label: "Mes Produits", icon: <Package size={20} /> },
    { path: "/company/services", label: "Mes Services", icon: <Wrench size={20} /> },
    { path: "/company/users", label: "Gestion des accès", icon: <Users size={20} /> },
  ];

  const handleLogout = () => {
    dispatch(logOut());
    dispatch(apiSlice.util.resetApiState());
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
              ? company.logoUrl.startsWith('http') 
              ? company.logoUrl                          // ✅ Cloudinary → tel quel
              : `http://localhost:5000/${company.logoUrl}` // chemin local → préfixe
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