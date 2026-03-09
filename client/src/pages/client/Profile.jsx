import { useGetProfileQuery, useUpdateProfileMutation } from "../../redux/features/profileApiSlice";
import { useState, useEffect } from 'react';
import styles from '../../styles/Profile.module.css';
import { useSelector } from 'react-redux'; 
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const Profile = () => {
  const authUser = useSelector((state) => state.auth.account);
  const token = useSelector((state) => state.auth.accessToken) || localStorage.getItem('accessToken');
  const { data:profile , isLoading, refetch } = useGetProfileQuery(undefined, {
    skip: !token, // Ne fait pas la requête si le token n'est pas là
  }); // Ajout de refetch pour rafraîchir après modif
  const [updateProfile] = useUpdateProfileMutation();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    avatarUrl: null,
  });

  const [feedback, setFeedback] = useState({ error: '', success: false });
  const [previewUrl, setPreviewUrl] = useState(null);

useEffect(() => {
  const source = profile || authUser;

  if (source) {
    console.log("Données chargées depuis :", profile ? "API" : "Redux");

    setForm({
      fullName: source.fullName || source.companyName || source.name || '',
      phone: source.phone || '',
      email: source.email || '',
      avatarUrl: source.avatarUrl || source.logoUrl || null,
    });

    if (source.avatarUrl || source.logoUrl) {
      setPreviewUrl(source.avatarUrl || source.logoUrl);
    }
  }
}, [profile, authUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Nettoyage de l'ancienne URL de preview pour la mémoire
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setForm((prev) => ({ ...prev, avatarUrl: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ error: '', success: false });

    // Validation simple
    if (!form.fullName.trim()) {
      setFeedback({ error: 'Le nom complet est requis', success: false });
      return;
    }

    try {
      let avatarBase64 = form.avatarUrl;
      
      // Si l'utilisateur a sélectionné un NOUVEAU fichier
      if (form.avatarUrl instanceof File) {
        avatarBase64 = await fileToBase64(form.avatarUrl);
      }

      await updateProfile({
        fullName: form.fullName,
        phone: form.phone,
        avatarUrl: avatarBase64, 
      }).unwrap();

      setFeedback({ error: '', success: true });
      refetch(); // Force la mise à jour des données locales
      setTimeout(() => setFeedback({ error: '', success: false }), 3000);
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      setFeedback({ error: err.data?.message || 'Erreur lors de la mise à jour', success: false });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Récupération de vos informations...</p>
      </div>
    );
  }

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
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatarWrapper}>
                {previewUrl ? (
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
                <input 
                  id="avatar-upload"
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className={styles.fileInput} 
                />
                <div className={styles.customFileBtn}>
                   {form.avatarUrl instanceof File ? form.avatarUrl.name : "Modifier l'image"}
                </div>
              </div>
            </div>

            {feedback.error && <div className={styles.errorMessage}>{feedback.error}</div>}

            <div className={styles.buttonContainer}>
              <button type="submit" className={styles.submitButton}>
                Mettre à jour mon profil
              </button>
            </div>
          </form>
        </div>
      </div>

      {feedback.success && <div className={styles.successToast}>✓ Profil mis à jour !</div>}
    </div>
  );
};

export default Profile;