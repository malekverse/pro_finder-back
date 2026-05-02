import { 
  useGetProfileQuery, 
  useUpdateProfileMutation, 
  useChangePasswordMutation 
} from "../../redux/features/profileApiSlice";
import { useGetMyFollowsQuery, useGetMyManagedCompaniesQuery } from "../../redux/features/company/companyApiSlice";
import { useSwitchCompanyMutation } from "../../redux/features/auth/authApiSlice";
import { setCredentials } from "../../redux/features/auth/authSlice";
import Cookies from 'js-cookie';
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logOut } from "../../redux/features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { apiSlice } from "../../redux/app/api/apiSlice";
import {
  LayoutDashboard, LogOut, Camera, User, Phone, Mail,
  Lock, CheckCircle, AlertCircle, ChevronRight, Shield,
  Pencil, X, Save, Building2, ShoppingBag, Key, Loader2, Info, MapPin, ArrowLeft, Bell
} from "lucide-react";
import NotificationBell from "../../components/dashboard/company/NotificationBell";
import { toImageUrl } from "../../utils/imageUtils";

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

  const { data: followedCompanies = [] } = useGetMyFollowsQuery(undefined, { skip: !token });
  const { data: managedCompanies = [] } = useGetMyManagedCompaniesQuery(undefined, { skip: !token });

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [switchCompany, { isLoading: isSwitching }] = useSwitchCompanyMutation();

  const [activeTab, setActiveTab] = useState("profile"); // "profile", "follows", "security"
  const [editMode, setEditMode] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
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
        setPreviewUrl(toImageUrl(rawAvatar));
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

  const handleSwitchCompany = async (companyId) => {
    try {
      const response = await switchCompany(companyId).unwrap();
      const newToken = response.accessToken;
      
      // Mettre à jour le stockage pour la persistance
      localStorage.setItem("accessToken", newToken);
      Cookies.set('accessToken', newToken, { expires: 7 });

      // Reset cache pour charger les données de la nouvelle entreprise
      dispatch(apiSlice.util.resetApiState());

      // Décoder le token pour obtenir les infos utilisateur
      const base64Url = newToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      dispatch(setCredentials({ 
        account: payload.UserInfo, 
        accessToken: newToken 
      }));

      setShowCompanyModal(false);
      navigate("/company/stats");
    } catch (err) {
      setFeedback({ type: "error", message: "Erreur lors du changement d'entreprise." });
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFeedback({ type: null, message: "" });
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

      {/* Top Navigation Bar */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e4e6eb",
        padding: "8px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000
      }}>
        <button style={s.backBtn} onClick={() => navigate("/user/dashboard")}>
          <ArrowLeft size={18} /> Retour au fil d'actualité
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <NotificationBell />
          {canAccessDashboard && (
            <button 
              style={{ ...s.fbEditBtn, background: "#1877f2", color: "#fff", padding: "8px 16px", fontSize: "14px" }} 
              onClick={() => setShowCompanyModal(true)}
            >
              <LayoutDashboard size={16} /> Espace Pro
            </button>
          )}
          <button 
            style={{ ...s.fbEditBtn, background: "#f0f2f5" }} 
            onClick={handleLogout}
            title="Déconnexion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div style={s.fbHeader}>
        <div style={s.coverWrap}>
          <div style={s.coverImage}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1E3A5F 0%, #3b82f6 100%)' }} />
          </div>
          <div style={s.profileHeaderContent}>
            <div style={s.avatarContainer}>
              <div style={s.avatarCircle}>
                {previewUrl ? (
                  <img src={previewUrl} alt="" style={s.avatarImg} />
                ) : (
                  <div style={s.avatarFallbackLarge}>{initials}</div>
                )}
                {editMode && (
                  <button style={s.avatarEditIcon} onClick={() => fileInputRef.current.click()}>
                    <Camera size={20} color="white" />
                  </button>
                )}
              </div>
              <div style={s.nameArea}>
                <h1 style={s.fbName}>{form.fullName || "Utilisateur"}</h1>
                <p style={s.fbSub}>{followedCompanies.length} abonnements • {roles.length} rôles</p>
                <div style={s.rolesList}>
                  {roles.map((r) => (
                    <span key={r} style={s.fbRoleChip}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={s.headerActions}>
              {!editMode ? (
                <button style={s.fbEditBtn} onClick={() => setEditMode(true)}>
                  <Pencil size={16} /> Modifier le profil
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={s.fbCancelBtn} onClick={handleCancelEdit}>Annuler</button>
                  <button style={s.fbSaveBtn} onClick={handleSubmit} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Enregistrer</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={s.fbNav}>
          <div style={s.fbNavContent}>
            <button 
              style={{ ...s.fbTab, borderBottom: activeTab === 'profile' ? '3px solid #1E3A5F' : 'none', color: activeTab === 'profile' ? '#1E3A5F' : '#64748b' }}
              onClick={() => setActiveTab('profile')}
            >
              À propos
            </button>
            <button 
              style={{ ...s.fbTab, borderBottom: activeTab === 'follows' ? '3px solid #1E3A5F' : 'none', color: activeTab === 'follows' ? '#1E3A5F' : '#64748b' }}
              onClick={() => setActiveTab('follows')}
            >
              Abonnements
            </button>
            <button 
              style={{ ...s.fbTab, borderBottom: activeTab === 'security' ? '3px solid #1E3A5F' : 'none', color: activeTab === 'security' ? '#1E3A5F' : '#64748b' }}
              onClick={() => setActiveTab('security')}
            >
              Sécurité
            </button>
          </div>
        </div>
      </div>

      <div style={s.pageGridFacebook}>
        <aside style={s.leftCol}>
          <div style={s.introCard}>
            <h3 style={s.introTitle}>Intro</h3>
            <div style={s.introList}>
              <div style={s.introItem}><Mail size={18} color="#64748b" /> <span>{form.email}</span></div>
              {form.phone && <div style={s.introItem}><Phone size={18} color="#64748b" /> <span>{form.phone}</span></div>}
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {canAccessDashboard && (
                <button style={{ ...s.fbSidebarBtn, background: '#eff6ff', color: '#1E3A5F' }} onClick={() => setShowCompanyModal(true)}>
                  <Building2 size={18} /> Dashboard Pro
                </button>
              )}
              <button style={{ ...s.fbSidebarBtn, color: '#ef4444' }} onClick={handleLogout}>
                <LogOut size={18} /> Déconnexion
              </button>
            </div>
          </div>
        </aside>

        <main style={s.mainCol}>
          <input type="file" ref={fileInputRef} hidden onChange={handleAvatarChange} accept="image/*" />
          
          {feedback.message && (
            <div style={{ ...s.feedback, ...(feedback.type === 'success' ? s.feedbackSuccess : s.feedbackError) }}>
              {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {feedback.message}
            </div>
          )}

          {activeTab === 'profile' ? (
            <div style={s.formCardFb}>
              <h2 style={s.sectionTitleFb}>Informations personnelles</h2>
              <form onSubmit={handleSubmit} style={s.fbFormGrid}>
                <div style={s.fbField}>
                  <label style={s.fbLabel}>Nom Complet</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    disabled={!editMode}
                    style={editMode ? s.fbInputActive : s.fbInputDisabled}
                  />
                </div>
                <div style={s.fbField}>
                  <label style={s.fbLabel}>Email (non modifiable)</label>
                  <input type="email" value={form.email} disabled style={s.fbInputDisabled} />
                </div>
                <div style={s.fbField}>
                  <label style={s.fbLabel}>Téléphone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={!editMode}
                    style={editMode ? s.fbInputActive : s.fbInputDisabled}
                    placeholder="Ex: +216 12 345 678"
                  />
                </div>
              </form>
            </div>
          ) : activeTab === 'follows' ? (
            <div style={s.formCardFb}>
              <h2 style={s.sectionTitleFb}>Entreprises suivies ({followedCompanies.length})</h2>
              <div style={s.followsGridFb}>
                {followedCompanies.length === 0 ? (
                  <div style={s.fbEmpty}>
                    <Building2 size={40} color="#cbd5e1" />
                    <p>Aucun abonnement trouvé.</p>
                  </div>
                ) : (
                  followedCompanies.map((company) => (
                    <div key={company._id} style={s.fbFollowCard} onClick={() => navigate(`/user/company/${company._id}`)}>
                      <div style={s.fbFollowLogo}>
                        {company.logoUrl ? (
                          <img src={toImageUrl(company.logoUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Building2 size={24} color="#94a3b8" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={s.fbFollowName}>{company.companyName}</h4>
                        <p style={s.fbFollowMeta}>{company.city || "Tunisie"}</p>
                      </div>
                      <ChevronRight size={18} color="#cbd5e1" />
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div style={s.formCardFb}>
              <h2 style={s.sectionTitleFb}>Sécurité</h2>
              <form onSubmit={handleSecuritySubmit}>
                <div style={s.fbField}>
                  <label style={s.fbLabel}>Ancien mot de passe</label>
                  <input
                    type="password"
                    value={securityForm.oldPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, oldPassword: e.target.value })}
                    required
                    style={s.fbInputActive}
                  />
                </div>
                <div style={s.fbField}>
                  <label style={s.fbLabel}>Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    required
                    style={s.fbInputActive}
                  />
                </div>
                <div style={s.fbField}>
                  <label style={s.fbLabel}>Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    required
                    style={s.fbInputActive}
                  />
                </div>
                <button type="submit" style={s.fbPrimaryBtn} disabled={isChangingPassword}>
                  {isChangingPassword ? <Loader2 className="animate-spin" size={18} /> : "Mettre à jour le mot de passe"}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ── Multi-Company Selection Modal ── */}
      {showCompanyModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Choisir une entreprise</h2>
              <button style={s.closeBtn} onClick={() => setShowCompanyModal(false)}><X size={24} /></button>
            </div>
            <div style={s.modalBody}>
              <p style={s.modalDesc}>Sélectionnez l'entreprise pour laquelle vous souhaitez accéder au tableau de bord.</p>
              <div style={s.companyListModal}>
                {managedCompanies.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>Aucune entreprise gérée.</p>
                ) : (
                  managedCompanies.map((comp) => (
                    <button 
                      key={comp._id} 
                      style={s.companyItemBtn} 
                      onClick={() => handleSwitchCompany(comp._id)}
                      disabled={isSwitching}
                    >
                      <div style={s.compLogoSm}>
                        {comp.logoUrl ? (
                          <img src={toImageUrl(comp.logoUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Building2 size={20} color="#94a3b8" />
                        )}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={s.compNameSm}>{comp.companyName}</p>
                        <p style={s.compCitySm}>{comp.city || "Tunisie"}</p>
                      </div>
                      <ChevronRight size={18} color="#cbd5e1" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
    background: "#f0f2f5",
    fontFamily: "inherit",
    display: "flex",
    flexDirection: "column",
  },
  topBar: {
    maxWidth: '1095px',
    margin: '10px auto 0',
    padding: '0 16px',
    width: '100%',
    boxSizing: 'border-box',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#65676b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 0',
  },
  fbHeader: {
    background: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  coverWrap: {
    maxWidth: '1095px',
    margin: '0 auto',
    position: 'relative',
    height: '350px',
    background: '#f0f2f5',
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '250px',
    overflow: 'hidden',
  },
  profileHeaderContent: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    padding: '0 32px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    background: 'linear-gradient(to top, rgba(255,255,255,1) 40%, rgba(255,255,255,0) 100%)',
    height: '150px',
  },
  avatarContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
  },
  avatarCircle: {
    position: 'relative',
    width: '168px',
    height: '168px',
    borderRadius: '50%',
    border: '4px solid #fff',
    background: '#fff',
    overflow: 'visible',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarFallbackLarge: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: '#1E3A5F',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '64px',
    fontWeight: '800',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#e4e6eb',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#050505',
  },
  nameArea: {
    paddingBottom: '8px',
  },
  fbName: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#050505',
    margin: '0 0 4px',
  },
  fbSub: {
    fontSize: '16px',
    color: '#65676b',
    fontWeight: '600',
    margin: 0,
  },
  rolesList: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
  },
  fbRoleChip: {
    background: '#e4e6eb',
    color: '#050505',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  headerActions: {
    paddingBottom: '12px',
  },
  fbEditBtn: {
    background: '#e4e6eb',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    color: '#050505',
  },
  fbSaveBtn: {
    background: '#1877f2',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  fbCancelBtn: {
    background: '#e4e6eb',
    color: '#050505',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  fbNav: {
    maxWidth: '1095px',
    margin: '0 auto',
    borderTop: '1px solid #e4e6eb',
  },
  fbNavContent: {
    padding: '0 16px',
    display: 'flex',
    gap: '4px',
  },
  fbTab: {
    padding: '16px 12px',
    background: 'none',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#65676b',
  },
  pageGridFacebook: {
    maxWidth: '1095px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    gap: '16px',
    padding: '0 16px',
  },
  leftCol: {
    width: '360px',
    flexShrink: 0,
  },
  introCard: {
    background: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  introTitle: {
    fontSize: '20px',
    fontWeight: '800',
    margin: '0 0 16px',
    color: '#050505',
  },
  introList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  introItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px',
    color: '#050505',
  },
  fbSidebarBtn: {
    width: '100%',
    padding: '10px 12px',
    background: '#f2f3f5',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    color: '#050505',
    textAlign: 'left',
  },
  mainCol: {
    flex: 1,
  },
  formCardFb: {
    background: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    marginBottom: '16px',
  },
  sectionTitleFb: {
    fontSize: '20px',
    fontWeight: '800',
    margin: '0 0 20px',
    color: '#050505',
  },
  fbFormGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fbField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fbLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#65676b',
  },
  fbInputActive: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ced4da',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  fbInputDisabled: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #e4e6eb',
    background: '#f8f9fa',
    color: '#65676b',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  fbPrimaryBtn: {
    marginTop: '16px',
    width: '100%',
    padding: '12px',
    background: '#1877f2',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
  },
  followsGridFb: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fbFollowCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #f0f2f5',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  fbFollowLogo: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#f0f2f5',
  },
  fbFollowName: {
    fontSize: '16px',
    fontWeight: '700',
    margin: 0,
    color: '#050505',
  },
  fbFollowMeta: {
    fontSize: '13px',
    color: '#65676b',
    margin: 0,
  },
  fbEmpty: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#65676b',
  },
  feedback: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 16px", borderRadius: 8, marginBottom: 16,
    fontSize: 14, fontWeight: 600, animation: "slideDown 0.25s ease",
  },
  feedbackSuccess: { background: "#e7f3ff", color: "#1877f2", border: "1px solid #1877f2" },
  feedbackError: { background: "#ffebe8", color: "#f02849", border: "1px solid #f02849" },
  loadingBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "100vh", gap: 16,
  },
  spinner: {
    width: 32, height: 32, borderRadius: "50%",
    border: "3px solid #e2e8f0", borderTopColor: "#1E3A5F",
    animation: "spin 0.8s linear infinite",
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(244, 244, 244, 0.8)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modalContent: {
    background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    overflow: 'hidden', animation: 'slideDown 0.3s ease-out',
  },
  modalHeader: {
    padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', background: '#fff',
  },
  modalTitle: { fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' },
  modalBody: { padding: '20px' },
  modalDesc: { color: '#64748b', fontSize: '14px', marginBottom: '20px' },
  companyListModal: { display: 'flex', flexDirection: 'column', gap: '10px' },
  companyItemBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
    background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px',
    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
  },
  compLogoSm: {
    width: '40px', height: '40px', borderRadius: '8px', background: '#fff',
    border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  compNameSm: { fontWeight: '700', color: '#0f172a', margin: 0, fontSize: '15px' },
  compCitySm: { fontSize: '12px', color: '#64748b', margin: 0 },
};

export default Profile;
