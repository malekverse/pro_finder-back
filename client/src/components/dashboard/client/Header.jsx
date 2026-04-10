import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User, ShoppingBag, Building2, LogOut, Home, FileText, ShoppingCart } from "lucide-react";
import NotificationBell from "../company/NotificationBell";
import CompanySearchBar from "./CompanySearchBar";
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
      <div style={{ ...h.brand, cursor: 'pointer' }} onClick={() => navigate("/user/dashboard")}>
        <div style={h.brandDot} />
        <span style={h.brandName}>ProFinder</span>
      </div>

      {/* Zone Centrale : Barre de recherche */}
      <div style={h.centerArea}>
        <div style={h.searchWrapper}>
          <CompanySearchBar />
        </div>
        <div style={h.nav}>
          {/* Bouton Accueil */}
          <button 
            style={{ ...h.navBtn, color: "#1E3A5F", borderBottom: "2px solid #1E3A5F" }}
            onClick={onHomeClick}
          >
            <Home size={18} /><span style={h.navLabel}>Accueil</span>
          </button>

          {/* Bouton Documents (Accès direct) */}
          <button 
            style={h.navBtn}
            onClick={() => navigate("/documents")}
          >
            <FileText size={18} /><span style={h.navLabel}>Documents</span>
          </button>

          {/* Bouton Mes Achats (Accès direct) */}
          <button 
            style={h.navBtn}
            onClick={() => navigate("/purchases")}
          >
            <ShoppingBag size={18} /><span style={h.navLabel}>Achats</span>
          </button>

          {/* Bouton Espace Fournisseur (Accès direct) */}
          {onCompanyClick && (
            <button 
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
    </div>
  );
};

// Styles CSS-in-JS
const h = {
  bar: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    height: 60, background: "#fff",
    borderBottom: "1px solid #e9eef5",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px",
  },
  brand: { display: "flex", alignItems: "center", gap: 8 },
  brandDot: { width: 10, height: 10, borderRadius: "50%", background: "#1E3A5F" },
  brandName: { fontWeight: 800, fontSize: 18, color: "#1E3A5F", letterSpacing: "-0.5px" },
  centerArea: {
    display: "flex",
    alignItems: "center",
    gap: 32,
    flex: 1,
    justifyContent: "center",
    marginLeft: 40,
    marginRight: 40,
  },
  searchWrapper: {
    width: "100%",
    maxWidth: 400,
  },
  nav: { display: "flex", gap: 4 },
  navBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    background: "none", border: "none", cursor: "pointer",
    color: "#64748b", padding: "8px 16px", borderBottom: "2px solid transparent",
    transition: "all 0.15s",
  },
  navLabel: { fontSize: 11, fontWeight: 500 },
  profileBtn: {
    display: "flex", alignItems: "center", gap: 10,
    background: "none", border: "none", cursor: "pointer",
    padding: "6px 10px", borderRadius: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: "50%", objectFit: "cover" },
  avatarFallback: {
    width: 36, height: 36, borderRadius: "50%",
    background: "#1E3A5F", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 13,
  },
  profileInfo: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  profileName: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  profileSub: { fontSize: 11, color: "#94a3b8" },
  overlay: { position: "fixed", inset: 0, zIndex: 10 },
  dropdown: {
    position: "absolute", right: 0, top: 50,
    background: "#fff", border: "1px solid #e9eef5",
    borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    zIndex: 11, minWidth: 200, overflow: "hidden",
  },
  dropItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "11px 16px", width: "100%",
    background: "none", border: "none", cursor: "pointer",
    color: "#334155", fontSize: 14, fontWeight: 500, textAlign: "left",
  },
  dropDivider: { height: 1, background: "#f1f5f9" },
};

export default Header;