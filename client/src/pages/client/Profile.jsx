import { 
  useGetProfileQuery, 
  useUpdateProfileMutation, 
  useChangePasswordMutation 
} from "../../redux/features/profileApiSlice";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logOut } from "../../redux/features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { apiSlice } from "../../redux/app/api/apiSlice";
import {
  LayoutDashboard, LogOut, Camera, User, Phone, Mail,
  Lock, CheckCircle, AlertCircle, ChevronRight, Shield,
  Pencil, X, Save, Building2, ShoppingBag, Key, Loader2
} from "lucide-react";

const SERVER_URL = "http://localhost:5000";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token) || localStorage.getItem("accessToken");
  const roles = authUser?.roles || [];
  const isOwner = roles.includes("owner");
  const isCompany = roles.includes("company");
  const isTeamMember = authUser?.companyId && roles.length > 1; // User + un autre rôle
  const canAccessDashboard = isOwner || isCompany || isTeamMember;

  const { data: profile, isLoading, refetch } = useGetProfileQuery(undefined, {
    skip: !token,
    pollingInterval: 3000,
    refetchOnMountOrArgChange: true,
  });

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const [activeTab, setActiveTab] = useState("profile"); // "profile" or "security"
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", avatarUrl: null });
  
  const [securityForm, setSecurityForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [feedback, setFeedback] = useState({ type: null, message: "" }); // type: "success" | "error"
  const fileInputRef = useRef(null);

  useEffect(() => {
    const source = profile || authUser;
    if (source) {
      setForm({
        fullName: source.fullName || source.companyName || source.name || "",
        phone: source.phone || "",
        email: source.email || "",
        avatarUrl: null,
      });
      const rawAvatar = source.avatarUrl || source.logoUrl || null;
      if (rawAvatar) {
        setPreviewUrl(rawAvatar.startsWith("data:image") ? rawAvatar : `${SERVER_URL}/${rawAvatar}`);
      } else {
        setPreviewUrl(null);
      }
    }
  }, [profile, authUser]);

  const handleLogout = () => {
    dispatch(logOut());
    dispatch(apiSlice.util.resetApiState());
    navigate("/login");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFeedback({ type: "error", message: "Type non autorisé. Utilisez jpg, png ou webp." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Image trop lourde (max 5 MB)." });
      return;
    }
    setFeedback({ type: null, message: "" });
    setForm((prev) => ({ ...prev, avatarUrl: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: null, message: "" });
    if (!form.fullName.trim()) {
      setFeedback({ type: "error", message: "Le nom complet est requis." });
      return;
    }
    try {
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("phone", form.phone);
      if (form.avatarUrl instanceof File) formData.append("avatar", form.avatarUrl);
      await updateProfile(formData).unwrap();
      setFeedback({ type: "success", message: "Profil mis à jour avec succès !" });
      setEditMode(false);
      refetch();
      setTimeout(() => setFeedback({ type: null, message: "" }), 4000);
    } catch (err) {
      setFeedback({ type: "error", message: err.data?.message || "Erreur lors de la mise à jour." });
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: null, message: "" });

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setFeedback({ type: "error", message: "Les nouveaux mots de passe ne correspondent pas." });
      return;
    }

    // Validation mot de passe (8+ chars, 1 lettre, 1 chiffre, 1 spécial)
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!pwdRegex.test(securityForm.newPassword)) {
      setFeedback({ 
        type: "error", 
        message: "Le mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un caractère spécial." 
      });
      return;
    }

    try {
      await changePassword({
        oldPassword: securityForm.oldPassword,
        newPassword: securityForm.newPassword,
      }).unwrap();

      setFeedback({ type: "success", message: "Mot de passe mis à jour avec succès !" });
      setSecurityForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setFeedback({ type: null, message: "" }), 4000);
    } catch (err) {
      setFeedback({ 
        type: "error", 
        message: err.data?.message || "Erreur lors du changement de mot de passe." 
      });
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFeedback({ type: null, message: "" });
    // Restore original data
    const source = profile || authUser;
    if (source) {
      setForm({
        fullName: source.fullName || source.companyName || source.name || "",
        phone: source.phone || "",
        email: source.email || "",
        avatarUrl: null,
      });
      const rawAvatar = source.avatarUrl || source.logoUrl || null;
      if (rawAvatar) {
        setPreviewUrl(rawAvatar.startsWith("data:image") ? rawAvatar : `${SERVER_URL}/${rawAvatar}`);
      }
    }
  };

  const initials = form.fullName
    ? form.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  if (isLoading) {
    return (
      <div style={s.fullPage}>
        <div style={s.loadingBox}>
          <div style={s.spinner} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Récupération de vos informations...</p>
        </div>
        <style>{css}</style>
      </div>
    );
  }

  return (
    <div style={s.fullPage}>
      <style>{css}</style>

      <div style={s.pageGrid}>
        {/* ── Left sidebar ── */}
        <aside style={s.sidebar}>
          <div 
            style={{ ...s.sidebarLogo, cursor: 'pointer' }} 
            onClick={() => navigate("/user/dashboard")}
          >
            <span style={s.logoMark}>◆</span>
            <span style={s.logoText}>Pro Finder</span>
          </div>

          <div style={s.sidebarContent}>
            <p style={s.sidebarLabel}>Navigation</p>

            <button style={s.sideNavItem} onClick={() => navigate("/user/dashboard")}>
              <LayoutDashboard size={17} color="#64748b" />
              <span>Fil d'actualité</span>
            </button>

            <button 
              style={{ ...s.sideNavItem, background: activeTab === 'profile' ? '#fff' : 'transparent' }} 
              onClick={() => { setActiveTab('profile'); setEditMode(false); }}
            >
              <User size={17} color={activeTab === 'profile' ? "#1E3A5F" : "#64748b"} />
              <span style={{ color: activeTab === 'profile' ? "#1E3A5F" : "#334155", fontWeight: activeTab === 'profile' ? 700 : 500 }}>Mon Profil</span>
            </button>

            <button 
              style={{ ...s.sideNavItem, background: activeTab === 'security' ? '#fff' : 'transparent' }} 
              onClick={() => { setActiveTab('security'); setEditMode(false); }}
            >
              <Shield size={17} color={activeTab === 'security' ? "#1E3A5F" : "#64748b"} />
              <span style={{ color: activeTab === 'security' ? "#1E3A5F" : "#334155", fontWeight: activeTab === 'security' ? 700 : 500 }}>Sécurité</span>
              <ChevronRight size={14} color="#cbd5e1" style={{ marginLeft: "auto" }} />
            </button>

            {canAccessDashboard && (
              <button style={s.sideNavItem} onClick={() => navigate("/company/stats")}>
                <LayoutDashboard size={17} color="#64748b" />
                <span>Dashboard entreprise</span>
                <ChevronRight size={14} color="#cbd5e1" style={{ marginLeft: "auto" }} />
              </button>
            )}
          </div>

          <button style={s.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </aside>

        {/* ── Main content ── */}
        <main style={s.main}>

          {/* Page title bar */}
          <div style={s.titleBar}>
            <div>
              <h1 style={s.pageTitle}>{activeTab === 'profile' ? "Mon profil" : "Sécurité du compte"}</h1>
              <p style={s.pageSubtitle}>
                {activeTab === 'profile' 
                  ? "Gérez vos informations personnelles" 
                  : "Mettez à jour votre mot de passe pour protéger votre compte"
                }
              </p>
            </div>
            {activeTab === 'profile' && (
              !editMode ? (
                <button style={s.editBtn} onClick={() => setEditMode(true)}>
                  <Pencil size={15} />
                  Modifier
                </button>
              ) : (
                <button style={s.cancelBtn} onClick={handleCancelEdit}>
                  <X size={15} />
                  Annuler
                </button>
              )
            )}
          </div>

          {/* Feedback toast */}
          {feedback.type && (
            <div style={{ ...s.feedback, ...(feedback.type === "success" ? s.feedbackSuccess : s.feedbackError) }}>
              {feedback.type === "success"
                ? <CheckCircle size={16} />
                : <AlertCircle size={16} />
              }
              {feedback.message}
            </div>
          )}

          {activeTab === 'profile' ? (
            <>
              {/* ── Avatar card ── */}
              <div style={s.avatarCard}>
                <div style={s.avatarSection}>
                  <div style={s.avatarWrap}>
                    {previewUrl
                      ? <img src={previewUrl} alt="avatar" style={s.avatar} />
                      : <div style={s.avatarInitials}>{initials}</div>
                    }
                    {editMode && (
                      <button
                        style={s.avatarEditBtn}
                        onClick={() => fileInputRef.current?.click()}
                        title="Changer la photo"
                      >
                        <Camera size={14} color="#fff" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleAvatarChange}
                      style={{ display: "none" }}
                    />
                  </div>

                  <div style={s.avatarInfo}>
                    <span style={s.avatarName}>{form.fullName || "Utilisateur"}</span>
                    <span style={s.avatarEmail}>{form.email}</span>
                    {roles.length > 0 && (
                      <div style={s.rolesRow}>
                        {roles.map((role) => (
                          <span key={role} style={s.roleChip}>{role}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {editMode && (
                  <p style={s.avatarHint}>
                    <Camera size={12} /> Cliquez sur l'avatar pour changer votre photo
                  </p>
                )}
              </div>

              {/* ── Form card ── */}
              <form onSubmit={handleSubmit} style={s.formCard}>
                <h2 style={s.formTitle}>Informations personnelles</h2>

                <div style={s.formGrid}>
                  {/* Full name */}
                  <div style={s.fieldGroup}>
                    <label style={s.label}>
                      <User size={13} /> Nom complet
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="Ex: Jean Dupont"
                        style={s.input}
                      />
                    ) : (
                      <div style={s.readonlyValue}>{form.fullName || <span style={s.empty}>Non renseigné</span>}</div>
                    )}
                  </div>

                  {/* Email — always readonly */}
                  <div style={s.fieldGroup}>
                    <label style={s.label}>
                      <Mail size={13} /> Email
                      <span style={s.lockedBadge}><Lock size={10} /> Non modifiable</span>
                    </label>
                    <div style={{ ...s.readonlyValue, ...s.readonlyLocked }}>{form.email}</div>
                  </div>

                  {/* Phone */}
                  <div style={s.fieldGroup}>
                    <label style={s.label}>
                      <Phone size={13} /> Téléphone
                    </label>
                    {editMode ? (
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+216 00 000 000"
                        style={s.input}
                      />
                    ) : (
                      <div style={s.readonlyValue}>{form.phone || <span style={s.empty}>Non renseigné</span>}</div>
                    )}
                  </div>
                </div>

                {editMode && (
                  <div style={s.formActions}>
                    <button type="submit" style={s.saveBtn} disabled={isUpdating}>
                      {isUpdating ? (
                        <><div style={s.btnSpinner} /> Enregistrement...</>
                      ) : (
                        <><Save size={15} /> Enregistrer les modifications</>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </>
          ) : (
            /* ── Security Tab Content ── */
            <div style={s.formCard}>
              <h2 style={s.formTitle}>Changer le mot de passe</h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Assurez-vous d'utiliser un mot de passe fort pour protéger votre compte.
              </p>

              <form onSubmit={handleSecuritySubmit}>
                <div style={{ ...s.fieldGroup, marginBottom: '1.5rem' }}>
                  <label style={s.label}>Mot de passe actuel</label>
                  <input
                    type="password"
                    value={securityForm.oldPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, oldPassword: e.target.value })}
                    required
                    style={s.input}
                    placeholder="Entrez votre mot de passe actuel"
                  />
                </div>

                <div style={{ ...s.fieldGroup, marginBottom: '1.5rem' }}>
                  <label style={s.label}>Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    required
                    style={s.input}
                    placeholder="8 caractères minimum"
                  />
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', lineHeight: '1.4' }}>
                    Condition : 8 caractères minimum, incluant au moins une lettre, un chiffre et un symbole spécial (@$!%*#?&).
                  </p>
                </div>

                <div style={{ ...s.fieldGroup, marginBottom: '2rem' }}>
                  <label style={s.label}>Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    required
                    style={s.input}
                    placeholder="Répétez le nouveau mot de passe"
                  />
                </div>

                <button 
                  type="submit" 
                  style={{ ...s.saveBtn, width: '100%', justifyContent: 'center' }} 
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <><Loader2 className="animate-spin" size={18} /> Mise à jour...</>
                  ) : (
                    <><Key size={16} /> Mettre à jour le mot de passe</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── Purchases & Company Dashboard buttons (Only visible on Profile tab for better UX) ── */}
          {activeTab === 'profile' && (
            <div style={s.dangerZone}>
              <div style={s.dangerRow}>
                <div>
                  <p style={s.dangerTitle}>Accès rapides</p>
                  <p style={s.dangerDesc}>Gérez vos transactions ou votre entreprise.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => navigate("/purchases")}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #1E3A5F',
                      backgroundColor: 'white',
                      color: '#1E3A5F',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <ShoppingBag size={16} /> Mes Achats
                  </button>

                  {canAccessDashboard && (
                    <button 
                      onClick={() => navigate("/company/stats")}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#1E3A5F',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Building2 size={16} /> Dashboard Pro
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

const css = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const s = {
  fullPage: {
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  loadingBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "100vh", gap: 16,
  },
  spinner: {
    width: 32, height: 32, borderRadius: "50%",
    border: "3px solid #e2e8f0", borderTopColor: "#1E3A5F",
    animation: "spin 0.8s linear infinite",
  },
  pageGrid: {
    display: "flex",
    minHeight: "100vh",
    maxWidth: 1100,
    margin: "0 auto",
    width: "100%",
    padding: "0 16px",
    gap: 28,
    boxSizing: "border-box",
  },

  // ── Sidebar ──
  sidebar: {
    width: 240,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    padding: "32px 0",
  },
  sidebarLogo: {
    display: "flex", alignItems: "center", gap: 8,
    marginBottom: 36, paddingLeft: 4,
  },
  logoMark: { fontSize: 20, color: "#2563eb" },
  logoText: { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  sidebarContent: { flex: 1 },
  sidebarLabel: {
    fontSize: 11, fontWeight: 700, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.08em",
    marginBottom: 8, paddingLeft: 4,
  },
  sideNavItem: {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "10px 12px",
    background: "none", border: "none", borderRadius: 10,
    cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#334155",
    textAlign: "left", transition: "background 0.15s",
    marginBottom: 2,
  },
  logoutBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 12px",
    background: "none", border: "none", borderRadius: 10,
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#ef4444",
    textAlign: "left", marginTop: "auto",
  },

  // ── Main ──
  main: {
    flex: 1,
    padding: "32px 0 64px",
    maxWidth: 680,
  },
  titleBar: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    marginBottom: 24,
  },
  pageTitle: { margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" },
  pageSubtitle: { margin: "4px 0 0", fontSize: 14, color: "#64748b" },
  editBtn: {
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "9px 18px",
    background: "#1E3A5F", color: "#fff",
    border: "none", borderRadius: 10,
    cursor: "pointer", fontSize: 13, fontWeight: 700,
    boxShadow: "0 2px 8px rgba(30,58,95,0.25)",
    transition: "all 0.15s",
  },
  cancelBtn: {
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "9px 18px",
    background: "#fff", color: "#64748b",
    border: "1.5px solid #e2e8f0", borderRadius: 10,
    cursor: "pointer", fontSize: 13, fontWeight: 700,
  },

  feedback: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 16px", borderRadius: 12, marginBottom: 20,
    fontSize: 13, fontWeight: 600, animation: "slideDown 0.25s ease",
  },
  feedbackSuccess: { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" },
  feedbackError: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },

  // ── Avatar card ──
  avatarCard: {
    background: "#fff",
    border: "1px solid #e5ebf2",
    borderRadius: 16,
    padding: "24px",
    marginBottom: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  avatarSection: { display: "flex", alignItems: "center", gap: 20 },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: {
    width: 84, height: 84, borderRadius: 20,
    objectFit: "cover", border: "3px solid #e2e8f0",
  },
  avatarInitials: {
    width: 84, height: 84, borderRadius: 20,
    background: "linear-gradient(135deg, #1E3A5F, #2563eb)",
    color: "#fff", fontSize: 28, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "3px solid #e2e8f0",
  },
  avatarEditBtn: {
    position: "absolute", bottom: -4, right: -4,
    width: 28, height: 28, borderRadius: "50%",
    background: "#2563eb", border: "2.5px solid #fff",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  },
  avatarInfo: { display: "flex", flexDirection: "column", gap: 3 },
  avatarName: { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  avatarEmail: { fontSize: 13, color: "#64748b" },
  rolesRow: { display: "flex", gap: 6, marginTop: 4 },
  roleChip: {
    fontSize: 11, fontWeight: 700, color: "#2563eb",
    background: "#eff6ff", border: "1px solid #bfdbfe",
    borderRadius: 20, padding: "2px 10px",
    textTransform: "capitalize",
  },
  avatarHint: {
    display: "flex", alignItems: "center", gap: 5,
    margin: "14px 0 0", fontSize: 12, color: "#94a3b8",
  },

  // ── Form card ──
  formCard: {
    background: "#fff",
    border: "1px solid #e5ebf2",
    borderRadius: 16,
    padding: "24px",
    marginBottom: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  formTitle: { margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0f172a" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 11, fontWeight: 700, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.06em",
  },
  lockedBadge: {
    marginLeft: "auto", display: "flex", alignItems: "center", gap: 3,
    fontSize: 10, fontWeight: 600, color: "#94a3b8",
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 20, padding: "2px 8px",
  },
  input: {
    padding: "10px 14px",
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, color: "#0f172a",
    outline: "none", transition: "border-color 0.15s",
    fontFamily: "inherit",
  },
  readonlyValue: {
    padding: "10px 14px",
    fontSize: 14, color: "#0f172a", fontWeight: 500,
  },
  readonlyLocked: { color: "#94a3b8" },
  empty: { color: "#cbd5e1", fontStyle: "italic" },
  formActions: { marginTop: 24 },
  saveBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "11px 26px",
    background: "linear-gradient(135deg, #1E3A5F, #2563eb)",
    color: "#fff", border: "none", borderRadius: 12,
    cursor: "pointer", fontSize: 14, fontWeight: 700,
    boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
    transition: "opacity 0.15s",
  },
  btnSpinner: {
    width: 14, height: 14, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "#fff",
    animation: "spin 0.7s linear infinite",
  },

  // ── Danger zone ──
  dangerZone: {
    background: "#fff",
    border: "1px solid #fee2e2",
    borderRadius: 16,
    padding: "20px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  dangerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 },
  dangerTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" },
  dangerDesc: { margin: "3px 0 0", fontSize: 13, color: "#64748b" },
  dangerBtn: {
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "9px 18px",
    background: "#fef2f2", color: "#dc2626",
    border: "1.5px solid #fecaca", borderRadius: 10,
    cursor: "pointer", fontSize: 13, fontWeight: 700,
    whiteSpace: "nowrap", flexShrink: 0,
  },
};

export default Profile;