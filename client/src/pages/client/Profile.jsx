import { useGetProfileQuery, useUpdateProfileMutation } from "../../redux/features/profileApiSlice";
import { useState, useEffect } from 'react';
import styles from '../../styles/Profile.module.css';
import { useSelector } from 'react-redux';
import { useDispatch } from "react-redux";
import { logOut } from "../../redux/features/auth/authSlice";
import { useNavigate } from "react-router-dom";

// ❌ fileToBase64 supprimée — on n'envoie plus en base64

const SERVER_URL = 'http://localhost:5000';

const Profile = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authUser = useSelector((state) => state.auth.account);
  const token = useSelector((state) => state.auth.accessToken) || localStorage.getItem('accessToken');

  const { data: profile, isLoading, refetch } = useGetProfileQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    avatarUrl: null, // nom du champ dans le modèle User
  });

  const [feedback, setFeedback] = useState({ error: '', success: false });
  const [previewUrl, setPreviewUrl] = useState(null); // aperçu local (blob:) ou chemin serveur

  // ─── Charger les données du profil ───────────────────────────────────────────
  useEffect(() => {
    const source = profile || authUser;

    if (source) {
      setForm({
        fullName:  source.fullName   || source.companyName || source.name || '',
        phone:     source.phone      || '',
        email:     source.email      || '',
        avatarUrl: null, // on ne remet pas le chemin dans le state, on utilise previewUrl
      });

      // ✅ Si l'avatarUrl est un chemin FS (ex: "uploads/profiles/uuid.png")
      //    on préfixe avec l'URL du serveur pour afficher l'image
      const rawAvatar = source.avatarUrl || source.logoUrl || null;
      if (rawAvatar) {
        // Ancien base64 encore en base ? on l'affiche quand même (transition)
        if (rawAvatar.startsWith('data:image')) {
          setPreviewUrl(rawAvatar);
        } else {
          setPreviewUrl(`${SERVER_URL}/${rawAvatar}`);
        }
      } else {
        setPreviewUrl(null);
      }
    }
  }, [profile, authUser]);

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    dispatch(logOut());
    navigate("/login");
  };

  // ─── Sélection d'une nouvelle image ──────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation côté client
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setFeedback({ error: 'Type non autorisé. Utilisez jpg, png ou webp.', success: false });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ error: 'Image trop lourde (max 5 MB).', success: false });
      return;
    }

    // Libère l'ancienne URL blob si besoin
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setFeedback({ error: '', success: false });
    setForm((prev) => ({ ...prev, avatarUrl: file })); // ✅ stocke le File dans avatarUrl
    setPreviewUrl(URL.createObjectURL(file));
  };

  // ─── Soumission du formulaire ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ error: '', success: false });

    if (!form.fullName.trim()) {
      setFeedback({ error: 'Le nom complet est requis', success: false });
      return;
    }

    try {
      // ✅ FormData — Multer lit "avatar" côté serveur
      const formData = new FormData();
      formData.append('fullName', form.fullName);
      formData.append('phone',    form.phone);
      if (form.avatarUrl instanceof File) {
        formData.append('avatar', form.avatarUrl); // fieldname = 'avatar' (attendu par Multer)
      }

      await updateProfile(formData).unwrap();

      setFeedback({ error: '', success: true });
      refetch();
      setTimeout(() => setFeedback({ error: '', success: false }), 3000);

    } catch (err) {
      console.error("UPDATE ERROR:", err);
      setFeedback({
        error: err.data?.message || 'Erreur lors de la mise à jour',
        success: false
      });
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Récupération de vos informations...</p>
      </div>
    );
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageContainer}>

      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <h2 className={styles.logoText}>🔷 Pro Finder</h2>
          <p className={styles.subtitle}>Gérez vos informations personnelles</p>
        </div>
      </div>

      <div className={styles.profileWrapper}>
        <div className={styles.profileContent}>

          {/* ── Avatar ── */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatarWrapper}>

                {previewUrl ? (
                  // ✅ blob: → aperçu local | http://localhost:5000/uploads/... → image serveur
                  <img src={previewUrl} alt="avatar" className={styles.avatarImage} />
                ) : (
                  <div className={styles.avatarInitials}>
                    {form.fullName ? form.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}

                <label htmlFor="avatar-upload" className={styles.editBadge}>
                  📷
                </label>

              </div>

              <div className={styles.avatarInfo}>
                <span className={styles.userName}>{form.fullName || 'Utilisateur'}</span>
                <span className={styles.userEmail}>{form.email}</span>
              </div>
            </div>
          </div>

          {/* ── Formulaire ── */}
          <form onSubmit={handleSubmit} className={styles.formSection}>

            <div className={styles.formGrid}>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>NOM COMPLET</label>
                <input
                  type="text"
                  placeholder="Ex: Jean Dupont"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={styles.inputField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>EMAIL (Non modifiable)</label>
                <input
                  type="email"
                  value={form.email}
                  readOnly
                  className={`${styles.inputField} ${styles.readOnly}`}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>TÉLÉPHONE</label>
                <input
                  type="tel"
                  placeholder="+216 00 000 000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={styles.inputField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>CHANGER LA PHOTO</label>

                {/* ✅ input caché déclenché par le label 📷 au-dessus */}
                <input
                  id="avatar-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleAvatarChange}
                  className={styles.fileInput}
                />

                <div className={styles.customFileBtn}>
                  {form.avatarUrl instanceof File
                    ? form.avatarUrl.name
                    : "Modifier l'image"}
                </div>
              </div>

            </div>

            {/* ── Messages ── */}
            {feedback.error && (
              <div className={styles.errorMessage}>
                {feedback.error}
              </div>
            )}

            {/* ── Boutons ── */}
            <div className={styles.buttonContainer}>
              <button type="submit" className={styles.submitButton} disabled={isUpdating}>
                {isUpdating ? 'Mise à jour...' : 'Mettre à jour mon profil'}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutButton}
              >
                Se déconnecter
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* ── Toast succès ── */}
      {feedback.success && (
        <div className={styles.successToast}>
          ✓ Profil mis à jour !
        </div>
      )}

    </div>
  );
};

export default Profile;