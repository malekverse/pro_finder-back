import { useSelector } from "react-redux";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { selectPermissions } from "../../redux/features/auth/authSlice";
import { PERMISSIONS } from "../../constants/permissions";
import CompanyUsersList from "../../components/dashboard/Company/CompanyUsersList";
import AddUserModal from "../../components/dashboard/Company/AddUserModal.jsx";
import { Settings, Shield, Plus, Trash2, X } from "lucide-react";
import styles from  "../../styles/UserManagement.module.css"; 

const UserManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const permissions = useSelector(selectPermissions);
  const authUser = useSelector((state) => state.auth.user); 
  
  const [refreshKey, setRefreshKey] = useState(0);
  const listRef = useRef();

  const [followers, setFollowers] = useState([]); 
  const [roles, setRoles] = useState([]);
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

  const fetchRoles = async () => {
    if (!token) return;
    try {
      const response = await axios.get("http://localhost:5000/roles/getRoles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(response.data);
    } catch (err) {
      console.error("Erreur récupération rôles:", err);
    }
  };

  useEffect(() => {
    fetchFollowers();
    fetchRoles(); 
  }, [token]);

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
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={styles.addButton} onClick={() => setShowModal(true)}>
            <Plus size={18} style={{ marginRight: '8px' }} />
            Ajouter un membre
          </button>
        </div>
      </div>

      {/* PERMISSIONS ACTIONS TOOLBAR */}
      <div className={styles.actionToolbar}>
        {permissions.includes(PERMISSIONS.CREATE_POST) && (
          <button className={styles.actionButton}>Créer un Post</button>
        )}
        {permissions.includes(PERMISSIONS.VIEW_FOLLOWERS) && (
          <button className={styles.actionButton}>Voir Abonnés</button>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className={styles.tableWrapper}>
        <CompanyUsersList refreshKey={refreshKey} ref={listRef} />
      </div>

      {/* MODAL AJOUT UTILISATEUR */}
      {showModal && (
        <AddUserModal 
          onClose={() => setShowModal(false)} 
          onUserAdded={handleUserAdded}
          followers={followers} 
          availableRoles={roles}
        />
      )}
    </div>
  );
};

export default UserManagement;