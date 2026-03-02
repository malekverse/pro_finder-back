import { useGetProfileQuery, useUpdateProfileMutation } from '../redux/features/profileApiSlice';
import { useState, useEffect } from 'react';
import styles from '../styles/Profile.module.css';

/* ✅ AJOUTÉ : fonction conversion base64 */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const Profile = () => {
  const { data, isLoading } = useGetProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    avatarUrl: null,
  });

  const [feedback, setFeedback] = useState({ error: '', success: false });
  const [previewUrl, setPreviewUrl] = useState(null);

  /* ✅ Remplir le formulaire quand data arrive */
  useEffect(() => {
    if (data) {
      setForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        email: data.email || '',
        avatarUrl: data.avatarUrl || null,
      });

      if (data.avatarUrl) {
        setPreviewUrl(data.avatarUrl);
      }
    }
  }, [data]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, avatarUrl: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneOk = /^[\d\s+\-().]{7,20}$/.test(form.phone || '');
    if (!phoneOk) {
      setFeedback({ error: 'Numéro de téléphone invalide', success: false });
      return;
    }

    try {
      /* ✅ Conversion correcte */
      let avatarBase64 = form.avatarUrl;

      if (form.avatarUrl instanceof File) {
        avatarBase64 = await fileToBase64(form.avatarUrl);
      }

      await updateProfile({
        fullName: form.fullName,
        phone: form.phone,
        avatarUrl: avatarBase64,
      }).unwrap();

      setFeedback({ error: '', success: true });
      setTimeout(() => setFeedback({ error: '', success: false }), 2500);
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      setFeedback({ error: 'Erreur lors de la mise à jour', success: false });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Chargement de votre profil...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.profileWrapper}>
        <div className={styles.profileHeader}>
          <h1 className={styles.mainTitle}>Mon Profil</h1>
          <p className={styles.subtitle}>Mettez à jour vos informations personnelles</p>
        </div>

        <div className={styles.profileContent}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatarWrapper}>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="avatar"
                    className={styles.avatarImage}
                  />
                ) : (
                  <span className={styles.avatarInitials}>
                    {form.fullName ? form.fullName.charAt(0).toUpperCase() : 'PF'}
                  </span>
                )}
              </div>
              <div className={styles.avatarInfo}>
                <span className={styles.avatarLabel}>Photo de profil</span>
                <span className={styles.avatarEmail}>{form.email}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.formSection}>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>NOM COMPLET</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className={styles.inputField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>EMAIL</label>
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
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className={styles.inputField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>AVATAR</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className={styles.fileInput}
                />
                <span className={styles.fileName}>
                  {form.avatarUrl?.name || 'Aucun fichier choisi'}
                </span>
              </div>
            </div>

            {feedback.error && (
              <div className={styles.errorMessage}>
                ⚠️ {feedback.error}
              </div>
            )}

            <div className={styles.buttonContainer}>
              <button type="submit" className={styles.submitButton}>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>

      {feedback.success && (
        <div className={styles.successToast}>
          ✓ Profil mis à jour avec succès
        </div>
      )}
    </div>
  );
};

export default Profile;