import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User, ShoppingBag, Building2, LogOut, Home, FileText, ShoppingCart } from "lucide-react";
import NotificationBell from "../company/NotificationBell";
import GlobalSearchBar from "./CompanySearchBar";
import { toImageUrl } from "../../../utils/imageUtils";

const Header = ({ user, onProfileClick, onLogout, onCompanyClick, onHomeClick, onCartClick, cartItemsCount = 0 }) => {
  const navigate = useNavigate();
  // État pour gérer l'ouverture/fermeture du menu déroulant du profil
  const [menuOpen, setMenuOpen] = useState(false);

  // Génération des initiales si l'utilisateur n'a pas de photo
  const initials = user?.fullName
    ? user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div style={h.bar}>
      {/* Section Logo*/}
      <div className="brand-logo" style={{ ...h.brand, cursor: 'pointer' }} onClick={() => navigate("/user/dashboard")}>
        <div style={h.brandDot} />
        <span style={h.brandName}>ProFinder</span>
      </div>

      {/* Zone Centrale : Barre de recherche */}
      <div style={h.centerArea}>
        <div style={h.searchWrapper}>
          <GlobalSearchBar />
        </div>
        <div style={h.nav}>
          {/* Bouton Accueil */}
          <button
            className="nav-btn"
            style={{ ...h.navBtn, color: "#1E3A5F", borderBottom: "2px solid #1E3A5F" }}
            onClick={onHomeClick}
          >
            <Home size={18} /><span style={h.navLabel}>Accueil</span>
          </button>

          {/* Bouton Documents (Accès direct) */}
          <button
            className="nav-btn"
            style={h.navBtn}
            onClick={() => navigate("/documents")}
          >
            <FileText size={18} /><span style={h.navLabel}>Documents</span>
          </button>

          {/* Bouton Mes Achats (Accès direct) */}
          <button
            className="nav-btn"
            style={h.navBtn}
            onClick={() => navigate("/purchases")}
          >
            <ShoppingBag size={18} /><span style={h.navLabel}>Achats</span>
          </button>

          {/* Bouton Espace Fournisseur (Accès direct) */}
          {onCompanyClick && (
            <button
              className="nav-btn"
              style={h.navBtn}
              onClick={onCompanyClick}
            >
              <Building2 size={18} /><span style={h.navLabel}>Entreprise</span>
            </button>
          )}

          {/* Bouton Panier */}
          <button
            onClick={onCartClick}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A5F',
              padding: '8px'
            }}
          >
            <ShoppingCart size={22} />
            {cartItemsCount > 0 && (
              <span style={{
                position: 'absolute', top: '0px', right: '0px', background: '#ef4444',
                color: '#fff', fontSize: '9px', fontWeight: '800', width: '16px', height: '16px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fff'
              }}>
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Composant de cloche de notifications */}
          <NotificationBell type="User" />
        </div>
      </div>

      {/* Section Profil et Menu Déroulant */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Accès direct profil (au clic sur l'image/nom) */}
        <div
          className="profile-btn"
          style={{ ...h.profileBtn, padding: '6px 4px' }}
          onClick={onProfileClick}
        >
          {user?.avatarUrl
            ? <img src={toImageUrl(user.avatarUrl)} alt="avatar" style={h.avatar} />
            : <div style={h.avatarFallback}>{initials}</div>}

          <div style={h.profileInfo}>
            <span style={h.profileName}>{user?.fullName || "Mon profil"}</span>
            <span style={h.profileSub}>Voir mon profil</span>
          </div>
        </div>

        {/* Bouton pour le menu déroulant (actions secondaires) */}
        <div style={{ position: "relative" }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 5px' }}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <ChevronDown size={16} color="#94a3b8"
              style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {/* Menu Déroulant (Dropdown) */}
          {menuOpen && (
            <>
              {/* Overlay invisible pour fermer le menu en cliquant n'importe où ailleurs */}
              <div style={h.overlay} onClick={() => setMenuOpen(false)} />

              <div style={h.dropdown}>
                {/* Bouton de déconnexion avec style d'alerte (rouge) */}
                <button style={{ ...h.dropItem, color: "#dc2626" }} onClick={() => { setMenuOpen(false); onLogout(); }}>
                  <LogOut size={15} color="#dc2626" /> Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        .nav-btn:hover { background: rgba(241, 245, 249, 0.8) !important; color: #1E3A5F !important; transform: translateY(-2px); }
        .brand-logo:hover { transform: scale(1.02); }
        .profile-btn:hover { background: rgba(241, 245, 249, 0.8) !important; border-color: #cbd5e1 !important; }
      `}</style>
    </div>
  );
};

// Styles CSS-in-JS avec une esthétique premium
const h = {
  bar: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    height: 70, background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 40px",
  },
  brand: { display: "flex", alignItems: "center", gap: 10, transition: "transform 0.2s ease" },
  brandDot: { width: 12, height: 12, borderRadius: "50%", background: "linear-gradient(135deg, #1E3A5F 0%, #3b82f6 100%)", boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)" },
  brandName: { fontWeight: 900, fontSize: 22, color: "#1E3A5F", letterSpacing: "-0.8px" },
  centerArea: {
    display: "flex",
    alignItems: "center",
    gap: 40,
    flex: 1,
    justifyContent: "center",
    marginLeft: 20,
    marginRight: 20,
  },
  searchWrapper: {
    width: "100%",
    maxWidth: 450,
  },
  nav: { display: "flex", gap: 8 },
  navBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    background: "none", border: "none", cursor: "pointer",
    color: "#64748b", padding: "10px 20px", borderRadius: "12px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
  },
  navLabel: { fontSize: 12, fontWeight: "600" },
  profileBtn: {
    display: "flex", alignItems: "center", gap: 12,
    background: "rgba(241, 245, 249, 0.5)", border: "1px solid #f1f5f9", cursor: "pointer",
    padding: "6px 14px", borderRadius: 14,
    transition: "all 0.2s ease",
  },
  avatar: { width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  avatarFallback: {
    width: 38, height: 38, borderRadius: "50%",
    background: "linear-gradient(135deg, #1E3A5F 0%, #0f172a 100%)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  profileInfo: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  profileName: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  profileSub: { fontSize: 11, color: "#64748b", fontWeight: "500" },
  overlay: { position: "fixed", inset: 0, zIndex: 10 },
  dropdown: {
    position: "absolute", right: 0, top: 55,
    background: "#fff", border: "1px solid #f1f5f9",
    borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    zIndex: 11, minWidth: 220, overflow: "hidden",
    padding: "8px",
  },
  dropItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 16px", width: "100%",
    background: "none", border: "none", cursor: "pointer",
    color: "#334155", fontSize: 14, fontWeight: "600", textAlign: "left",
    borderRadius: "10px", transition: "all 0.2s",
  },
  dropDivider: { height: 1, background: "#f1f5f9", margin: "8px 0" },
};

export default Header;