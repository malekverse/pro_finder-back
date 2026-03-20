import { useGetProfileQuery, useUpdateProfileMutation } from "../../../redux/features/profileApiSlice";
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { logOut } from "../../../redux/features/auth/authSlice";
import { Camera, Save, LogOut, ShieldCheck } from "lucide-react";
import styles from "../../../styles/dashboardAdmin.module.css";

const SERVER_URL = "http://localhost:5000";

const AdminProfile = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const authUser = useSelector((state) => state.auth.account);
  const { data: profile, isLoading, refetch } = useGetProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();

  const [form, setForm] = useState({
    fullName:  '',
    phone:     '',
    email:     '',
    avatarUrl: null,  // ✅ stocke le File, pas un base64
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [feedback,  setFeedback]  = useState({ error: '', success: false });

  // ─── Charger le profil ────────────────────────────────────────────────────
  useEffect(() => {
    const source = profile || authUser;
    if (source) {
      setForm({
        fullName:  source.fullName || source.name || '',
        phone:     source.phone    || '',
        email:     source.email    || '',
        avatarUrl: null,  // ✅ toujours null au chargement
      });

      // ✅ Construire l'URL complète pour afficher l'image
      if (source.avatarUrl) {
        setPreviewUrl(
          source.avatarUrl.startsWith('http')
            ? source.avatarUrl
            : `${SERVER_URL}/${source.avatarUrl}`
        );
      }
    }
  }, [profile, authUser]);

  // ─── Sélection d'une nouvelle image ─────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Libérer l'ancienne URL blob
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);

    setForm((prev) => ({ ...prev, avatarUrl: file }));
    setPreviewUrl(URL.createObjectURL(file)); // ✅ aperçu local immédiat
  };

  // ─── Sauvegarde ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ FormData au lieu de base64
      const formData = new FormData();
      formData.append('fullName', form.fullName);
      formData.append('phone',    form.phone);
      if (form.avatarUrl instanceof File) {
        formData.append('avatar', form.avatarUrl);
      }

      await updateProfile(formData).unwrap();
      setFeedback({ error: '', success: true });
      refetch();
      setTimeout(() => setFeedback({ error: '', success: false }), 3000);
    } catch (err) {
      setFeedback({ error: 'Erreur de mise à jour', success: false });
    }
  };

  if (isLoading) return <div className={styles.dashboardContainer}>Chargement...</div>;

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mon Profil Administrateur</h1>
        <p className={styles.pageSubtitle}>Gérez vos informations personnelles et de sécurité</p>
      </div>

      <div className={styles.fullWidthForm}>

        {/* ── Avatar ── */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            {previewUrl ? (
              <img src={previewUrl} alt="avatar" className={styles.avatarImage} />
            ) : (
              <ShieldCheck size={50} color="#24416b" />
            )}
            <label htmlFor="avatar-upload" className={styles.avatarEditBtn}>
              <Camera size={16} />
            </label>
          </div>
          <span className={styles.adminBadge}>Administrateur Système</span>
          <input
            id="avatar-upload"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* ── Formulaire ── */}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGrid}>

            <div className={styles.formGroup}>
              <label>Nom complet</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Email (Identifiant)</label>
              <input
                type="email"
                value={form.email}
                readOnly
                className={styles.readOnly}
              />
            </div>

          </div>

          {feedback.error && (
            <p style={{ color: 'red', marginBottom: 8 }}>{feedback.error}</p>
          )}

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnSave}>
              <Save size={18} />
              Sauvegarder
            </button>
            <button
              type="button"
              className={styles.btnLogout}
              onClick={() => { dispatch(logOut()); navigate("/login"); }}
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </div>
        </form>

      </div>

      {/* ── Toast succès ── */}
      {feedback.success && (
        <div className={styles.successToast}>✓ Profil mis à jour !</div>
      )}
    </div>
  );
};

export default AdminProfile;