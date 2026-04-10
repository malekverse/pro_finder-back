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
import { 
  FileSpreadsheet, FileSignature, Loader2, Calendar, 
  DollarSign, CheckCircle2, XCircle, Building2, Clock, FileText, Eye, X, Download
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

  const handleQuoteAction = async (id, status) => {
    if (window.confirm(`Voulez-vous vraiment ${status === 'accepted' ? 'accepter' : 'refuser'} ce devis ?`)) {
      try {
        await updateQuoteStatus({ id, status }).unwrap();
        refetchQuotes();
      } catch (err) {
        console.error("Action échouée:", err);
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
          loadingQuotes ? <div className={styles.loader}><Loader2 className="animate-spin" /></div> :
          quotes.length === 0 ? <div className={styles.empty}><FileSpreadsheet size={48} /><p>Aucun devis reçu.</p></div> :
          <div className={styles.grid}>
            {quotes.map(quote => {
              const style = getStatusStyle(quote.status);
              return (
                <div key={quote._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.orderId}>{quote.quoteNumber}</div>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: style.bg, color: style.color }}>
                      {style.label}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.userSection}>
                      <Building2 size={16} />
                      <div className={styles.userName}>{quote.companyId?.companyName}</div>
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
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #24416b', background: 'white', color: '#24416b', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <Eye size={16} /> Détails
                      </button>
                      
                      {quote.contractId && (
                        <button 
                          onClick={() => setActiveTab("contracts")}
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#1e3a8a', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)' }}
                        >
                          <FileSignature size={16} /> Voir Contrat
                        </button>
                      )}
                      
                      <button 
                        onClick={() => generateQuotePDF(quote, quote.companyId)}
                        style={{ padding: '10px', borderRadius: '10px', border: '1px solid #24416b', background: 'white', color: '#24416b', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Télécharger PDF"
                      >
                        <Download size={16} />
                      </button>
                      
                      {quote.status === 'sent' && (
                        <>
                          <button onClick={() => handleQuoteAction(quote._id, 'accepted')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Accepter</button>
                          <button onClick={() => handleQuoteAction(quote._id, 'rejected')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ef4444', background: 'white', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}>Refuser</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          loadingContracts ? <div className={styles.loader}><Loader2 className="animate-spin" /></div> :
          contracts.length === 0 ? <div className={styles.empty}><FileSignature size={48} /><p>Aucun contrat en cours.</p></div> :
          <div className={styles.grid}>
            {contracts.map(contract => {
              const style = getStatusStyle(contract.status);
              return (
                <div key={contract._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.orderId}>{contract.contractNumber}</div>
                    {contract.quoteId && (
                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '10px' }}>
                        Lié au devis: {contract.quoteId.quoteNumber}
                      </span>
                    )}
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: style.bg, color: style.color }}>
                      {style.label}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '700' }}>{contract.title}</h3>
                    <div className={styles.userSection}>
                      <Building2 size={16} />
                      <div className={styles.userName}>{contract.companyId?.companyName}</div>
                    </div>
                    <div style={{ margin: '15px 0', fontSize: '13px', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #24416b' }}>
                      {contract.content.substring(0, 100)}...
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={14} /> Début: {new Date(contract.startDate).toLocaleDateString()}</span>
                      <span style={{ fontWeight: '700' }}>{contract.totalValue.toFixed(2)} TND</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button 
                        onClick={() => setSelectedContract(contract)}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #24416b', background: 'white', color: '#24416b', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <Eye size={16} /> Lire
                      </button>
                      
                      {contract.status === 'signed' && (
                        <button 
                          onClick={() => generateContractPDF(contract, contract.companyId)}
                          style={{ padding: '10px', borderRadius: '10px', border: '1px solid #24416b', background: 'white', color: '#24416b', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Télécharger PDF"
                        >
                          <Download size={16} />
                        </button>
                      )}
                      
                      {contract.status === 'pending_signature' && (
                        <button onClick={() => handleSignContract(contract._id)} style={{ flex: 1.5, padding: '10px', borderRadius: '10px', border: 'none', background: '#24416b', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <FileSignature size={18} /> Signer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
