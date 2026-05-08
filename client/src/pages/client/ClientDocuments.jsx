import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { 
  useGetUserQuotesQuery, 
  useUpdateQuoteStatusMutation 
} from "../../redux/features/company/quoteApiSlice";
import { 
  useGetUserContractsQuery, 
  useUpdateContractStatusMutation 
} from "../../redux/features/company/contractApiSlice";
import { useInitializePaymentMutation } from "../../redux/features/paymentApiSlice";
import { 
  FileSpreadsheet, FileSignature, Loader2, Calendar, 
  DollarSign, CheckCircle2, XCircle, Building2, Clock, FileText, Eye, X, Download, CreditCard
} from "lucide-react";
import styles from "../../styles/Commandes.module.css";
import { generateQuotePDF, generateContractPDF } from "../../utils/pdfGenerator";

const ClientDocuments = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "quotes");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);

  const { data: quotes = [], isLoading: loadingQuotes, refetch: refetchQuotes } = useGetUserQuotesQuery(undefined, { pollingInterval: 3000 });
  const { data: contracts = [], isLoading: loadingContracts, refetch: refetchContracts } = useGetUserContractsQuery(undefined, { pollingInterval: 3000 });
  
  const [updateQuoteStatus] = useUpdateQuoteStatusMutation();
  const [updateContractStatus] = useUpdateContractStatusMutation();
  const [initializePayment, { isLoading: isPaying }] = useInitializePaymentMutation();

  const handlePayment = async (item, type) => {
    try {
      const amount = item.totalAmount || item.totalPrice || item.totalValue || (item.serviceId?.price);
      if (!amount) return alert("Montant invalide");

      const res = await initializePayment({
        items: [
          {
            entityId: item._id,
            entityType: type === 'quote' ? 'Quote' : type === 'contract' ? 'Contract' : type === 'reservation' ? 'Reservation' : 'Order'
          }
        ],
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      }).unwrap();

      if (res.result_url) {
        window.location.href = res.result_url;
      }
    } catch (err) {
      console.error("Payment initialization failed:", err);
      alert(err.data?.message || "Erreur lors de l'initialisation du paiement");
    }
  };

  const handleQuoteAction = async (id, status) => {
    if (window.confirm(`Voulez-vous vraiment ${status === 'accepted' ? 'accepter' : 'refuser'} ce devis ?`)) {
      try {
        console.log("🚀 [handleQuoteAction] Updating quote status:", { id, status });
        const response = await updateQuoteStatus({ id, status }).unwrap();
        console.log("✅ [handleQuoteAction] Update success:", response);
        // Force refetch and wait for it
        await refetchQuotes();
      } catch (err) {
        console.error("❌ [handleQuoteAction] Action échouée:", err);
        alert(`Erreur: ${err.data?.message || "Une erreur est survenue lors de la mise à jour du devis."}`);
      }
    }
  };

  const handleSignContract = async (id) => {
    if (window.confirm("Voulez-vous signer ce contrat ?")) {
      try {
        await updateContractStatus({ id, status: 'signed', signatureDate: new Date() }).unwrap();
        refetchContracts();
      } catch (err) {
        console.error("Signature échouée:", err);
      }
    }
  };

  const getStatusStyle = (status) => {
    const s = {
      'demande envoyée': { bg: "#fffbeb", color: "#b45309", label: "Demande envoyée" },
      sent: { bg: "#eff6ff", color: "#1e40af", label: "Reçu" },
      accepted: { bg: "#dcfce7", color: "#166534", label: "Accepté" },
      rejected: { bg: "#fee2e2", color: "#991b1b", label: "Refusé" },
      pending_signature: { bg: "#fef3c7", color: "#92400e", label: "À signer" },
      signed: { bg: "#dcfce7", color: "#166534", label: "Signé" },
      active: { bg: "#dbeafe", color: "#1e40af", label: "Actif" },
    };
    return s[status] || { bg: "#f1f5f9", color: "#475569", label: status };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Mes Documents</h1>
          <p>Gérez vos devis et contrats avec les entreprises</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          onClick={() => setActiveTab("quotes")}
          className={activeTab === "quotes" ? styles.tabActive : styles.tab}
        >
          <FileSpreadsheet size={18} /> Mes Devis ({quotes.length})
        </button>
        <button 
          onClick={() => setActiveTab("contracts")}
          className={activeTab === "contracts" ? styles.tabActive : styles.tab}
        >
          <FileSignature size={18} /> Mes Contrats ({contracts.length})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "quotes" ? (
          loadingQuotes ? (
            <div className={styles.loader}><Loader2 className="animate-spin" /></div>
          ) : quotes.length === 0 ? (
            <div className={styles.empty}><FileSpreadsheet size={48} /><p>Aucun devis reçu.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {[
                { title: "Demandes en attente", status: ["demande envoyée", "request"], icon: <Clock size={20} color="#b45309" />, bg: "#fffbeb" },
                { title: "Action requise", status: "sent", icon: <Clock size={20} color="#f59e0b" />, bg: "#fffbeb" },
                { title: "Devis Acceptés", status: "accepted", icon: <CheckCircle2 size={20} color="#10b981" />, bg: "#f0fdf4" },
                { title: "Historique (Refusés / Expirés)", status: ["rejected", "expired"], icon: <FileText size={20} color="#94a3b8" />, bg: "#f8fafc" }
              ].map((section, idx) => {
                const filtered = quotes.filter(q => Array.isArray(section.status) ? section.status.includes(q.status) : q.status === section.status);
                if (filtered.length === 0) return null;
                
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 20px', background: section.bg, borderRadius: '12px', borderLeft: `5px solid ${section.icon.props.color}` }}>
                      {section.icon}
                      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{section.title} ({filtered.length})</h2>
                    </div>
                    <div className={styles.grid}>
                      {filtered.map(quote => {
                        const style = getStatusStyle(quote.status);
                        return (
                          <div key={quote._id} className={styles.card} style={{ border: quote.status === 'sent' ? '2px solid #f59e0b' : '1px solid #e2e8f0' }}>
                            <div className={styles.cardHeader}>
                              <div className={styles.orderId}>{quote.quoteNumber}</div>
                              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: style.bg, color: style.color }}>
                                {style.label}
                              </span>
                            </div>
                            <div className={styles.cardBody}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className={styles.userSection}>
                                  <Building2 size={16} />
                                  <div className={styles.userName}>{quote.companyId?.companyName || quote.professionalId?.fullName}</div>
                                </div>
                                <div style={{ 
                                  fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px',
                                  backgroundColor: quote.requiresContract ? '#fff7ed' : '#f0fdf4',
                                  color: quote.requiresContract ? '#9a3412' : '#15803d',
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                  border: `1px solid ${quote.requiresContract ? '#ffedd5' : '#dcfce7'}`
                                }}>
                                  <FileText size={12} /> {quote.requiresContract ? 'Contrat obligatoire' : 'Sans contrat'}
                                </div>
                              </div>
                              <div className={styles.itemsList}>
                                {quote.items.map((item, i) => (
                                  <div key={i} className={styles.itemRow}>
                                    <span>{item.quantity}x {item.description}</span>
                                    <span>{item.total.toFixed(2)} TND</span>
                                  </div>
                                ))}
                              </div>
                              <div className={styles.totalRow} style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                                <span>Total TTC</span>
                                <span>{quote.totalAmount.toFixed(2)} TND</span>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button 
                                  onClick={() => setSelectedQuote(quote)} 
                                  style={{ 
                                    flex: 1, padding: '10px', borderRadius: '12px', border: '1.5px solid #e2e8f0', 
                                    background: '#fff', color: '#1e293b', fontWeight: '700', cursor: 'pointer', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                >
                                  <Eye size={16} /> Détails
                                </button>
                                
                                {quote.contractId && (
                                  <button 
                                    onClick={() => setActiveTab("contracts")} 
                                    style={{ 
                                      flex: 1, padding: '10px', borderRadius: '12px', border: 'none', 
                                      background: '#2563eb', color: 'white', fontWeight: '800', cursor: 'pointer', 
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(37, 99, 235, 0.3)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)'; }}
                                  >
                                    <FileSignature size={16} /> Contrat
                                  </button>
                                )}

                                <button 
                                  onClick={() => generateQuotePDF(quote, quote.companyId)} 
                                  style={{ 
                                    width: '42px', height: '42px', borderRadius: '12px', border: '1.5px solid #e2e8f0', 
                                    background: '#fff', color: '#64748b', cursor: 'pointer', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}
                                  title="Télécharger PDF"
                                >
                                  <Download size={18} />
                                </button>
                                
                                {quote.status === 'sent' && (
                                  <div style={{ display: 'flex', gap: '8px', flex: 1.5 }}>
                                    <button 
                                      onClick={() => handleQuoteAction(quote._id, 'accepted')} 
                                      style={{ 
                                        flex: 1, padding: '10px', borderRadius: '12px', border: 'none', 
                                        background: '#10b981', color: 'white', fontWeight: '800', cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s'
                                      }}
                                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(16, 185, 129, 0.3)'; }}
                                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)'; }}
                                    >
                                      Accepter
                                    </button>
                                    <button 
                                      onClick={() => handleQuoteAction(quote._id, 'rejected')} 
                                      style={{ 
                                        flex: 1, padding: '10px', borderRadius: '12px', border: '1.5px solid #fee2e2', 
                                        background: '#fff', color: '#ef4444', fontWeight: '700', cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                                      onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; }}
                                    >
                                      Refuser
                                    </button>
                                  </div>
                                )}

                                {quote.status === 'accepted' && !quote.requiresContract && !quote.isPaid && (
                                  <button 
                                    onClick={() => handlePayment(quote, 'quote')} 
                                    disabled={isPaying} 
                                    style={{ 
                                      flex: 1.5, padding: '10px', borderRadius: '12px', border: 'none', 
                                      background: '#fbbf24', color: '#000', fontWeight: '800', cursor: 'pointer', 
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(251, 191, 36, 0.3)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.2)'; }}
                                  >
                                    <CreditCard size={18} /> Payer
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          loadingContracts ? (
            <div className={styles.loader}><Loader2 className="animate-spin" /></div>
          ) : contracts.length === 0 ? (
            <div className={styles.empty}><FileSignature size={48} /><p>Aucun contrat disponible.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
               {[
                { title: "À signer d'urgence", status: ["pending_signature", "pending"], icon: <FileSignature size={20} color="#f59e0b" />, bg: "#fffbeb" },
                { title: "Contrats Signés / Actifs", status: ["signed", "active"], icon: <CheckCircle2 size={20} color="#10b981" />, bg: "#f0fdf4" },
                { title: "Archives", status: ["completed", "cancelled", "rejected"], icon: <FileText size={20} color="#94a3b8" />, bg: "#f8fafc" }
              ].map((section, idx) => {
                 const filtered = contracts.filter(c => Array.isArray(section.status) ? section.status.includes(c.status) : c.status === section.status);
                 if (filtered.length === 0) return null;

                 return (
                   <div key={idx}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 20px', background: section.bg, borderRadius: '12px', borderLeft: `5px solid ${section.icon.props.color}` }}>
                        {section.icon}
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{section.title} ({filtered.length})</h2>
                      </div>
                      <div className={styles.grid}>
                        {filtered.map(contract => (
                          <div key={contract._id} className={styles.card} style={{ border: contract.status === 'pending_signature' ? '2px solid #f59e0b' : '1px solid #e2e8f0' }}>
                            <div className={styles.cardHeader}>
                              <div className={styles.orderId}>{contract.contractNumber}</div>
                              <span style={{ 
                                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                                background: getStatusStyle(contract.status).bg,
                                color: getStatusStyle(contract.status).color
                              }}>
                                {getStatusStyle(contract.status).label}
                              </span>
                            </div>
                            <div className={styles.cardBody}>
                              <div className={styles.userSection}>
                                <Building2 size={16} />
                                <div className={styles.userName}>{contract.companyId?.companyName || contract.professionalId?.fullName}</div>
                              </div>
                              <h4 style={{ margin: '15px 0 5px', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{contract.title}</h4>
                              <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(contract.startDate).toLocaleDateString()}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: '#24416b' }}><DollarSign size={14} /> {contract.totalValue.toFixed(2)} TND</span>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                  onClick={() => setSelectedContract(contract)} 
                                  style={{ 
                                    flex: 1, padding: '10px', borderRadius: '12px', border: '1.5px solid #e2e8f0', 
                                    background: '#fff', color: '#1e293b', fontWeight: '700', cursor: 'pointer', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                >
                                  <Eye size={16} /> Lire
                                </button>
                                
                                {contract.status === 'signed' && (
                                  <button 
                                    onClick={() => generateContractPDF(contract, contract.companyId)} 
                                    style={{ 
                                      width: '42px', height: '42px', borderRadius: '12px', border: '1.5px solid #e2e8f0', 
                                      background: '#fff', color: '#64748b', cursor: 'pointer', 
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}
                                    title="Télécharger PDF"
                                  >
                                    <Download size={18} />
                                  </button>
                                )}

                                {['signed', 'active'].includes(contract.status) && !contract.isPaid && (
                                  <button 
                                    onClick={() => handlePayment(contract, 'contract')} 
                                    disabled={isPaying} 
                                    style={{ 
                                      flex: 1.5, padding: '10px', borderRadius: '12px', border: 'none', 
                                      background: '#fbbf24', color: '#000', fontWeight: '800', cursor: 'pointer', 
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(251, 191, 36, 0.3)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.2)'; }}
                                  >
                                    <CreditCard size={18} /> Payer
                                  </button>
                                )}

                                {contract.status === 'pending_signature' && (
                                  <button 
                                    onClick={() => handleSignContract(contract._id)} 
                                    style={{ 
                                      flex: 1.5, padding: '10px', borderRadius: '12px', border: 'none', 
                                      background: '#24416b', color: 'white', fontWeight: '700', cursor: 'pointer', 
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                      boxShadow: '0 4px 12px rgba(36, 65, 107, 0.2)', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(36, 65, 107, 0.3)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(36, 65, 107, 0.2)'; }}
                                  >
                                    <FileSignature size={18} /> Signer
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 );
              })}
            </div>
          )
        )}
      </div>

      {/* Modal Détails Devis */}
      {selectedQuote && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
            <button onClick={() => setSelectedQuote(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#24416b', background: '#eff6ff', padding: '4px 12px', borderRadius: '6px' }}>{selectedQuote.quoteNumber}</span>
              <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '12px 0 4px' }}>{selectedQuote.companyId?.companyName}</h2>
              <div style={{ display: 'flex', gap: '15px', color: '#64748b', fontSize: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={14} /> Valide jusqu'au {new Date(selectedQuote.validUntil).toLocaleDateString()}</span>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Description</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'center' }}>Qté</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Prix Unit.</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuote.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>{item.description}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Sous-total</span>
                  <span>{selectedQuote.subTotal.toFixed(2)} TND</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>TVA ({selectedQuote.taxRate}%)</span>
                  <span>{selectedQuote.taxAmount.toFixed(2)} TND</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '18px', color: '#1e293b', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                  <span>Total TTC</span>
                  <span>{selectedQuote.totalAmount.toFixed(2)} TND</span>
                </div>
              </div>
            </div>

            {selectedQuote.notes && (
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '700', color: '#475569' }}>Notes & Conditions</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{selectedQuote.notes}</p>
              </div>
            )}

            {selectedQuote.contractId && (
              <button 
                onClick={() => { setActiveTab("contracts"); setSelectedQuote(null); }}
                style={{ width: '100%', marginBottom: '12px', padding: '14px', borderRadius: '12px', border: 'none', background: '#24416b', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <FileSignature size={20} /> Voir le contrat associé
              </button>
            )}

            {selectedQuote.status === 'sent' ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => { handleQuoteAction(selectedQuote._id, 'accepted'); setSelectedQuote(null); }} 
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                  Accepter le devis
                </button>
                <button 
                  onClick={() => { handleQuoteAction(selectedQuote._id, 'rejected'); setSelectedQuote(null); }} 
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ef4444', background: 'white', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}
                >
                  Refuser
                </button>
                <button 
                  onClick={() => generateQuotePDF(selectedQuote, selectedQuote.companyId)}
                  style={{ padding: '14px', borderRadius: '12px', border: '1px solid #24416b', background: 'white', color: '#24416b', fontWeight: '700', cursor: 'pointer' }}
                  title="Télécharger PDF"
                >
                  <Download size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => generateQuotePDF(selectedQuote, selectedQuote.companyId)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #24416b', background: 'white', color: '#24416b', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <Download size={20} /> Télécharger le devis PDF
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Détails Contrat */}
      {selectedContract && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', position: 'relative' }}>
            <button onClick={() => setSelectedContract(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            
            <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#24416b', background: '#eff6ff', padding: '4px 12px', borderRadius: '6px' }}>{selectedContract.contractNumber}</span>
              <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b', margin: '12px 0 4px' }}>{selectedContract.title}</h2>
              <p style={{ color: '#64748b', fontSize: '15px' }}>Proposé par <strong>{selectedContract.companyId?.companyName}</strong></p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '16px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Période</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Du {new Date(selectedContract.startDate).toLocaleDateString()} au {selectedContract.endDate ? new Date(selectedContract.endDate).toLocaleDateString() : 'Indéterminée'}</p>
              </div>
              <div style={{ backgroundColor: '#24416b', padding: '15px', borderRadius: '16px', color: 'white' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Valeur Totale</p>
                <p style={{ fontSize: '18px', fontWeight: '900' }}>{selectedContract.totalValue.toFixed(2)} TND</p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>Contenu & Engagements</h4>
              <div style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0', padding: '20px', borderRadius: '16px', whiteSpace: 'pre-line', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                {selectedContract.content}
              </div>
            </div>

            {selectedContract.terms && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>Termes & Conditions</h4>
                <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '15px', borderRadius: '12px', fontSize: '13px', color: '#9a3412', lineHeight: '1.5' }}>
                  {selectedContract.terms}
                </div>
              </div>
            )}

            {selectedContract.status === 'pending_signature' ? (
              <button 
                onClick={() => { handleSignContract(selectedContract._id); setSelectedContract(null); }} 
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#24416b', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <FileSignature size={20} /> Signer le contrat maintenant
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, padding: '15px', backgroundColor: '#dcfce7', borderRadius: '12px', color: '#166534', fontWeight: '800', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle2 size={20} /> Contrat signé le {new Date(selectedContract.signatureDate).toLocaleDateString()}
                </div>
                <button 
                  onClick={() => generateContractPDF(selectedContract, selectedContract.companyId)}
                  style={{ padding: '15px', borderRadius: '12px', border: '1px solid #24416b', background: 'white', color: '#24416b', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  <Download size={20} /> PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDocuments;
