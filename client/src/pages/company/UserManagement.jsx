import { useSelector } from "react-redux";
import { useState } from "react";
import { selectPermissions } from "../../redux/features/auth/authSlice";
import { PERMISSIONS } from "../../constants/permissions";
import CompanyUsersList from "../../components/dashboard/Company/CompanyUsersList";
import AddUserModal from "../../components/dashboard/Company/AddUserModal.jsx";
import styles from  "../../styles/UserManagement.module.css"; 

const UserManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const permissions = useSelector(selectPermissions);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUserAdded = () => {
    setRefreshKey((prev) => prev + 1);
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
        <CompanyUsersList refreshKey={refreshKey} />
      </div>

      {/* MODAL SECTION */}
      {showModal && (
        <AddUserModal 
          onClose={() => setShowModal(false)} 
          onUserAdded={handleUserAdded} 
        />
      )}
    </div>
  );
};

export default UserManagement;