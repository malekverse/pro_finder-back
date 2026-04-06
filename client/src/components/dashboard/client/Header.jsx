import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User, ShoppingBag, Building2, LogOut, Home } from "lucide-react";
import NotificationBell from "../company/NotificationBell";
import CompanySearchBar from "./CompanySearchBar";
import { toImageUrl } from "../../../utils/imageUtils";

const Header = ({ user, onProfileClick, onLogout, onCompanyClick, onHomeClick }) => {
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
          {/* Composant de cloche de notifications */}
          <NotificationBell />
        </div>
      </div>

      {/* Section Profil et Menu Déroulant */}
      <div style={{ position: "relative" }}>
        {/* Bouton déclencheur du menu profil */}
        <button style={h.profileBtn} onClick={() => setMenuOpen((v) => !v)}>
          {/* Affichage de l'image via toImageUrl ou des initiales par défaut */}
          {user?.avatarUrl
            ? <img src={toImageUrl(user.avatarUrl)} alt="avatar" style={h.avatar} />
            : <div style={h.avatarFallback}>{initials}</div>}
          
          <div style={h.profileInfo}>
            <span style={h.profileName}>{user?.fullName || "Mon profil"}</span>
            <span style={h.profileSub}>Mon compte</span>
          </div>
          {/* Icône flèche avec rotation animée selon l'état du menu */}
          <ChevronDown size={14} color="#94a3b8"
            style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        {/* Menu Déroulant (Dropdown) */}
        {menuOpen && (
          <>
            {/* Overlay invisible pour fermer le menu en cliquant n'importe où ailleurs */}
            <div style={h.overlay} onClick={() => setMenuOpen(false)} />
            
            <div style={h.dropdown}>
              {/* Lien vers le profil personnel */}
              <button style={h.dropItem} onClick={() => { setMenuOpen(false); onProfileClick(); }}>
                <User size={15} color="#1E3A5F" /> Mon profil
              </button>
              
              {/* Lien vers l'historique des achats */}
              <button style={h.dropItem} onClick={() => { setMenuOpen(false); navigate("/purchases"); }}>
                <ShoppingBag size={15} color="#1E3A5F" /> Mes Achats
              </button>
              
              {/* Espace Fournisseur (affiché conditionnellement) */}
              {onCompanyClick && (
                <button style={h.dropItem} onClick={() => { setMenuOpen(false); onCompanyClick(); }}>
                  <Building2 size={15} color="#1E3A5F" /> Espace Fournisseur
                </button>
              )}

              {/* Ligne de séparation */}
              <div style={h.dropDivider} />
              
              {/* Bouton de déconnexion avec style d'alerte (rouge) */}
              <button style={{ ...h.dropItem, color: "#dc2626" }} onClick={() => { setMenuOpen(false); onLogout(); }}>
                <LogOut size={15} color="#dc2626" /> Déconnexion
              </button>
            </div>
          </>
        )}
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