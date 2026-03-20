import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Plus, Edit, Trash2, Search, Loader2, X } from "lucide-react";
import styles from "../../../styles/dashboardAdmin.module.css"; 

const AdminRoles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // États pour la modale
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ name: "", permissions: "" });

    const API_BASE = "http://localhost:5000/roles";

    // Fonction pour récupérer les rôles
    const fetchRoles = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${API_BASE}/getRoles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(res.data);
        } catch (err) { 
            console.error("Erreur fetchRoles:", err); 
            if(err.response?.status === 403) {
                console.error("Accès refusé : Vérifie ton token ou tes droits admin.");
            }
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        fetchRoles(); 
    }, []);

    // Gestion de la modale
    const handleOpenModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({ name: role.name, permissions: role.permissions });
        } else {
            setEditingRole(null);
            setFormData({ name: "", permissions: "" });
        }
        setShowModal(true);
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
                <Loader2 className="animate-spin" size={40} color="#2563eb" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Gestion des Accès</h1>

            <div className={styles.actionBar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Rechercher un rôle..." 
                        className={styles.searchInput}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className={styles.addBtnBlue} onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Ajouter un Rôle
                </button>
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
                                <td className={styles.td}><strong>{role.name}</strong></td>
                                <td className={styles.td}>{role.permissions}</td>
                                <td className={styles.td}>
                                    <div className={styles.actionsFlex} style={{ justifyContent: 'center' }}>
                                        <Edit 
                                            size={18} 
                                            className={styles.editBtnIcon} 
                                            onClick={() => handleOpenModal(role)} 
                                        />
                                        <Trash2 
                                            size={18} 
                                            className={styles.deleteBtnIcon} 
                                            onClick={() => handleDelete(role._id)} 
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODALE D'AJOUT / EDITION */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <X 
                            size={20} 
                            style={{ position: 'absolute', right: '20px', top: '20px', cursor: 'pointer' }} 
                            onClick={() => setShowModal(false)} 
                        />
                        <h3 className={styles.cardTitle}>
                            {editingRole ? "Modifier le rôle" : "Nouveau rôle"}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Nom du rôle
                                </label>
                                <input 
                                    className={styles.searchInput} 
                                    style={{ width: '100%' }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Permissions
                                </label>
                                <textarea 
                                    className={styles.searchInput} 
                                    style={{ width: '100%', height: '80px', paddingTop: '10px' }}
                                    value={formData.permissions}
                                    placeholder="Ex: view_users, create_post..."
                                    onChange={(e) => setFormData({...formData, permissions: e.target.value})}
                                    required
                                />
                            </div>
                            <button type="submit" className={styles.addBtnBlue} style={{ width: '100%', justifyContent: 'center' }}>
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