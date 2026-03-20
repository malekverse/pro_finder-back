import { useState, useEffect } from "react";
import { useAddUserToCompanyMutation } from "../../../redux/features/users/usersApiSlice";
import styles from "../../../styles/AddUserModal.module.css";

const roles = [
   { _id: "69b0491ae9ceee4218efbe47", name: "admin" },
    { _id: "69ac40b1b42d9ccd56b21d12", name: "assistant_manager" },
    { _id: "69ac6e507df0be4e31e9da57", name: "viewer" }
];

const AddUserModal = ({ onClose, onUserAdded, followers }) => {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [addUser, { isLoading }] = useAddUserToCompanyMutation();
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // MODIFICATION 1 : Si l'email est vide, on montre TOUS les followers
    if (followers) {
      if (email.length > 0) {
        const filtered = followers.filter(f => {
          const targetEmail = f.user_id?.email || f.email || "";
          return targetEmail.toLowerCase().includes(email.toLowerCase());
        });
        setFilteredFollowers(filtered);
      } else {
        setFilteredFollowers(followers); 
      }
    }
  }, [email, followers]);

  const handleSelectUser = (selectedEmail) => {
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
              type="email"
              placeholder="Chercher un email..."
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
              // MODIFICATION 2 : On affiche les suggestions même si email.length est 0
              onFocus={() => setShowSuggestions(true)}
              // Petit délai pour permettre le clic sur un élément de la liste avant qu'elle ne disparaisse
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            {/* LISTE D'AUTO-COMPLÉTION */}
            {showSuggestions && filteredFollowers.length > 0 && (
              <ul className={styles.suggestionList}>
                {filteredFollowers.map((f) => (
                  <li 
                    key={f._id || f.id} 
                    onClick={() => handleSelectUser(f.user_id?.email || f.email)}
                    className={styles.suggestionItem}
                  >
                    <span className={styles.suggestName}>{f.user_id?.fullName || f.fullName}</span>
                    <span className={styles.suggestEmail}>{f.user_id?.email || f.email}</span>
                  </li>
                ))}
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