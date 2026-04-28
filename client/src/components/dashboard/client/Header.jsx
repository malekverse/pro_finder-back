import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronDown, User, ShoppingBag, Building2, LogOut, Home, 
  FileText, ShoppingCart, Newspaper, Package, Wrench, ShoppingBasket,
  CreditCard
} from "lucide-react";
import NotificationBell from "../company/NotificationBell";
import GlobalSearchBar from "./CompanySearchBar";
import { toImageUrl } from "../../../utils/imageUtils";

const Header = ({ 
  user, onProfileClick, onLogout, onCompanyClick, onHomeClick, 
  onCartClick, cartItemsCount = 0, activeTab, setActiveTab 
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabs = [
    { id: "feed", label: "Fil d'actualité", icon: <Newspaper size={18} /> },
    { id: "services", label: "Services", icon: <Wrench size={18} /> },
    { id: "products", label: "Produits", icon: <Package size={18} /> },
    { id: "societes", label: "Sociétés", icon: <Building2 size={18} /> },
    { id: "pros", label: "Professionnels", icon: <User size={18} /> },
  ];

  return (
    <div style={h.bar}>
      {/* Section Logo*/}
      <div className="brand-logo" style={{ ...h.brand, cursor: 'pointer' }} onClick={() => navigate("/user/dashboard")}>
        <div style={h.brandDot} />
        <span style={h.brandName}>ProFinder</span>
      </div>

      {/* Zone Centrale : Barre de recherche + Tabs */}
      <div style={h.centerArea}>
        <div style={h.searchWrapper}>
          <GlobalSearchBar />
        </div>
        
        {setActiveTab && (
          <div style={h.tabsContainer}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={activeTab === tab.id ? h.tabActive : h.tab}
                className="nav-tab"
              >
                {tab.icon}
                <span style={h.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section Droite : Panier, Notifs, Profil */}
      <div style={h.rightSection}>
        <div style={h.actionIcons}>
          {/* Bouton Panier */}
          <button
            onClick={onCartClick}
            className="action-icon-btn"
            style={h.actionBtn}
          >
            <ShoppingCart size={22} />
            {cartItemsCount > 0 && (
              <span style={h.badge}>
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Composant de cloche de notifications */}
          <div className="action-icon-btn" style={h.actionBtn}>
            <NotificationBell type="User" />
          </div>
        </div>

        <div style={h.divider} />

        {/* Profil avec Dropdown */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            className="profile-btn"
            style={h.profileBtn}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {user?.avatarUrl
              ? <img src={toImageUrl(user.avatarUrl)} alt="avatar" style={h.avatar} />
              : <div style={h.avatarFallback}>{initials}</div>}
            <ChevronDown size={14} color="#64748b" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>

          {menuOpen && (
            <div style={h.dropdown}>
              <div style={h.dropdownHeader}>
                <span style={h.dropName}>{user?.fullName || "Mon compte"}</span>
                <span style={h.dropEmail}>{user?.email || "Client"}</span>
              </div>
              <div style={h.dropDivider} />
              
              <button style={h.dropItem} onClick={() => { setMenuOpen(false); onProfileClick(); }}>
                <User size={16} /> Mon profil
              </button>
              
              <button style={h.dropItem} onClick={() => { setMenuOpen(false); navigate("/user/purchases"); }}>
                <CreditCard size={16} /> Mes achats
              </button>
              
              <button style={h.dropItem} onClick={() => { setMenuOpen(false); navigate("/user/documents"); }}>
                <FileText size={16} /> Mes documents
              </button>

              <button style={h.dropItem} onClick={() => { setMenuOpen(false); navigate("/user/invoices"); }}>
                <CreditCard size={16} /> Mes factures
              </button>
              
              <div style={h.dropDivider} />
              
              <button style={{ ...h.dropItem, color: "#dc2626" }} onClick={() => { setMenuOpen(false); onLogout(); }}>
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .nav-tab {
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .nav-tab:hover {
          background: rgba(30, 58, 95, 0.05);
          color: #1E3A5F !important;
        }
        .action-icon-btn {
          transition: all 0.2s ease;
          border-radius: 12px;
        }
        .action-icon-btn:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }
        .profile-btn:hover {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
        }
      `}</style>
    </div>
  );
};

const h = {
  bar: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    height: 70, background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 30px",
  },
  brand: { display: "flex", alignItems: "center", gap: 10, transition: "transform 0.2s ease" },
  brandDot: { width: 10, height: 10, borderRadius: "50%", background: "linear-gradient(135deg, #1E3A5F 0%, #3b82f6 100%)" },
  brandName: { fontWeight: 800, fontSize: 20, color: "#1E3A5F", letterSpacing: "-0.5px" },
  centerArea: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    flex: 1,
    justifyContent: "center",
    padding: "0 20px",
  },
  searchWrapper: {
    width: "100%",
    maxWidth: 320,
  },
  tabsContainer: {
    display: "flex",
    gap: "4px",
    background: "#f8fafc",
    padding: "4px",
    borderRadius: "12px",
    border: "1px solid #f1f5f9",
  },
  tab: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 12px", border: "none", background: "none",
    color: "#64748b", fontWeight: "600", fontSize: "13px",
    cursor: "pointer", borderRadius: "8px",
  },
  tabActive: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 12px", border: "none", background: "#fff",
    color: "#1E3A5F", fontWeight: "700", fontSize: "13px",
    cursor: "pointer", borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  tabLabel: { whiteSpace: "nowrap" },
  rightSection: { display: "flex", alignItems: "center", gap: "16px" },
  actionIcons: { display: "flex", gap: "8px" },
  actionBtn: {
    background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
    padding: '10px',
  },
  badge: {
    position: 'absolute', top: '4px', right: '4px', background: '#ef4444',
    color: '#fff', fontSize: '9px', fontWeight: '800', width: '16px', height: '16px',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid #fff'
  },
  divider: { width: "1px", height: "24px", background: "#e2e8f0" },
  profileBtn: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "none", border: "1px solid transparent", cursor: "pointer",
    padding: "4px", borderRadius: "50% 12px 12px 50%",
    transition: "all 0.2s ease",
  },
  avatar: { width: 34, height: 34, borderRadius: "50%", objectFit: "cover" },
  avatarFallback: {
    width: 34, height: 34, borderRadius: "50%",
    background: "#1E3A5F", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: "12px"
  },
  dropdown: {
    position: "absolute", right: 0, top: "120%",
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    zIndex: 1000, minWidth: "220px", overflow: "hidden",
    padding: "8px",
  },
  dropdownHeader: { padding: "12px 16px", display: "flex", flexDirection: "column" },
  dropName: { fontSize: "14px", fontWeight: "700", color: "#1e293b" },
  dropEmail: { fontSize: "12px", color: "#64748b" },
  dropItem: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "10px 16px", width: "100%",
    background: "none", border: "none", cursor: "pointer",
    color: "#475569", fontSize: "13px", fontWeight: "600", textAlign: "left",
    borderRadius: "10px", transition: "all 0.2s",
  },
  dropDivider: { height: "1px", background: "#f1f5f9", margin: "4px 0" },
};

export default Header;