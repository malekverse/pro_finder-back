import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2, Building2, Mail } from "lucide-react";
import styles from "../../../styles/dashboardAdmin.module.css";

const AdminModeration = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE = "http://localhost:5000/admin";

    // fetchPending encapsulé dans useCallback pour éviter les boucles infinies dans useEffect
    const fetchPending = useCallback(async (isAutoRefresh = false) => {
        try {
            // On ne montre le loader principal que lors du premier chargement
            if (!isAutoRefresh) setLoading(true);

            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${API_BASE}/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCompanies(res.data);
            setError(null);
        } catch (err) {
            console.error("Erreur chargement modération:", err);
            // On ne met à jour l'erreur visuelle que si ce n'est pas un refresh automatique
            if (!isAutoRefresh) setError("Impossible de charger les entreprises en attente.");
        } finally {
            if (!isAutoRefresh) setLoading(false);
        }
    }, [API_BASE]);

    useEffect(() => {
        // 1. Premier chargement au montage du composant
        fetchPending();

        // 2. Mise en place du rafraîchissement automatique toutes les 10 secondes
        const interval = setInterval(() => {
            fetchPending(true);
        }, 10000);

        // 3. Nettoyage de l'intervalle au démontage
        return () => clearInterval(interval);
    }, [fetchPending]);

    const handleApprove = async (companyId) => {
        const token = localStorage.getItem("accessToken");
        try {
            await axios.put(`${API_BASE}/verify/${companyId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setCompanies(companies.filter(c => c._id !== companyId));
            alert("Entreprise approuvée avec succès !");
        } catch (err) {
            alert("Erreur lors de la validation : " + (err.response?.data?.message || "Erreur serveur"));
        }
    };

    const handleReject = async (companyId) => {
        if (!window.confirm("Voulez-vous vraiment refuser et supprimer ce profil ?")) return;
        
        const token = localStorage.getItem("accessToken");
        try {
            await axios.delete(`${API_BASE}/reject/${companyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompanies(companies.filter(c => c._id !== companyId));
        } catch (err) {
            alert("L'action a échoué.");
        }
    };

    if (loading) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', paddingTop: '50px' }}>
                <Loader2 className="animate-spin" size={40} color="#2563eb" />
                <p>Chargement des demandes...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Supervision et Modération</h1>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
                Validez les nouvelles entreprises pour leur donner accès à la plateforme.
            </p>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead className={styles.thead}>
                        <tr>
                            <th className={styles.th}>ENTREPRISE</th>
                            <th className={styles.th}>CONTACT</th>
                            <th className={styles.th}>STATUT</th>
                            <th className={styles.th} style={{ textAlign: 'center' }}>DÉCISION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    <Building2 size={40} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
                                    Aucune entreprise en attente de validation.
                                </td>
                            </tr>
                        ) : (
                            companies.map((company) => (
                                <tr key={company._id} className={styles.tr}>
                                    <td className={styles.td}>
                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                            {company.companyName || "Nom inconnu"}
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                                            <Mail size={14} /> {company.email}
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <span style={{ 
                                            padding: '4px 12px', 
                                            borderRadius: '20px', 
                                            fontSize: '12px', 
                                            backgroundColor: '#fef3c7', 
                                            color: '#92400e',
                                            fontWeight: '500' 
                                        }}>
                                            En attente
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <div className={styles.actionsFlex} style={{ justifyContent: 'center', gap: '15px' }}>
                                            <button 
                                                onClick={() => handleApprove(company._id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#10b981' }}
                                                title="Approuver l'entreprise"
                                            >
                                                <CheckCircle size={24} />
                                            </button>
                                            <button 
                                                onClick={() => handleReject(company._id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                title="Refuser l'entreprise"
                                            >
                                                <XCircle size={24} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminModeration;