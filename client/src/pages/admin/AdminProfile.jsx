import { 
  useGetProfileQuery, 
  useUpdateProfileMutation, 
  useChangeAdminPasswordMutation,
  useGetAdminActivitiesQuery
} from "../../redux/features/profile/profileApiSlice";
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { logOut } from "../../redux/features/auth/authSlice";
import { Camera, Save, LogOut, ShieldCheck, Key, History, User, Loader2 } from "lucide-react";
import styles from "../../styles/dashboardAdmin.module.css";

const SERVER_URL = "http://localhost:5000";

const AdminProfile = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const authUser = useSelector((state) => state.auth.account);
  const { data: profile, isLoading, refetch } = useGetProfileQuery(undefined, { pollingInterval: 3000 });
  const { data: realActivities, isLoading: activitiesLoading } = useGetAdminActivitiesQuery(undefined, { pollingInterval: 3000 });
  const [updateProfile] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangeAdminPasswordMutation();

  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({
    fullName:  '',
    phone:     '',
    email:     '',
    avatarUrl: null,
  });

  const [securityForm, setSecurityForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [feedback,  setFeedback]  = useState({ error: '', success: false, message: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  useEffect(() => {
    const source = profile || authUser;
    if (source) {
      setForm({
        fullName:  source.fullName || source.name || '',
        phone:     source.phone    || '',
        email:     source.email    || '',
        avatarUrl: null,
      });

      if (source.avatarUrl) {
        setPreviewUrl(
          source.avatarUrl.startsWith('http')
            ? source.avatarUrl
            : `${SERVER_URL}/${source.avatarUrl}`
        );
      }
    }
  }, [profile, authUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setForm((prev) => ({ ...prev, avatarUrl: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFeedback({ error: '', success: false, message: '' }); // Nettoyer les messages avant d'éditer
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) return; // Sécurité supplémentaire
    
    try {
      const formData = new FormData();
      formData.append('fullName', form.fullName);
      formData.append('phone',    form.phone);
      if (form.avatarUrl instanceof File) {
        formData.append('avatar', form.avatarUrl);
      }

      await updateProfile(formData).unwrap();
      setFeedback({ error: '', success: true, message: 'Profil mis à jour avec succès !' });
      setIsEditing(false);
      refetch();
      setTimeout(() => setFeedback({ error: '', success: false, message: '' }), 3000);
    } catch (err) {
      setFeedback({ error: 'Erreur de mise à jour', success: false, message: '' });
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setFeedback({ error: "Les mots de passe ne correspondent pas", success: false, message: '' });
      return;
    }

    try {
      await changePassword({ 
        oldPassword: securityForm.oldPassword, 
        newPassword: securityForm.newPassword 
      }).unwrap();
      
      setFeedback({ error: '', success: true, message: 'Mot de passe mis à jour avec succès !' });
      setSecurityForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setFeedback({ error: '', success: false, message: '' }), 3000);
    } catch (err) {
      setFeedback({ error: err?.data?.message || "Erreur lors du changement de mot de passe", success: false, message: '' });
    }
  };

  if (isLoading) return <div className={styles.dashboardContainer}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Espace Administrateur</h1>
        <p className={styles.pageSubtitle} style={{ color: '#64748b', marginBottom: '1.5rem' }}>Gérez vos informations personnelles et de sécurité</p>
      </div>

      <div className={styles.tabsBar} style={{ justifyContent: 'center' }}>
        <button 
          className={activeTab === 'profile' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} style={{ marginRight: 8 }} />
          Profil
        </button>
        <button 
          className={activeTab === 'security' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('security')}
        >
          <Key size={18} style={{ marginRight: 8 }} />
          Sécurité
        </button>
        <button 
          className={activeTab === 'activity' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('activity')}
        >
          <History size={18} style={{ marginRight: 8 }} />
          Activités
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
        {activeTab === 'profile' && (
          <div className={styles.card} style={{ width: '100%', maxWidth: '800px', padding: '40px' }}>
            <div className={styles.avatarSection} style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
                <div style={{ width: '140px', height: '140px', borderRadius: '24px', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={60} color="#24416b" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: '#24416b', color: 'white', padding: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '3px solid #fff' }}>
                    <Camera size={20} />
                  </label>
                )}
              </div>
              <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>{form.fullName || 'Admin'}</h2>
              <span className={styles.statusActive}>Administrateur Système</span>
              <input
                id="avatar-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.gridWrapper} style={{ gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                <div className={styles.formGroup}>
                  <label>Nom complet</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    readOnly={!isEditing}
                    style={!isEditing ? { background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Téléphone</label>
                  <input
                    className={styles.input}
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    readOnly={!isEditing}
                    style={!isEditing ? { background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>
              <div className={styles.formGroup} style={{ marginTop: '5px' }}>
                <label>Email (Identifiant)</label>
                <input
                  className={styles.input}
                  style={{ background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                  type="email"
                  value={form.email}
                  readOnly
                />
              </div>

              {feedback.error && (
                <div style={{ 
                  padding: '12px', 
                  background: '#fef2f2', 
                  border: '1.5px solid #fee2e2', 
                  borderRadius: '10px',
                  color: '#ef4444',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  marginTop: '1.5rem',
                  textAlign: 'center'
                }}>
                  ⚠️ {feedback.error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                {!isEditing ? (
                  <button 
                    type="button" 
                    className={styles.button} 
                    style={{ flex: 1 }}
                    onClick={handleEditClick}
                  >
                    <User size={18} />
                    Modifier le profil
                  </button>
                ) : (
                  <button type="submit" className={styles.button} style={{ flex: 1 }}>
                    <Save size={18} />
                    Enregistrer les modifications
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { dispatch(logOut()); navigate("/login"); }}
                  className={styles.button}
                  style={{ flex: '0 0 auto', width: 'auto', background: '#f1f5f9', color: '#334155', boxShadow: 'none' }}
                >
                  <LogOut size={18} />
                  Quitter
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className={styles.card} style={{ width: '100%', maxWidth: '600px' }}>
            <h3 className={styles.cardTitle}>Sécurité du compte</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Mettez à jour votre mot de passe pour protéger votre compte administrateur.</p>
            
            <form onSubmit={handleSecuritySubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className={styles.cardLabel} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Mot de passe actuel</label>
                <input
                  className={styles.input}
                  type="password"
                  value={securityForm.oldPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, oldPassword: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className={styles.cardLabel} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nouveau mot de passe</label>
                <input
                  className={styles.input}
                  type="password"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                  required
                />
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>
                  Doit contenir au moins 8 caractères, une lettre, un chiffre et un caractère spécial.
                </p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className={styles.cardLabel} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Confirmer le nouveau mot de passe</label>
                <input
                  className={styles.input}
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                  required
                />
              </div>

              {feedback.error && (
                <div style={{ 
                  padding: '12px', 
                  background: '#fef2f2', 
                  border: '1.5px solid #fee2e2', 
                  borderRadius: '10px',
                  color: '#ef4444',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  marginBottom: '1.5rem',
                  lineHeight: '1.4'
                }}>
                  ⚠️ {feedback.error}
                </div>
              )}

              <button type="submit" className={styles.button} style={{ marginTop: '1rem' }} disabled={isChangingPassword}>
                {isChangingPassword ? <Loader2 className="animate-spin" size={20} /> : "Mettre à jour le mot de passe"}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className={styles.card} style={{ width: '100%', maxWidth: '800px' }}>
            <h3 className={styles.cardTitle}>Journal d'activités récentes</h3>
            {activitiesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 className="animate-spin" size={30} color="#2563eb" />
              </div>
            ) : realActivities && realActivities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {realActivities.map((act) => (
                  <div key={act._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid ${act.status === 'success' ? '#10b981' : act.status === 'error' ? '#ef4444' : '#3b82f6'}` }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '600' }}>{act.action}</h4>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>Cible : <strong>{act.target}</strong></p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(act.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Aucune activité récente trouvée.</p>
            )}
          </div>
        )}
      </div>

      {feedback.success && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, animation: 'fadeInUp 0.3s ease-out' }}>
          ✓ {feedback.message}
        </div>
      )}
    </div>
  );
};

export default AdminProfile;