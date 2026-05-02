import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import axios from "axios";
import { selectPermissions } from "../../redux/features/auth/authSlice";
import { 
  useGetCompanyFollowersQuery, 
  useGetBlockedUsersQuery,
  useToggleBlockFollowerMutation 
} from "../../redux/features/company/companyApiSlice";
import CompanyUsersList from "../../components/dashboard/Company/CompanyUsersList";
import AddUserModal from "../../components/dashboard/Company/AddUserModal.jsx";
import { Settings, Shield, Plus, Trash2, X, UserX, UserCheck, Search, Mail, Phone, Clock, Ban } from "lucide-react";
import styles from  "../../styles/UserManagement.module.css"; 

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState("team"); // 'team', 'followers', 'blocked'
  const [showModal, setShowModal] = useState(false);
  const permissions = useSelector(selectPermissions);
  const authUser = useSelector((state) => state.auth.user); 
  
  const [refreshKey, setRefreshKey] = useState(0);
  const listRef = useRef();

  const { data: followers = [], refetch: refetchFollowers } = useGetCompanyFollowersQuery(undefined, { pollingInterval: 3000 });
  const { data: blockedUsers = [], refetch: refetchBlocked } = useGetBlockedUsersQuery(undefined, { pollingInterval: 3000 });
  const [toggleBlock, { isLoading: isBlocking }] = useToggleBlockFollowerMutation();
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const token = useSelector((state) => state.auth.token) || localStorage.getItem("accessToken");

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
    fetchRoles(); 
  }, [token]);

  const handleUserAdded = () => {
    setRefreshKey((prev) => prev + 1);
    listRef.current?.refetchUsers();
  };

  const initiateToggleBlock = (follower) => {
    setUserToToggle(follower);
    setShowConfirm(true);
  };

  const confirmToggleBlock = async () => {
    if (!userToToggle) return;
    try {
      await toggleBlock(userToToggle._id).unwrap();
      setShowConfirm(false);
      setUserToToggle(null);
    } catch (err) {
      console.error("Erreur blocage:", err);
    }
  };

  const currentList = activeTab === 'blocked' ? blockedUsers : followers;

  const filteredItems = currentList.filter(f => 
    f.user_id?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.user_id?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canBlock = permissions.includes("block_user") || permissions.includes("all_access");

  return (
    <div className={styles.container}>
      {/* HEADER SECTION */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Gestion des Utilisateurs</h1>
          <p>Administrez votre équipe et gérez vos abonnés</p>
        </div>
        
        {activeTab === 'team' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={styles.addButton} onClick={() => setShowModal(true)}>
              <Plus size={18} style={{ marginRight: '8px' }} />
              Ajouter un membre
            </button>
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab("team")}
          style={{ 
            padding: '12px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'team' ? '3px solid #1E3A5F' : '3px solid transparent',
            color: activeTab === 'team' ? '#1E3A5F' : '#64748b',
            fontWeight: '700',
            cursor: 'pointer',
            transition: '0.2s'
          }}
        >
          Équipe
        </button>
        <button 
          onClick={() => setActiveTab("followers")}
          style={{ 
            padding: '12px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'followers' ? '3px solid #1E3A5F' : '3px solid transparent',
            color: activeTab === 'followers' ? '#1E3A5F' : '#64748b',
            fontWeight: '700',
            cursor: 'pointer',
            transition: '0.2s'
          }}
        >
          Abonnés ({followers.length})
        </button>
        <button 
          onClick={() => setActiveTab("blocked")}
          style={{ 
            padding: '12px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'blocked' ? '3px solid #ef4444' : '3px solid transparent',
            color: activeTab === 'blocked' ? '#ef4444' : '#64748b',
            fontWeight: '700',
            cursor: 'pointer',
            transition: '0.2s'
          }}
        >
          Bloqués ({blockedUsers.length})
        </button>
      </div>

      {activeTab === 'team' ? (
        <div className={styles.tableWrapper}>
          <CompanyUsersList refreshKey={refreshKey} ref={listRef} />
        </div>
      ) : (
        <div className={styles.followersSection}>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder={activeTab === 'blocked' ? "Rechercher un utilisateur bloqué..." : "Rechercher un abonné..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px 10px 10px 40px', 
                  borderRadius: '10px', 
                  border: '1px solid #e2e8f0',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Utilisateur</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Contact</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{activeTab === 'blocked' ? 'Bloqué le' : 'Abonné depuis'}</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Statut</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      {activeTab === 'blocked' ? 'Aucun utilisateur bloqué.' : 'Aucun abonné trouvé.'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((f) => (
                    <tr key={f._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#1E3A5F' 
                          }}>
                            {f.user_id?.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{f.user_id?.fullName}</div>
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={14} /> {f.user_id?.email}</div>
                          {f.user_id?.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}><Phone size={14} /> {f.user_id.phone}</div>}
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={14} /> {new Date(activeTab === 'blocked' ? f.updatedAt : f.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                          background: f.is_blocked ? '#fef2f2' : '#f0fdf4',
                          color: f.is_blocked ? '#ef4444' : '#16a34a'
                        }}>
                          {f.is_blocked ? 'BLOQUÉ' : 'ACTIF'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {canBlock && (
                          <button 
                            onClick={() => initiateToggleBlock(f)}
                            disabled={isBlocking}
                            style={{ 
                              padding: '8px', borderRadius: '8px', border: '1px solid',
                              borderColor: f.is_blocked ? '#dcfce7' : '#fee2e2',
                              background: f.is_blocked ? '#f0fdf4' : '#fef2f2',
                              color: f.is_blocked ? '#16a34a' : '#ef4444',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
                            }}
                            title={f.is_blocked ? "Débloquer" : "Bloquer"}
                          >
                            {f.is_blocked ? <UserCheck size={18} /> : <Ban size={18} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION BLOCAGE */}
      <AnimatePresence>
        {showConfirm && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 1000, backdropFilter: 'blur(4px)'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ 
                background: 'white', padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '90%',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '50%', 
                  background: userToToggle?.is_blocked ? '#f0fdf4' : '#fef2f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px'
                }}>
                  {userToToggle?.is_blocked ? <UserCheck size={30} color="#16a34a" /> : <Ban size={30} color="#ef4444" />}
                </div>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.2rem' }}>
                  {userToToggle?.is_blocked ? 'Débloquer l\'utilisateur ?' : 'Bloquer l\'utilisateur ?'}
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Êtes-vous sûr de vouloir {userToToggle?.is_blocked ? 'débloquer' : 'bloquer'} <strong>{userToToggle?.user_id?.fullName}</strong> ? 
                  {!userToToggle?.is_blocked && " Cet utilisateur ne pourra plus suivre vos activités."}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setShowConfirm(false)}
                  style={{ 
                    flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0',
                    background: 'white', color: '#64748b', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmToggleBlock}
                  disabled={isBlocking}
                  style={{ 
                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                    background: userToToggle?.is_blocked ? '#16a34a' : '#ef4444', 
                    color: 'white', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {isBlocking ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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