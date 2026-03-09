import { useState } from "react";
import { useAddUserToCompanyMutation } from "../../../redux/features/users/usersApiSlice";
import styles from "../../../styles/AddUserModal.module.css";
const roles = [
  { id: "ROLE_ID_1", name: "assistant_manager" },
  { id: "ROLE_ID_2", name: "viewer" }
];

const AddUserModal = ({ onClose, onUserAdded }) => {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [addUser, { isLoading }] = useAddUserToCompanyMutation();

  const handleAdd = async () => {
    if (!email || !selectedRole) {
      setErrorMessage("Veuillez renseigner l'email et choisir un rôle.");
      return;
    }

    const role = roles.find(r => r.name === selectedRole);
    if (!role) {
      setErrorMessage("Rôle invalide !");
      return;
    }

    try {
      setErrorMessage("");
      await addUser({ email, role: selectedRole }).unwrap();
      onUserAdded?.(); 
      onClose(); 
    } catch (err) {
      console.error(err);
      setErrorMessage(err.data?.message || "Erreur lors de l'ajout.");
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard}>
        {/* HEADER BLEU */}
        <div className={styles.modalHeader}>
          <h3>Ajouter un nouveau membre</h3>
        </div>

        <div className={styles.modalBody}>
          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
            Email de l'invité
          </label>
          <input
            className={styles.inputField}
            type="email"
            placeholder="jean.dupont@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
            Rôle assigné
          </label>
          <select
            className={styles.selectField}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">Choisir un rôle</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>
                {role.name.replace('_', ' ')} {/* Plus propre à lire */}
              </option>
            ))}
          </select>

          {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

          <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Annuler
            </button>
            <button 
              className={styles.confirmBtn} 
              onClick={handleAdd} 
              disabled={isLoading}
            >
              {isLoading ? "Ajout en cours..." : "Confirmer l'invitation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;