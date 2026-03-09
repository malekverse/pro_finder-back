import { Outlet, NavLink } from "react-router-dom";
import { 
  BarChart3, 
  LayoutDashboard, 
  Package, 
  FileText, 
  Eye, 
  Star, 
  Users,
  LogOut 
} from "lucide-react"; // Icônes pro
import styles from "../../styles/Dashboard.module.css";

const DashboardLayout = () => {
  const menuItems = [
    { path: "/company/stats", label: "Statistiques", icon: <BarChart3 size={20} /> },
    { path: "/company/posts", label: "Publications", icon: <LayoutDashboard size={20} /> },
    { path: "/company/services", label: "Services / Produits", icon: <Package size={20} /> },
    { path: "/company/documents", label: "Documents", icon: <FileText size={20} /> },
    { path: "/company/visibility", label: "Visibilité", icon: <Eye size={20} /> },
    { path: "/company/premium", label: "Options Premium", icon: <Star size={20} /> },
    { path: "/company/users", label: "Gestion des accès", icon: <Users size={20} /> },
  ];

  return (
    <div className={styles.dashboard}>
      {/* SIDEBAR */}
      <nav className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}></div> {/* Petit carré bleu de votre logo */}
          <h2 className={styles.sidebarTitle}>PRO FINDER</h2>
        </div>
        
        <p className={styles.menuLabel}>Menu Principal</p>

        <ul className={styles.menu}>
          {menuItems.map((item) => (
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

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn}>
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </nav>

      {/* CONTENU */}
      <main className={styles.content}>
        <div className={styles.topBar}>
          <span>Dashboard Fournisseur</span>
          <div className={styles.userProfile}>M</div>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;