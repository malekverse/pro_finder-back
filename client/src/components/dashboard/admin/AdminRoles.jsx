import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Plus, Edit, Trash2, Search, Loader2, X, GripVertical } from "lucide-react";
import { PERMISSIONS } from "../../../constants/permissions";
import styles from "../../../styles/dashboardAdmin.module.css";

const AdminRoles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // États pour la modale
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ name: "", permissions: [] });

    // Liste de toutes les permissions disponibles (depuis les constantes)
    const availablePermissions = Object.values(PERMISSIONS);

    const API_BASE = "http://localhost:5000/roles";

    // Fonction pour récupérer les rôles
    const fetchRoles = async (showLoader = false) => {
    try {
        if (showLoader) setLoading(true);

        const token = localStorage.getItem("accessToken");

        const res = await axios.get(`${API_BASE}/getRoles`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        setRoles(res.data);

    } catch (err) {
        console.error("Erreur fetchRoles:", err);
    } finally {
        if (showLoader) setLoading(false);
    }
};

    useEffect(() => {
    fetchRoles(true); // loader seulement au début

    const interval = setInterval(() => {
        fetchRoles(false); // refresh sans loader
    }, 3000);

    return () => clearInterval(interval);
}, []);

    // Gestion de la modale
    const handleOpenModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                permissions: Array.isArray(role.permissions) ? role.permissions : []
            });
        } else {
            setEditingRole(null);
            setFormData({ name: "", permissions: [] });
        }
        setShowModal(true);
    };

    const togglePermission = (perm) => {
        setFormData(prev => {
            const isSelected = prev.permissions.includes(perm);
            if (isSelected) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== perm) };
            } else {
                return { ...prev, permissions: [...prev.permissions, perm] };
            }
        });
    };

    // --- LOGIQUE DRAG & DROP SIMPLIFIÉE (Réorganisation manuelle par clic ou tri) ---
    const handleDragStart = (e, index) => {
        e.dataTransfer.setData("dragIndex", index);
    };

    const handleDrop = (e, dropIndex) => {
        const dragIndex = e.dataTransfer.getData("dragIndex");
        if (dragIndex === "" || dragIndex == dropIndex) return;

        const newPermissions = [...formData.permissions];
        const [removed] = newPermissions.splice(dragIndex, 1);
        newPermissions.splice(dropIndex, 0, removed);

        setFormData({ ...formData, permissions: newPermissions });
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Nécessaire pour permettre le drop
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("accessToken");
        try {
            if (editingRole) {
                await axios.put(`${API_BASE}/${editingRole._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE}/createRole`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchRoles();
        } catch (err) {
            alert(err.response?.data?.message || "Une erreur est survenue");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer ce rôle ?")) return;
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${API_BASE}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(roles.filter(r => r._id !== id));
        } catch (err) {
            alert("Erreur lors de la suppression");
        }
    };

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin" size={40} color="#24416b" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 className={styles.title} style={{ margin: 0 }}>Gestion des Rôles</h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>Définissez les types d'utilisateurs et leurs permissions d'accès.</p>
                </div>
                <button className={styles.addBtnBlue} onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Nouveau Rôle
                </button>
            </div>

            <div className={styles.gridWrapper} style={{ gridTemplateColumns: 'repeat(1, 1fr)', marginBottom: '40px' }}>
                <div className={styles.cardStat} style={{ maxWidth: '300px' }}>
                    <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#24416b' }}><ShieldCheck size={24} /></div>
                    <div className={styles.statInfo}><p>Total Rôles</p><strong>{roles.length}</strong></div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead className={styles.thead}>
                        <tr>
                            <th className={styles.th}>NOM DU RÔLE</th>
                            <th className={styles.th}>PERMISSIONS</th>
                            <th className={styles.th} style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRoles.map((role) => (
                            <tr key={role._id} className={styles.tr}>
                                <td className={styles.td}>
                                    <span style={{ fontWeight: '700', color: '#1e293b' }}>{role.name}</span>
                                </td>
                                <td className={styles.td}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {role.permissions?.map((p, i) => (
                                            <span key={i} className={styles.codeBadge} style={{ background: '#eff6ff', color: '#24416b', border: '1px solid #dbeafe', fontSize: '11px' }}>
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className={styles.td} style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                        <Edit
                                            size={18}
                                            style={{ cursor: 'pointer', color: '#3b82f6' }}
                                            onClick={() => handleOpenModal(role)}
                                        />
                                        <Trash2
                                            size={18}
                                            style={{ cursor: 'pointer', color: '#ef4444' }}
                                            onClick={() => handleDelete(role._id)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODALE D'AJOUT / EDITION AVEC DRAG & DROP TAGS */}
            {showModal && (
                <div className={styles.modalOverlay} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className={styles.modalContent} style={{
                        backgroundColor: 'white', padding: '30px', borderRadius: '12px',
                        width: '500px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <X
                            size={20}
                            style={{ position: 'absolute', right: '20px', top: '20px', cursor: 'pointer' }}
                            onClick={() => setShowModal(false)}
                        />
                        <h3 className={styles.cardTitle} style={{ marginBottom: '25px' }}>
                            {editingRole ? "Modifier le rôle" : "Nouveau rôle"}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            {/* Nom du rôle */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                    Nom du rôle
                                </label>
                                <input
                                    className={styles.searchInput}
                                    style={{ width: '100%', padding: '12px' }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ex: Manager, Éditeur..."
                                />
                            </div>

                            {/* Sélection des permissions (Tags) */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '10px', fontWeight: '600' }}>
                                    Sélectionner les permissions
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                                    {availablePermissions.map((perm) => (
                                        <button
                                            key={perm}
                                            type="button"
                                            onClick={() => togglePermission(perm)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                backgroundColor: formData.permissions.includes(perm) ? '#eff6ff' : 'white',
                                                color: formData.permissions.includes(perm) ? '#24416b' : '#64748b',
                                                borderColor: formData.permissions.includes(perm) ? '#24416b' : '#e2e8f0',
                                                transition: '0.2s'
                                            }}
                                        >
                                            {perm}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ordonner les permissions (Drag & Drop) */}
                            {formData.permissions.length > 0 && (
                                <div style={{ marginBottom: '25px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '10px', color: '#64748b', fontStyle: 'italic' }}>
                                        Glissez-déposez pour réorganiser l'ordre des permissions :
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {formData.permissions.map((perm, index) => (
                                            <div
                                                key={perm}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, index)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, index)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '10px 15px',
                                                    backgroundColor: '#f8fafc',
                                                    borderRadius: '8px',
                                                    border: '1px dashed #cbd5e1',
                                                    cursor: 'grab'
                                                }}
                                            >
                                                <GripVertical size={16} style={{ color: '#94a3b8', marginRight: '10px' }} />
                                                <span style={{ fontSize: '14px', fontWeight: '500' }}>{perm}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className={styles.addBtnBlue} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                                {editingRole ? "Mettre à jour" : "Créer le rôle"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRoles;