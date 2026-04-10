import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  useGetCompanyQuotesQuery, 
  useCreateQuoteMutation, 
  useUpdateQuoteStatusMutation 
} from "../../redux/features/company/quoteApiSlice";
import { useGetCompanyFollowersQuery } from "../../redux/features/company/companyApiSlice";
import { useGetCompanyProductsQuery } from "../../redux/features/products/productApiSlice";
import { useGetCompanyServicesQuery } from "../../redux/features/company/companyServiceApiSlice";
import { 
  FileSpreadsheet, Plus, Search, X, Loader2, AlertCircle, 
  User, Calendar, DollarSign, FileText, CheckCircle2, Clock, Trash2,
  ChevronDown, Package, Wrench, Eye, Download, Send, Edit, RefreshCw, FileSignature
} from "lucide-react";
import { generateQuotePDF } from "../../utils/pdfGenerator";
import { useGetCompanyProfileQuery } from "../../redux/features/company/companyApiSlice";

const Quotes = ({ isEmbedded = false, openModalOnLoad = false, prefillData = null }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const companyId = user?.companyId || user?.id;

  const { data: companyProfile } = useGetCompanyProfileQuery(companyId, { skip: !companyId });
  const [isModalOpen, setIsModalOpen] = useState(openModalOnLoad);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: quotes = [], isLoading, isError, refetch } = useGetCompanyQuotesQuery(undefined, { pollingInterval: 3000 });
  const { data: followers = [] } = useGetCompanyFollowersQuery();
  const { data: products = [] } = useGetCompanyProductsQuery(companyId, { skip: !companyId });
  const { data: services = [] } = useGetCompanyServicesQuery(companyId, { skip: !companyId });
  
  const [createQuote, { isLoading: isCreating }] = useCreateQuoteMutation();
  const [updateStatus] = useUpdateQuoteStatusMutation();

  const handleDownloadPDF = (quote) => {
    generateQuotePDF(quote, companyProfile);
  };

  const [formData, setFormData] = useState({
    userId: prefillData?.userId || "",
    reservationId: prefillData?.reservationId || "",
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 jours par défaut
    notes: prefillData?.notes || "",
    items: prefillData?.serviceId ? [
      { description: `Service: ${prefillData.serviceName}`, quantity: 1, unitPrice: prefillData.price }
    ] : [{ description: "", quantity: 1, unitPrice: 0 }]
  });

  // Mettre à jour le formulaire si les données de pré-remplissage changent
  useEffect(() => {
    if (prefillData) {
      setFormData({
        userId: prefillData.userId || "",
        reservationId: prefillData.reservationId || "",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: prefillData.notes || "",
        items: prefillData.serviceId ? [
          { description: `Service: ${prefillData.serviceName}`, quantity: 1, unitPrice: prefillData.price }
        ] : [{ description: "", quantity: 1, unitPrice: 0 }]
      });
      setIsModalOpen(true);
    }
  }, [prefillData]);

  // State for search/select dropdowns
  const [activeDropdown, setActiveDropdown] = useState(null); // { index, type: 'prestation' }
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unitPrice: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const selectPrestation = (index, item) => {
    const newItems = [...formData.items];
    newItems[index] = {
      description: item.name,
      quantity: 1,
      unitPrice: item.price
    };
    setFormData({ ...formData, items: newItems });
    setActiveDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createQuote(formData).unwrap();
      setIsModalOpen(false);
      setFormData({
        userId: "",
        reservationId: "",
        validUntil: "",
        notes: "",
        items: [{ description: "", quantity: 1, unitPrice: 0 }]
      });
      refetch();
    } catch (err) {
      console.error("Failed to create quote:", err);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus({ id, status }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredQuotes = quotes.filter(q => 
    q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.userId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combine products and services for the selection
  const allPrestations = [
    ...products.map(p => ({ ...p, type: 'product' })),
    ...services.map(s => ({ ...s, type: 'service' }))
  ];

  return (
    <div style={{ padding: isEmbedded ? "40px" : "40px", backgroundColor: "#f8fafc", minHeight: isEmbedded ? "auto" : "100vh" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Gestion des Devis</h1>
          <p style={{ color: "#64748b", marginTop: "5px" }}>Créez et suivez vos propositions commerciales.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            backgroundColor: '#24416b', color: 'white', padding: '12px 24px', 
            borderRadius: '12px', border: 'none', fontWeight: '600', cursor: 'pointer'
          }}
        >
          <Plus size={20} /> Nouveau Devis
        </button>
      </div>

      <div style={{ marginBottom: '30px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
        <input 
          type="text" 
          placeholder="Rechercher par numéro ou client..." 
          style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '16px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={48} color="#24416b" /></div>
      ) : filteredQuotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
          <FileSpreadsheet size={64} color="#cbd5e1" style={{ marginBottom: '20px', marginLeft: 'auto', marginRight: 'auto' }} />
          <h3 style={{ color: '#64748b' }}>Aucun devis trouvé</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: '#e2e8f0', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {filteredQuotes.map(quote => (
            <div key={quote._id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '60px 100px 150px 1fr 120px 120px 120px 150px', 
              alignItems: 'center', 
              backgroundColor: 'white', 
              padding: '16px 24px',
              transition: 'background-color 0.2s'
            }}>
              {/* Icon */}
              <div style={{ width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} color="#24416b" />
              </div>

              {/* Type Label */}
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Devis</div>

              {/* Number */}
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{quote.quoteNumber}</div>

              {/* Client Name */}
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{quote.userId?.fullName}</div>

              {/* Date */}
              <div style={{ fontSize: '14px', color: '#64748b' }}>{new Date(quote.createdAt).toLocaleDateString()}</div>

              {/* Amount */}
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{quote.totalAmount.toFixed(2)} TND</div>

              {/* Status Badge */}
              <div>
                <span style={{ 
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                  backgroundColor: quote.status === 'accepted' ? '#dcfce7' : quote.status === 'sent' ? '#eff6ff' : quote.status === 'rejected' ? '#fee2e2' : '#f1f5f9',
                  color: quote.status === 'accepted' ? '#166534' : quote.status === 'sent' ? '#1e40af' : quote.status === 'rejected' ? '#991b1b' : '#475569'
                }}>
                  {quote.status === 'draft' ? 'Brouillon' : quote.status === 'sent' ? 'Envoyé' : quote.status === 'accepted' ? 'Accepté' : quote.status === 'rejected' ? 'Refusé' : quote.status}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleDownloadPDF(quote)}
                  title="Télécharger PDF"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '5px' }}
                >
                  <Download size={18} />
                </button>
                
                {quote.status === 'draft' && (
                  <button 
                    onClick={() => handleStatusChange(quote._id, 'sent')}
                    title="Envoyer au client"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: '5px' }}
                  >
                    <Send size={18} />
                  </button>
                )}

                {quote.status === 'rejected' && (
                  <button 
                    onClick={() => {
                      setFormData({
                        userId: quote.userId?._id || quote.userId,
                        reservationId: quote.reservationId,
                        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        notes: `Nouveau devis suite au refus du devis ${quote.quoteNumber}.\nOriginal notes: ${quote.notes || ""}`,
                        items: quote.items.map(item => ({
                          description: item.description,
                          quantity: item.quantity,
                          unitPrice: item.unitPrice
                        }))
                      });
                      setIsModalOpen(true);
                    }}
                    title="Renvoyer un nouveau devis"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', padding: '5px' }}
                  >
                    <RefreshCw size={18} />
                  </button>
                )}

                {quote.status === 'accepted' && (
                  <button 
                    onClick={() => {
                      navigate("/company/documents", { 
                        state: { 
                          tab: "contracts",
                          openModal: true,
                          prefill: {
                            quoteId: quote._id,
                            userId: quote.userId?._id || quote.userId,
                            totalValue: quote.totalAmount,
                            title: `Contrat - ${quote.userId?.fullName || 'Client'}`,
                            content: `Basé sur le devis ${quote.quoteNumber}.\nPrestations : \n${quote.items.map(i => `- ${i.description} (x${i.quantity})`).join('\n')}`
                          }
                        } 
                      });
                    }}
                    title="Créer le contrat"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: '5px' }}
                  >
                    <FileSignature size={18} />
                  </button>
                )}

                <button 
                  onClick={() => setSelectedQuote(quote)}
                  title="Détails"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '5px' }}
                >
                  <Eye size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Détails Devis */}
      {selectedQuote && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
            <button onClick={() => setSelectedQuote(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#24416b', background: '#eff6ff', padding: '4px 12px', borderRadius: '6px' }}>{selectedQuote.quoteNumber}</span>
              <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '12px 0 4px' }}>{selectedQuote.userId?.fullName}</h2>
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
          </div>
        </div>
      )}

      {/* Modal Nouveau Devis */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Nouveau Devis</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Client (Abonné)</label>
                  <select 
                    required 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                  >
                    <option value="">Sélectionner un client</option>
                    {prefillData?.userId && !followers.some(f => f.user_id._id === prefillData.userId) && (
                      <option value={prefillData.userId}>{prefillData.userName} (Client Réservation)</option>
                    )}
                    {followers.map(f => (
                      <option key={f.user_id._id} value={f.user_id._id}>{f.user_id.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Valide jusqu'au</label>
                  <input 
                    type="date" required 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                    value={formData.validUntil}
                    onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>Service demandé</label>
                {formData.items.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 40px', gap: '10px', marginBottom: '10px', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        placeholder="Description (ou recherchez...)" 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                        value={item.description} 
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        onFocus={() => setActiveDropdown({ index, type: 'prestation' })}
                      />
                      {activeDropdown?.index === index && (
                        <div ref={dropdownRef} style={{ 
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, 
                          backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                          border: '1px solid #e2e8f0', marginTop: '4px', maxHeight: '200px', overflowY: 'auto' 
                        }}>
                          {allPrestations
                            .filter(p => p.name.toLowerCase().includes(item.description.toLowerCase()))
                            .map((p, i) => (
                              <div 
                                key={i} 
                                onClick={() => selectPrestation(index, p)}
                                style={{ 
                                  padding: '10px 12px', cursor: 'pointer', display: 'flex', 
                                  alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                {p.type === 'product' ? <Package size={14} color="#24416b" /> : <Wrench size={14} color="#8b5cf6" />}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.name}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{p.price} TND</div>
                                </div>
                              </div>
                            ))
                          }
                          {allPrestations.filter(p => p.name.toLowerCase().includes(item.description.toLowerCase())).length === 0 && (
                            <div style={{ padding: '10px 12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>Aucun résultat</div>
                          )}
                        </div>
                      )}
                    </div>
                    <input type="number" placeholder="Qté" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                    <input type="number" placeholder="Prix" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} />
                    <button type="button" onClick={() => handleRemoveItem(index)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={20} /></button>
                  </div>
                ))}
                <button type="button" onClick={handleAddItem} style={{ marginTop: '10px', padding: '8px 16px', borderRadius: '8px', border: '1px dashed #24416b', color: '#24416b', background: 'none', cursor: 'pointer', fontWeight: '600' }}>+ Ajouter une ligne</button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Notes / Conditions</label>
                <textarea 
                  rows="3" 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white' }}>Annuler</button>
                <button type="submit" disabled={isCreating} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#24416b', color: 'white', fontWeight: '600' }}>
                  {isCreating ? <Loader2 className="animate-spin" size={20} /> : "Créer le Devis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotes;
