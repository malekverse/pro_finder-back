import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Globe, Tags, Eye, Users, LayoutDashboard, 
  LogOut, UserCog, ShieldCheck, ChevronRight 
} from "lucide-react";
import { useGetProfileQuery } from "../../../redux/features/profileApiSlice"; // ✅ AJOUT

import styles from "../../../styles/dashboardAdmin.module.css";

const SERVER_URL = "http://localhost:5000";

const AdminDashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Charger le profil admin
  const { data: profile } = useGetProfileQuery(undefined, { pollingInterval: 3000 });

  const adminMenu = [
    { path: "/admin/dashboard", label: "Dashboard",     icon: <LayoutDashboard size={20}/> },
    { path: "/admin/geography", label: "Géographie",    icon: <Globe size={20}/> },
    { path: "/admin/taxonomy",  label: "Taxonomie",     icon: <Tags size={20}/> },
    { path: "/admin/moderation",label: "Modération",    icon: <Eye size={20}/> },
    { path: "/admin/roles",     label: "Rôles",         icon: <ShieldCheck size={20}/> },
  ];

  const currentPathLabel = adminMenu.find(item => item.path === location.pathname)?.label || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/auth/login");
  };

  return (
    <div className={styles.dashboard}>

      {/* SIDEBAR */}
      <nav className={styles.sidebar}>

        {/* SECTION PROFIL */}
        <div className={styles.userSection}>

          {/* ✅ Afficher la vraie photo ou l'icône par défaut */}
          {profile?.avatarUrl ? (
            <img
              src={`${SERVER_URL}/${profile.avatarUrl}`}
              alt="avatar"
              style={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
            />
          ) : (
            <div className={styles.avatarCircle}>
              <UserCog size={24} color="#24416b" />
            </div>
          )}

          <div className={styles.userInfoText}>
            <h3 className={styles.userName}>
              {profile?.fullName || "Administrateur"}
            </h3>
            <Link to="/admin/profile" className={styles.viewProfileLink}>
              Voir profil
            </Link>
          </div>
        </div>

        <div className={styles.menuDivider}>MENU PRINCIPAL</div>

        <ul className={styles.menuList}>
          {adminMenu.map((item) => (
            <li key={item.path} className={styles.menuItem}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.activeLink}` : styles.link
                }
              >
                <div className={styles.linkContent}>
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.linkLabel}>{item.label}</span>
                </div>
                {location.pathname === item.path && (
                  <ChevronRight size={16} className={styles.activeArrow} />
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* FOOTER SIDEBAR */}
        <div className={styles.sidebarFooter}>
          <button className={styles.btnLogout} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>

      </nav>

      {/* ZONE DE CONTENU PRINCIPAL */}
      <main className={styles.content}>
        <header className={styles.topBar}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadGray}>Pages</span> / 
            <span className={styles.breadCurrent}> {currentPathLabel}</span>
          </div>
          <div className={styles.adminStatus}>
            <span className={styles.onlineBadge}></span>
            <strong>{profile?.fullName || "Administrateur"}</strong>
          </div>
        </header>

        <section className={styles.pageBody}>
          <Outlet />
        </section>
      </main>

    </div>
  );
};

export default AdminDashboardLayout;