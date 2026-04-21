import { useState } from "react";
import { useSelector } from "react-redux";
import { 
  useGetProfessionalFollowersQuery,
  useGetFollowersStatsQuery,
  useGetBlockedProfessionalUsersQuery,
  useToggleBlockProfessionalFollowerMutation 
} from "../../redux/features/professional/professionalApiSlice";
import { Search, Mail, Phone, Clock, Ban, UserCheck, Users, UserX, Loader2 } from "lucide-react";
import styles from "../../styles/UserManagement.module.css";

const ProfessionalUserManagement = () => {
  const [activeTab, setActiveTab] = useState("followers"); // 'followers', 'blocked'
  const [searchTerm, setSearchTerm] = useState("");

  const { data: followers = [], isLoading: loadingFollowers, refetch: refetchFollowers } = useGetProfessionalFollowersQuery(undefined, { pollingInterval: 3000 });
  const { data: blockedUsers = [], isLoading: loadingBlocked, refetch: refetchBlocked } = useGetBlockedProfessionalUsersQuery(undefined, { pollingInterval: 3000 });
  const [toggleBlock, { isLoading: isBlocking }] = useToggleBlockProfessionalFollowerMutation();

  const handleToggleBlock = async (followId) => {
    try {
      await toggleBlock(followId).unwrap();
      refetchFollowers();
      refetchBlocked();
    } catch (err) {
      console.error("Erreur blocage:", err);
    }
  };

  const currentList = activeTab === 'blocked' ? blockedUsers : followers;

  const filteredItems = currentList.filter(f => 
    f.user_id?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.user_id?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Gestion des Abonnés</h1>
          <p>Gérez vos abonnés et votre liste noire</p>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab("followers")}
          style={{ 
            padding: '12px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === "followers" ? '3px solid #24416b' : '3px solid transparent',
            color: activeTab === "followers" ? '#24416b' : '#64748b',
            fontWeight: '700',
            cursor: 'pointer',
            transition: '0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={18} />
          Abonnés ({followers.length})
        </button>
        <button 
          onClick={() => setActiveTab("blocked")}
          style={{ 
            padding: '12px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === "blocked" ? '3px solid #ef4444' : '3px solid transparent',
            color: activeTab === "blocked" ? '#ef4444' : '#64748b',
            fontWeight: '700',
            cursor: 'pointer',
            transition: '0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <UserX size={18} />
          Liste Noire ({blockedUsers.length})
        </button>
      </div>

      <div className={styles.followersSection}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder={activeTab === 'blocked' ? "Rechercher dans la liste noire..." : "Rechercher un abonné..."}
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
          {(loadingFollowers || loadingBlocked) ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={32} color="#24416b" />
            </div>
          ) : (
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
                      {activeTab === 'blocked' ? 'Aucun utilisateur dans la liste noire.' : 'Aucun abonné trouvé.'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((f) => (
                    <tr key={f._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#24416b' 
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
                        <button 
                          onClick={() => handleToggleBlock(f._id)}
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalUserManagement;
