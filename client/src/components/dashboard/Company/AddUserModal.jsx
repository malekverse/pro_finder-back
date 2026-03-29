import { useState, useEffect } from "react";
import { useAddUserToCompanyMutation } from "../../../redux/features/users/usersApiSlice";
import styles from "../../../styles/AddUserModal.module.css";

const AddUserModal = ({ onClose, onUserAdded, followers, availableRoles }) => {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [addUser, { isLoading }] = useAddUserToCompanyMutation();
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Utiliser les rôles fournis ou un fallback vide
  const roles = availableRoles || [];

  useEffect(() => {
    // Si followers est un tableau, on filtre ou on montre tout
    if (Array.isArray(followers)) {
      if (email.length > 0) {
        const filtered = followers.filter(f => {
          // On cherche l'email soit dans user_id.email (si populate) soit dans email direct
          const targetEmail = f.user_id?.email || f.email || "";
          return targetEmail.toLowerCase().includes(email.toLowerCase());
        });
        setFilteredFollowers(filtered);
      } else {
        setFilteredFollowers(followers); 
      }
    }
  }, [email, followers]);

  const handleSelectUser = (follower) => {
    // On récupère l'email du follower sélectionné
    const selectedEmail = follower.user_id?.email || follower.email;
    setEmail(selectedEmail);
    setShowSuggestions(false);
  };

  const handleAdd = async () => {
    if (!email || !selectedRole) {
      setErrorMessage("Veuillez renseigner l'email et choisir un rôle.");
      return;
    }
    try {
      setErrorMessage("");
      // On envoie l'email au backend
      await addUser({ email, role: selectedRole }).unwrap();
      onUserAdded?.(); 
      onClose(); 
    } catch (err) {
      setErrorMessage(err.data?.message || "Erreur lors de l'ajout.");
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h3>Inviter un membre</h3>
        </div>  

        <div className={styles.modalBody}>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className={styles.label}>Email du follower</label>
            <input
              className={styles.inputField}
              type="text"
              placeholder="Chercher par nom ou email..."
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              // Délai pour permettre le clic sur la suggestion
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            {/* LISTE D'AUTO-COMPLÉTION */}
            {showSuggestions && filteredFollowers.length > 0 && (
              <ul style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10,
                listStyle: 'none',
                padding: 0,
                margin: '4px 0 0 0'
              }}>
                {filteredFollowers.map((f) => {
                  const fEmail = f.user_id?.email || f.email;
                  const fName = f.user_id?.fullName || f.fullName || "Utilisateur";
                  return (
                    <li 
                      key={f._id || f.id} 
                      onClick={() => handleSelectUser(f)}
                      style={{
                        padding: '10px 15px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>{fName}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{fEmail}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <label className={styles.label}>Rôle assigné</label>
            <select
              className={styles.selectField}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Choisir un rôle</option>
              {roles.map(role => (
               <option key={role._id} value={role.name}>
  {role.name.replace('_', ' ')}
</option>
              ))}
            </select>
          </div>

          {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

          <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose}>Annuler</button>
            <button className={styles.confirmBtn} onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Ajout..." : "Confirmer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;