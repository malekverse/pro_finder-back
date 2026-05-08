import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { 
  useGetCompanyContractsQuery, 
  useCreateContractMutation, 
  useUpdateContractStatusMutation 
} from "../../redux/features/company/contractApiSlice";
import { useGetCompanyFollowersQuery } from "../../redux/features/company/companyApiSlice";
import { useGetCompanyQuotesQuery } from "../../redux/features/company/quoteApiSlice";
import { 
  FileSignature, Plus, Search, X, Loader2, 
  User, Calendar, DollarSign, FileText, CheckCircle2, Clock, Info, Eye, Download, Send, Edit, FileSpreadsheet
} from "lucide-react";
import { generateContractPDF } from "../../utils/pdfGenerator";
import { useGetCompanyProfileQuery } from "../../redux/features/company/companyApiSlice";

const Contracts = ({ isEmbedded = false, openModalOnLoad = false, prefillData = null }) => {
  const authUser = useSelector((state) => state.auth.user);
  const companyId = authUser?.companyId || authUser?.id;

  const { data: companyProfile } = useGetCompanyProfileQuery(companyId, { skip: !companyId });
  const [isModalOpen, setIsModalOpen] = useState(openModalOnLoad);
  const [selectedContract, setSelectedContract] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: contracts = [], isLoading, refetch } = useGetCompanyContractsQuery(undefined, { pollingInterval: 3000 });
  const { data: followers = [] } = useGetCompanyFollowersQuery();
  const { data: quotes = [] } = useGetCompanyQuotesQuery();
  const [createContract, { isLoading: isCreating }] = useCreateContractMutation();
  const [updateStatus] = useUpdateContractStatusMutation();

  const handleDownloadPDF = (contract) => {
    generateContractPDF(contract, companyProfile);
  };

  const [formData, setFormData] = useState({
    userId: prefillData?.userId || "",
    quoteId: prefillData?.quoteId || "",
    title: prefillData?.title || "",
    content: prefillData?.content || "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    totalValue: prefillData?.totalValue || 0,
    terms: ""
  });

  // Mettre à jour le formulaire si les données de pré-remplissage changent
  useEffect(() => {
    if (prefillData) {
      setFormData({
        userId: prefillData.userId || "",
        quoteId: prefillData.quoteId || "",
        title: prefillData.title || "",
        content: prefillData.content || "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        totalValue: prefillData.totalValue || 0,
        terms: ""
      });
      setIsModalOpen(true);
    }
  }, [prefillData]);

  const handleQuoteSelect = (quoteId) => {
    if (!quoteId) {
      setFormData({ ...formData, quoteId: "" });
      return;
    }
    const selectedQuote = quotes.find(q => q._id === quoteId);
    if (selectedQuote) {
      setFormData({
        ...formData,
        quoteId,
        userId: selectedQuote.userId?._id || selectedQuote.userId,
        totalValue: selectedQuote.totalAmount,
        content: `Basé sur le devis ${selectedQuote.quoteNumber}.\nPrestations : \n${selectedQuote.items.map(i => `- ${i.description} (x${i.quantity})`).join('\n')}`,
        title: `Contrat - ${selectedQuote.userId?.fullName || 'Client'}`
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createContract(formData).unwrap();
      setIsModalOpen(false);
      setFormData({
        userId: "", quoteId: "", title: "", content: "",
        startDate: "", endDate: "", totalValue: 0, terms: ""
      });
      refetch();
    } catch (err) {
      console.error("Failed to create contract:", err);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus({ id, status, signatureDate: status === 'signed' ? new Date() : null }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.userId?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: isEmbedded ? "40px" : "40px", backgroundColor: "#f8fafc", minHeight: isEmbedded ? "auto" : "100vh" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Gestion des Contrats</h1>
          <p style={{ color: "#64748b", marginTop: "5px" }}>Gérez vos engagements contractuels officiels.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            backgroundColor: '#24416b', color: 'white', padding: '12px 24px', 
            borderRadius: '12px', border: 'none', fontWeight: '600', cursor: 'pointer'
          }}
        >
          <Plus size={20} /> Nouveau Contrat
        </button>
      </div>

      <div style={{ marginBottom: '30px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
        <input 
          type="text" 
          placeholder="Rechercher par titre, numéro ou client..." 
          style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '16px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={48} color="#24416b" /></div>
      ) : filteredContracts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
          <FileSignature size={64} color="#cbd5e1" style={{ marginBottom: '20px', marginLeft: 'auto', marginRight: 'auto' }} />
          <h3 style={{ color: '#64748b' }}>Aucun contrat trouvé</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: '#e2e8f0', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {filteredContracts.map(contract => (
            <div key={contract._id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '60px 100px 150px 1fr 120px 120px 120px 150px', 
              alignItems: 'center', 
              backgroundColor: 'white', 
              padding: '16px 24px',
              transition: 'background-color 0.2s'
            }}>
              {/* Icon */}
              <div style={{ width: '40px', height: '40px', backgroundColor: '#f5f3ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSignature size={20} color="#7c3aed" />
              </div>

              {/* Type Label */}
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Contrat</div>

              {/* Number */}
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{contract.contractNumber}</div>

              {/* Client Name */}
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{contract.userId?.fullName}</div>

              {/* Date */}
              <div style={{ fontSize: '14px', color: '#64748b' }}>{new Date(contract.startDate).toLocaleDateString()}</div>

              {/* Amount */}
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{contract.totalValue.toFixed(2)} TND</div>

              {/* Status Badge */}
              <div>
                <span style={{ 
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                  backgroundColor: contract.status === 'signed' || contract.status === 'active' ? '#dcfce7' : '#fef3c7',
                  color: contract.status === 'signed' || contract.status === 'active' ? '#166534' : '#92400e',
                }}>
                  {contract.status === 'pending_signature' ? 'À signer' : contract.status === 'signed' ? 'Signé' : 'Actif'}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleDownloadPDF(contract)}
                  title="Télécharger PDF"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '5px' }}
                >
                  <Download size={18} />
                </button>
                
                {contract.status === 'pending_signature' && (
                  <button 
                    onClick={() => handleStatusChange(contract._id, 'signed')}
                    title="Marquer comme signé"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: '5px' }}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                )}

                <button 
                  onClick={() => setSelectedContract(contract)}
                  title="Détails"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '5px' }}
                >
                  <Eye size={18} />
                </button>

                {contract.quoteId && (
                  <button 
                    onClick={() => {
                      navigate("/company/documents", { 
                        state: { tab: "quotes" } 
                      });
                    }}
                    title={`Voir le devis ${contract.quoteId.quoteNumber}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#24416b', padding: '5px' }}
                  >
                    <FileSpreadsheet size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nouveau Contrat */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Nouveau Contrat</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>Remplissez les informations contractuelles.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px', color: '#475569' }}>LIER À UN DEVIS (RECOMMANDÉ)</label>
                <select 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', backgroundColor: 'white', fontSize: '14px' }} 
                  value={formData.quoteId} 
                  onChange={(e) => handleQuoteSelect(e.target.value)}
                >
                  <option value="">-- Sélectionner un devis accepté --</option>
                  {quotes.filter(q => q.status === 'accepted').map(q => (
                    <option key={q._id} value={q._id}>{q.quoteNumber} - {q.userId?.fullName} ({q.totalAmount.toFixed(2)} TND)</option>
                  ))}
                </select>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Lier un devis remplit automatiquement le client et le montant.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px' }}>TITRE DU CONTRAT *</label>
                  <input required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Ex: Contrat de Maintenance Annuelle" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px' }}>CLIENT *</label>
                  <select required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }} value={formData.userId} onChange={(e) => setFormData({...formData, userId: e.target.value})}>
                    <option value="">-- Sélectionner un client --</option>
                    {followers.map(f => <option key={f.user_id._id} value={f.user_id._id}>{f.user_id.fullName}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px' }}>DATE DE DÉBUT *</label>
                  <input type="date" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }} value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px' }}>DATE DE FIN</label>
                  <input type="date" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }} value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px' }}>VALEUR TOTALE (TND) *</label>
                  <input type="number" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }} value={formData.totalValue} onChange={(e) => setFormData({...formData, totalValue: e.target.value})} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px' }}>CONTENU DU CONTRAT *</label>
                <textarea rows="6" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '14px' }} value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} placeholder="Détaillez ici ce qui est inclus dans le contrat..."></textarea>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px' }}>TERMES & CONDITIONS</label>
                <textarea rows="3" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '14px' }} value={formData.terms} onChange={(e) => setFormData({...formData, terms: e.target.value})} placeholder="Modalités de paiement, résiliation, etc."></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
                <button type="submit" disabled={isCreating} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#24416b', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  {isCreating ? <Loader2 className="animate-spin" size={20} /> : <><FileSignature size={20} /> Générer le Contrat Officiel</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détails Contrat */}
      {selectedContract && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', position: 'relative' }}>
            <button onClick={() => setSelectedContract(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}><X size={20} /></button>
            
            <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '24px', marginBottom: '32px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#24416b', backgroundColor: '#eff6ff', padding: '4px 12px', borderRadius: '6px' }}>{selectedContract.contractNumber}</span>
              <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: '16px 0 8px 0' }}>{selectedContract.title}</h2>
              <div style={{ display: 'flex', gap: '24px', color: '#64748b', fontSize: '15px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /> Client: <strong>{selectedContract.userId?.fullName}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} /> Statut: <strong>{selectedContract.status.toUpperCase()}</strong></span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Période de Validité</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Date de début:</span>
                    <strong style={{ color: '#1e293b' }}>{new Date(selectedContract.startDate).toLocaleDateString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Date de fin:</span>
                    <strong style={{ color: '#1e293b' }}>{selectedContract.endDate ? new Date(selectedContract.endDate).toLocaleDateString() : 'Non spécifiée'}</strong>
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: '#24416b', padding: '24px', borderRadius: '20px', color: 'white' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '800', textTransform: 'uppercase' }}>Engagement Financier</h4>
                <div style={{ fontSize: '32px', fontWeight: '900' }}>{selectedContract.totalValue.toFixed(2)} <span style={{ fontSize: '18px' }}>TND</span></div>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Valeur totale TTC du contrat</p>
              </div>
            </div>

            {selectedContract.quoteId && (
              <button 
                onClick={() => {
                  navigate("/company/documents", { 
                    state: { tab: "quotes" } 
                  });
                  setSelectedContract(null);
                }}
                style={{ 
                  width: '100%', padding: '14px', borderRadius: '12px', border: 'none', 
                  background: '#f1f5f9', color: '#24416b', fontWeight: '800', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  marginBottom: '24px'
                }}
              >
                <FileSpreadsheet size={20} /> Voir le devis associé ({selectedContract.quoteId.quoteNumber})
              </button>
            )}

            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                <FileText size={20} color="#24416b" /> Contenu & Prestations
              </h4>
              <div style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0', padding: '24px', borderRadius: '20px', whiteSpace: 'pre-line', color: '#475569', lineHeight: '1.6', fontSize: '15px' }}>
                {selectedContract.content}
              </div>
            </div>

            {selectedContract.terms && (
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  <Info size={20} color="#24416b" /> Termes & Conditions
                </h4>
                <div style={{ backgroundColor: '#fdf2f8', border: '1px solid #fce7f3', padding: '20px', borderRadius: '16px', color: '#be185d', fontSize: '14px', lineHeight: '1.6' }}>
                  {selectedContract.terms}
                </div>
              </div>
            )}

            {selectedContract.signatureDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#dcfce7', borderRadius: '16px', color: '#166534', fontWeight: '700', marginBottom: '32px' }}>
                <CheckCircle2 size={24} />
                <span>Signé électroniquement le {new Date(selectedContract.signatureDate).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
