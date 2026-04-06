import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useGetPendingCompaniesQuery, useVerifyCompanyMutation, useRejectCompanyMutation, useContactCompanyMutation } from "../../../redux/features/profileApiSlice";
import { useGetAllReportsQuery, useUpdateReportStatusMutation } from "../../../redux/features/reportApiSlice";
import { CheckCircle, XCircle, Loader2, Building2, Mail, ExternalLink, X, Send, Flag, AlertTriangle, CheckSquare, Trash2, Info } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "../../../styles/dashboardAdmin.module.css";

const SERVER_URL = "http://localhost:5000";

const AdminModeration = () => {
    const [activeTab, setActiveTab] = useState("companies"); // 'companies' or 'reports'
    
    // Companies logic
    const { data: companies = [], isLoading: loadingCompanies, error: errorCompanies, refetch: refetchCompanies } = useGetPendingCompaniesQuery(undefined, { pollingInterval: 3000 });
    const [verifyCompany, { isLoading: isVerifying }] = useVerifyCompanyMutation();
    const [rejectCompany, { isLoading: isRejecting }] = useRejectCompanyMutation();
    const [contactCompany, { isLoading: isContacting }] = useContactCompanyMutation();
    
    // Reports logic
    const { data: reports = [], isLoading: loadingReports, error: errorReports, refetch: refetchReports } = useGetAllReportsQuery(undefined, { pollingInterval: 3000 });
    const [updateReportStatus, { isLoading: isUpdatingReport }] = useUpdateReportStatusMutation();
    
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [refusalReason, setRefusalReason] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactMessage, setContactMessage] = useState("");
    const [contactType, setContactType] = useState("manual"); // 'manual' or 'pending'
    const [isReportActionModalOpen, setIsReportActionModalOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");

    const handleApprove = async (id) => {
        try {
            await verifyCompany(id).unwrap();
            alert("Entreprise approuvée avec succès ! Un email de bienvenue a été envoyé.");
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
            alert("Entreprise refusée. Un email a été envoyé avec le motif.");
        } catch (err) {
            console.error("Failed to reject company:", err);
            alert("L'action a échoué.");
        }
    };

    const handleContactClick = (company) => {
        setSelectedCompany(company);
        setContactMessage("");
        setContactType("manual");
        setIsContactModalOpen(true);
    };

    const handleConfirmContact = async () => {
        if (!selectedCompany) return;
        try {
            const finalMessage = contactType === "pending" 
                ? "Votre dossier est actuellement en cours d'examen par notre équipe de modération. Nous vous contacterons prochainement."
                : contactMessage;

            if (!finalMessage && contactType === "manual") {
                alert("Veuillez saisir un message.");
                return;
            }

            await contactCompany({
                companyId: selectedCompany._id,
                message: finalMessage,
                type: contactType
            }).unwrap();
            
            setIsContactModalOpen(false);
            setSelectedCompany(null);
            alert("Email envoyé avec succès !");
        } catch (err) {
            console.error("Failed to contact company:", err);
            const errorMessage = err?.data?.message || "L'envoi de l'email a échoué.";
            const errorDetails = err?.data?.details || "";
            alert(`${errorMessage}${errorDetails ? '\n\n' + errorDetails : ''}`);
        }
    };

    const handleReportActionClick = (report) => {
        setSelectedReport(report);
        setAdminNotes(report.adminNotes || "");
        setIsReportActionModalOpen(true);
    };

    const handleUpdateReport = async (status) => {
        if (!selectedReport) return;
        try {
            await updateReportStatus({
                reportId: selectedReport._id,
                status,
                adminNotes
            }).unwrap();
            setIsReportActionModalOpen(false);
            setSelectedReport(null);
        } catch (err) {
            console.error("Failed to update report status:", err);
            alert("L'action a échoué.");
        }
    };

    if (loadingCompanies || loadingReports) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', paddingTop: '50px' }}>
                <Loader2 className="animate-spin" size={40} color="#24416b" />
                <p>Chargement des données de modération...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Supervision et Modération</h1>
            
            {/* TABS */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #e2e8f0' }}>
                <button 
                    onClick={() => setActiveTab("companies")}
                    style={{ 
                        padding: '12px 20px', 
                        background: 'none', 
                        border: 'none', 
                        borderBottom: activeTab === 'companies' ? '3px solid #24416b' : '3px solid transparent',
                        color: activeTab === 'companies' ? '#24416b' : '#64748b',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '15px',
                        transition: '0.2s'
                    }}
                >
                    Nouvelles Entreprises ({companies.length})
                </button>
                <button 
                    onClick={() => setActiveTab("reports")}
                    style={{ 
                        padding: '12px 20px', 
                        background: 'none', 
                        border: 'none', 
                        borderBottom: activeTab === 'reports' ? '3px solid #ef4444' : '3px solid transparent',
                        color: activeTab === 'reports' ? '#ef4444' : '#64748b',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '15px',
                        transition: '0.2s'
                    }}
                >
                    Signalements ({reports.filter(r => r.status === 'pending').length})
                </button>
            </div>

            {activeTab === 'companies' ? (
                <>
                    <p style={{ color: '#64748b', marginBottom: '20px' }}>
                        Validez les nouvelles entreprises pour leur donner accès à la plateforme.
                    </p>

                    {(errorCompanies) && (
                        <div style={{ padding: '12px', background: '#fef2f2', border: '1.5px solid #fee2e2', borderRadius: '10px', color: '#ef4444', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                            ⚠️ {errorCompanies?.data?.message || "Erreur lors du chargement des données"}
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
                                                        onClick={() => handleContactClick(company)}
                                                        disabled={isContacting}
                                                        style={{ 
                                                            padding: '6px 12px', 
                                                            fontSize: '12px', 
                                                            backgroundColor: '#f1f5f9', 
                                                            color: '#475569',
                                                            border: '1.5px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        <Mail size={14} /> Contacter
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
                </>
            ) : (
                <>
                    <p style={{ color: '#64748b', marginBottom: '20px' }}>
                        Gérez les signalements effectués par les utilisateurs concernant les entreprises.
                    </p>

                    {(errorReports) && (
                        <div style={{ padding: '12px', background: '#fef2f2', border: '1.5px solid #fee2e2', borderRadius: '10px', color: '#ef4444', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                            ⚠️ {errorReports?.data?.message || "Erreur lors du chargement des signalements"}
                        </div>
                    )}

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead className={styles.thead}>
                                <tr>
                                    <th className={styles.th}>ENTREPRISE SIGNALÉE</th>
                                    <th className={styles.th}>SIGNALÉ PAR</th>
                                    <th className={styles.th}>RAISON</th>
                                    <th className={styles.th}>STATUT</th>
                                    <th className={styles.th} style={{ textAlign: 'center' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                            <Flag size={40} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
                                            Aucun signalement pour le moment.
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map((report) => (
                                        <tr key={report._id} className={styles.tr}>
                                            <td className={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {report.company_id?.logoUrl ? (
                                                        <img 
                                                            src={`${SERVER_URL}/${report.company_id.logoUrl}`} 
                                                            alt="logo" 
                                                            style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} 
                                                        />
                                                    ) : (
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Building2 size={18} color="#94a3b8" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{report.company_id?.companyName}</div>
                                                        <Link to={`/user/company/${report.company_id?._id}`} style={{ fontSize: '11px', color: '#24416b', textDecoration: 'underline' }}>
                                                            Voir le profil
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div style={{ fontSize: '13px', fontWeight: '500' }}>{report.reporter_id?.fullName}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{report.reporter_id?.email}</div>
                                            </td>
                                            <td className={styles.td}>
                                                <div style={{ 
                                                    maxWidth: '200px', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '13px',
                                                    color: '#475569'
                                                }} title={report.reason}>
                                                    {report.reason}
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <span style={{ 
                                                    padding: '4px 10px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '11px', 
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    backgroundColor: 
                                                        report.status === 'pending' ? '#fef2f2' : 
                                                        report.status === 'reviewed' ? '#eff6ff' : 
                                                        report.status === 'resolved' ? '#f0fdf4' : '#f1f5f9',
                                                    color: 
                                                        report.status === 'pending' ? '#ef4444' : 
                                                        report.status === 'reviewed' ? '#2563eb' : 
                                                        report.status === 'resolved' ? '#16a34a' : '#475569'
                                                }}>
                                                    {report.status === 'pending' ? 'En attente' : 
                                                     report.status === 'reviewed' ? 'En examen' : 
                                                     report.status === 'resolved' ? 'Résolu' : 'Classé'}
                                                </span>
                                            </td>
                                            <td className={styles.td} style={{ textAlign: 'center' }}>
                                                <button 
                                                    className={styles.addBtnBlue} 
                                                    onClick={() => handleReportActionClick(report)}
                                                    style={{ padding: '6px 10px', fontSize: '11px', background: '#1e293b' }}
                                                >
                                                    Gérer
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modal de motif de refus (Companies) */}
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

            {/* Modal de gestion de signalement */}
            {isReportActionModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '550px' }}>
                        <div className={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Flag size={20} color="#ef4444" />
                                <h3>Gérer le signalement</h3>
                            </div>
                            <button onClick={() => setIsReportActionModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px', fontWeight: '700' }}>RAISON DU SIGNALEMENT :</div>
                                <div style={{ fontSize: '14px', color: '#1e293b', fontStyle: 'italic' }}>"{selectedReport?.reason}"</div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>NOTES DE L'ADMINISTRATEUR (INTERNE)</label>
                                <textarea 
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Ajoutez des notes sur votre décision..."
                                    style={{ 
                                        width: '100%', 
                                        height: '80px', 
                                        padding: '12px', 
                                        borderRadius: '12px', 
                                        border: '1.5px solid #e2e8f0',
                                        outline: 'none',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button 
                                    onClick={() => handleUpdateReport('reviewed')}
                                    disabled={isUpdatingReport}
                                    style={{ 
                                        padding: '12px', 
                                        borderRadius: '10px', 
                                        border: '1px solid #dbeafe', 
                                        background: '#eff6ff', 
                                        color: '#2563eb', 
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <AlertTriangle size={16} /> Mettre en examen
                                </button>
                                <button 
                                    onClick={() => handleUpdateReport('resolved')}
                                    disabled={isUpdatingReport}
                                    style={{ 
                                        padding: '12px', 
                                        borderRadius: '10px', 
                                        border: '1px solid #dcfce7', 
                                        background: '#f0fdf4', 
                                        color: '#16a34a', 
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <CheckSquare size={16} /> Marquer comme résolu
                                </button>
                                <button 
                                    onClick={() => handleUpdateReport('dismissed')}
                                    disabled={isUpdatingReport}
                                    style={{ 
                                        padding: '12px', 
                                        borderRadius: '10px', 
                                        border: '1px solid #f1f5f9', 
                                        background: '#f8fafc', 
                                        color: '#475569', 
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <X size={16} /> Classer sans suite
                                </button>
                                <button 
                                    onClick={() => {
                                        // Optionnel: On pourrait rediriger vers le rejet de l'entreprise directement
                                        handleRejectClick(selectedReport.company_id);
                                        setIsReportActionModalOpen(false);
                                    }}
                                    disabled={isUpdatingReport}
                                    style={{ 
                                        padding: '12px', 
                                        borderRadius: '10px', 
                                        border: '1px solid #fee2e2', 
                                        background: '#fef2f2', 
                                        color: '#ef4444', 
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Trash2 size={16} /> Bloquer/Rejeter l'entreprise
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de contact (Manual Email) */}
            {isContactModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
                        <div className={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Mail size={20} color="#24416b" />
                                <h3>Contacter l'entreprise</h3>
                            </div>
                            <button onClick={() => setIsContactModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>
                                Destinataire : <strong>{selectedCompany?.companyName}</strong> ({selectedCompany?.email})
                            </p>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <button 
                                    onClick={() => setContactType("pending")}
                                    style={{ 
                                        flex: 1, 
                                        padding: '10px', 
                                        borderRadius: '8px', 
                                        border: contactType === 'pending' ? '2px solid #24416b' : '1px solid #e2e8f0',
                                        backgroundColor: contactType === 'pending' ? '#eff6ff' : 'white',
                                        color: contactType === 'pending' ? '#24416b' : '#64748b',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                                    }}
                                >
                                    <Info size={16} /> En attente
                                </button>
                                <button 
                                    onClick={() => setContactType("manual")}
                                    style={{ 
                                        flex: 1, 
                                        padding: '10px', 
                                        borderRadius: '8px', 
                                        border: contactType === 'manual' ? '2px solid #24416b' : '1px solid #e2e8f0',
                                        backgroundColor: contactType === 'manual' ? '#eff6ff' : 'white',
                                        color: contactType === 'manual' ? '#24416b' : '#64748b',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                                    }}
                                >
                                    <Send size={16} /> Manuel
                                </button>
                            </div>

                            {contactType === "pending" ? (
                                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                                    <strong>Message pré-défini :</strong><br />
                                    "Votre dossier est actuellement en cours d'examen par notre équipe de modération. Nous vous contacterons prochainement."
                                </div>
                            ) : (
                                <textarea 
                                    value={contactMessage}
                                    onChange={(e) => setContactMessage(e.target.value)}
                                    placeholder="Saisissez votre message ici..."
                                    style={{ 
                                        width: '100%', 
                                        height: '150px', 
                                        padding: '12px', 
                                        borderRadius: '12px', 
                                        border: '1.5px solid #e2e8f0',
                                        outline: 'none',
                                        fontSize: '14px',
                                        resize: 'none'
                                    }}
                                />
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                className={styles.button} 
                                style={{ flex: 1, background: '#24416b' }}
                                onClick={handleConfirmContact}
                                disabled={isContacting}
                            >
                                {isContacting ? <Loader2 className="animate-spin" size={18} /> : "Envoyer l'email"}
                            </button>
                            <button 
                                className={styles.button} 
                                style={{ flex: 1, background: '#f1f5f9', color: '#334155', boxShadow: 'none' }}
                                onClick={() => setIsContactModalOpen(false)}
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