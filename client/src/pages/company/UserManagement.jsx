import { useSelector } from "react-redux";
import { useState, useEffect, useRef } from "react"; // Ajout de useEffect
import axios from "axios"; // Pour l'appel API
import { selectPermissions } from "../../redux/features/auth/authSlice";
import { PERMISSIONS } from "../../constants/permissions";
import CompanyUsersList from "../../components/dashboard/Company/CompanyUsersList";
import AddUserModal from "../../components/dashboard/Company/AddUserModal.jsx";
import styles from  "../../styles/UserManagement.module.css"; 

const UserManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const permissions = useSelector(selectPermissions);
  const [refreshKey, setRefreshKey] = useState(0);
  const listRef = useRef();

  // --- LOGIQUE AJOUTÉE POUR LES FOLLOWERS ---
  const [followers, setFollowers] = useState([]); 
  const token = useSelector((state) => state.auth.accessToken) || localStorage.getItem("accessToken");

  const fetchFollowers = async () => {
    if (!token) return;
    try {
      const response = await axios.get("http://localhost:5000/company/followers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowers(response.data);
    } catch (err) {
      console.error("Erreur récupération followers:", err);
    }
  };

  useEffect(() => {
    fetchFollowers();
  }, [token]);
  // ------------------------------------------

  const handleUserAdded = () => {
    setRefreshKey((prev) => prev + 1);
    listRef.current?.refetchUsers();
  };

  return (
    <div className={styles.container}>
      {/* HEADER SECTION */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Gestion de l'Équipe</h1>
          <p>Administrez les membres et leurs droits d'accès</p>
        </div>
        
        <button className={styles.addButton} onClick={() => setShowModal(true)}>
          + Ajouter un utilisateur
        </button>
      </div>

      {/* PERMISSIONS ACTIONS TOOLBAR */}
      <div className={styles.actionToolbar}>
        {permissions.includes(PERMISSIONS.CREATE_POST) && (
          <button className={styles.actionButton}>Créer un Post</button>
        )}
        {permissions.includes(PERMISSIONS.UPDATE_POST) && (
          <button className={styles.actionButton}>Modifier Post</button>
        )}
        {permissions.includes(PERMISSIONS.DELETE_POST) && (
          <button className={styles.actionButton}>Supprimer Post</button>
        )}
        {permissions.includes(PERMISSIONS.VIEW_FOLLOWERS) && (
          <button className={styles.actionButton}>Voir Abonnés</button>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className={styles.tableWrapper}>
        <CompanyUsersList refreshKey={refreshKey} ref={listRef} />
      </div>

      {/* MODAL SECTION */}
      {showModal && (
        <AddUserModal 
          onClose={() => setShowModal(false)} 
          onUserAdded={handleUserAdded}
          followers={followers} 
        />
      )}
    </div>
  );
};

export default UserManagement;