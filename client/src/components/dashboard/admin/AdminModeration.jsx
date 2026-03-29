import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useGetPendingCompaniesQuery, useVerifyCompanyMutation, useRejectCompanyMutation } from "../../../redux/features/profileApiSlice";
import { CheckCircle, XCircle, Loader2, Building2, Mail, ExternalLink, X, Send } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "../../../styles/dashboardAdmin.module.css";

const SERVER_URL = "http://localhost:5000";

const AdminModeration = () => {
    const { data: companies = [], isLoading, error, refetch } = useGetPendingCompaniesQuery();
    const [verifyCompany, { isLoading: isVerifying }] = useVerifyCompanyMutation();
    const [rejectCompany, { isLoading: isRejecting }] = useRejectCompanyMutation();
    
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [refusalReason, setRefusalReason] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleApprove = async (id) => {
        try {
            await verifyCompany(id).unwrap();
            alert("Entreprise approuvée avec succès !");
        } catch (err) {
            console.error("Failed to verify company:", err);
            alert("Erreur lors de la validation");
        }
    };

    const handleRejectClick = (company) => {
        setSelectedCompany(company);
        setRefusalReason("");
        setIsModalOpen(true);
    };

    const handleConfirmReject = async () => {
        if (!selectedCompany) return;
        try {
            await rejectCompany({ 
                companyId: selectedCompany._id, 
                reason: refusalReason 
            }).unwrap();
            setIsModalOpen(false);
            setSelectedCompany(null);
        } catch (err) {
            console.error("Failed to reject company:", err);
            alert("L'action a échoué.");
        }
    };

    if (isLoading) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', paddingTop: '50px' }}>
                <Loader2 className="animate-spin" size={40} color="#24416b" />
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

            {error && (
                <div style={{ padding: '12px', background: '#fef2f2', border: '1.5px solid #fee2e2', borderRadius: '10px', color: '#ef4444', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                    ⚠️ {error?.data?.message || "Erreur lors du chargement des données"}
                </div>
            )}

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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Link to={`/user/company/${company._id}`} title="Voir le profil public" style={{ display: 'flex', alignItems: 'center' }}>
                                                {company.logoUrl ? (
                                                    <img 
                                                        src={`${SERVER_URL}/${company.logoUrl}`} 
                                                        alt="logo" 
                                                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                                                    />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Building2 size={20} color="#94a3b8" />
                                                    </div>
                                                )}
                                            </Link>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    {company.companyName || "Nom inconnu"}
                                                    <Link to={`/user/company/${company._id}`} style={{ color: '#24416b' }} title="Voir le profil">
                                                        <ExternalLink size={14} />
                                                    </Link>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{company.siret}</div>
                                            </div>
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
                                    <td className={styles.td} style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button 
                                                className={styles.addBtnBlue} 
                                                onClick={() => handleApprove(company._id)}
                                                disabled={isVerifying}
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                <CheckCircle size={14} /> Approuver
                                            </button>
                                            <button 
                                                className={styles.deleteBtn} 
                                                onClick={() => handleRejectClick(company)}
                                                disabled={isRejecting}
                                                style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid #fee2e2' }}
                                            >
                                                <XCircle size={14} /> Refuser
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de motif de refus */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
                        <div className={styles.modalHeader}>
                            <h3>Motif du refus</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>
                                Vous allez refuser l'entreprise <strong>{selectedCompany?.companyName}</strong>. 
                                Veuillez saisir un motif de refus qui sera communiqué à l'entreprise.
                            </p>
                            <textarea 
                                value={refusalReason}
                                onChange={(e) => setRefusalReason(e.target.value)}
                                placeholder="Ex: Documents incomplets, SIRET invalide..."
                                style={{ 
                                    width: '100%', 
                                    height: '120px', 
                                    padding: '12px', 
                                    borderRadius: '12px', 
                                    border: '1.5px solid #e2e8f0',
                                    outline: 'none',
                                    fontSize: '14px',
                                    resize: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                className={styles.button} 
                                style={{ flex: 1, background: '#ef4444' }}
                                onClick={handleConfirmReject}
                                disabled={isRejecting}
                            >
                                {isRejecting ? <Loader2 className="animate-spin" size={18} /> : "Confirmer le refus"}
                            </button>
                            <button 
                                className={styles.button} 
                                style={{ flex: 1, background: '#f1f5f9', color: '#334155', boxShadow: 'none' }}
                                onClick={() => setIsModalOpen(false)}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminModeration;