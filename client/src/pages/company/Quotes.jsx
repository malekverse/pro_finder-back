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
    userId: prefillData?.userId ? prefillData.userId.toString() : "",
    reservationId: prefillData?.reservationId ? prefillData.reservationId.toString() : "",
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 jours par défaut
    notes: prefillData?.notes || "",
    requiresContract: false,
    items: prefillData?.serviceId ? [
      { description: `Service: ${prefillData.serviceName}`, quantity: 1, unitPrice: prefillData.price, duration: prefillData.duration || "60 min" }
    ] : [{ description: "", quantity: 1, unitPrice: 0, duration: "" }]
  });

  // Mettre à jour le formulaire si les données de pré-remplissage changent
  useEffect(() => {
    if (prefillData) {
      console.log("🔍 [Quotes] Prefill data received:", prefillData);
      const uId = prefillData.userId?.toString() || "";
      const rId = prefillData.reservationId?.toString() || "";
      
      const newFormData = {
        userId: uId,
        reservationId: rId,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: prefillData.notes || "",
        requiresContract: false,
        items: prefillData.serviceId ? [
          { 
            description: prefillData.serviceName || "Service sans nom", 
            quantity: 1, 
            unitPrice: parseFloat(prefillData.price) || 0, 
            duration: prefillData.duration || "60 min" 
          }
        ] : [{ description: "", quantity: 1, unitPrice: 0, duration: "" }]
      };
      
      console.log("📝 [Quotes] Setting new form data:", newFormData);
      setFormData(newFormData);
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

  const handleItemChange = (field, value) => {
    const newItems = [...formData.items];
    newItems[0][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const selectPrestation = (item) => {
    const newItems = [{
      description: item.name,
      quantity: 1,
      unitPrice: item.price
    }];
    setFormData({ ...formData, items: newItems });
    setActiveDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Récupérer l'ID client de n'importe quelle source disponible
    const finalUserId = formData.userId || prefillData?.userId;

    console.log("🚀 [Quotes] Attempting to submit quote with data:", { ...formData, userId: finalUserId });

    // Client-side validation
    if (!finalUserId) {
      alert("Veuillez sélectionner un client.");
      return;
    }

    if (!formData.items || formData.items.length === 0 || !formData.items[0].description || formData.items[0].unitPrice <= 0) {
      alert("Veuillez remplir les détails de la prestation (description et prix).");
      return;
    }

    try {
      // S'assurer que tous les champs requis par le backend sont présents
      const quoteData = { 
        ...formData, 
        userId: finalUserId, // Forcer l'ID client correct
        status: 'sent',
        taxRate: 19, // TVA par défaut
        subTotal: formData.items[0].unitPrice * (formData.items[0].quantity || 1),
        taxAmount: (formData.items[0].unitPrice * (formData.items[0].quantity || 1)) * 0.19,
        totalAmount: (formData.items[0].unitPrice * (formData.items[0].quantity || 1)) * 1.19
      };
      
      console.log("📤 [Quotes] Sending final quote data to server:", quoteData);
      
      const response = await createQuote(quoteData).unwrap();
      console.log("✅ [Quotes] Quote created successfully:", response);
      
      setIsModalOpen(false);
      // Reset form
      setFormData({
        userId: "",
        reservationId: "",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "",
        requiresContract: false,
        items: [{ description: "", quantity: 1, unitPrice: 0, duration: "" }]
      });
      refetch();
      alert("Devis généré et envoyé au client avec succès !");
    } catch (err) {
      console.error("❌ [Quotes] Failed to create quote:", err);
      const errorMessage = err.data?.message || "Erreur lors de la création du devis. Vérifiez que tous les champs sont remplis.";
      alert(errorMessage);
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
                    {selectedQuote.items.some(i => i.duration) && <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'center' }}>Durée</th>}
                    <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Prix Unit (TND)</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuote.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>{item.description}</td>
                      {selectedQuote.items.some(i => i.duration) && <td style={{ padding: '12px 16px', textAlign: 'center' }}>{item.duration || "-"}</td>}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>{(item.unitPrice * (item.quantity || 1)).toFixed(2)}</td>
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
        <div style={qs.overlay}>
          <div style={qs.modal} onClick={e => e.stopPropagation()}>
            <div style={qs.modalHeader}>
              <div>
                <h2 style={qs.modalTitle}>Nouveau Devis</h2>
                <p style={qs.modalSub}>Configurez votre proposition commerciale pour ce client.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={qs.closeBtn}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} style={qs.form}>
              <div style={qs.grid}>
                <div style={qs.formGroup}>
                  <label style={qs.label}>Client (Abonné)</label>
                  <div style={qs.inputWrapper}>
                    <User size={18} style={qs.inputIcon} />
                    {formData.reservationId ? (
                      <div style={{
                        ...qs.input,
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: '700',
                        color: '#1e293b',
                        border: '1px solid #cbd5e1',
                        minHeight: '45px',
                        padding: '8px 15px'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '15px' }}>{prefillData?.userName || "Client de la réservation"}</span>
                          {prefillData?.userEmail && (
                            <span style={{ fontSize: '11px', fontWeight: '400', color: '#64748b' }}>{prefillData.userEmail}</span>
                          )}
                        </div>
                        <span style={{ 
                          fontSize: '10px', 
                          backgroundColor: '#24416b', 
                          color: 'white', 
                          padding: '3px 10px', 
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Automatique</span>
                      </div>
                    ) : (
                      <select 
                        required 
                        style={qs.select}
                        value={formData.userId}
                        onChange={(e) => setFormData({...formData, userId: e.target.value})}
                      >
                        <option value="">Sélectionner un client</option>
                        {followers.map(f => {
                          const fId = f.user_id?._id?.toString() || f.user_id?.toString();
                          return (
                            <option key={fId} value={fId}>
                              {f.user_id?.fullName || "Client sans nom"}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                </div>
                <div style={qs.formGroup}>
                  <label style={qs.label}>Valide jusqu'au</label>
                  <div style={qs.inputWrapper}>
                    <Calendar size={18} style={qs.inputIcon} />
                    <input 
                        type="date" required 
                        style={qs.input}
                        value={formData.validUntil}
                        onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                    />
                </div>
              </div>
            </div>

              <div style={{ ...qs.formGroup, display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '24px' }}>
                <input 
                  type="checkbox" 
                  id="requiresContract"
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  checked={formData.requiresContract}
                  onChange={(e) => setFormData({...formData, requiresContract: e.target.checked})}
                />
                <label htmlFor="requiresContract" style={{ fontWeight: '700', fontSize: '14px', color: '#0369a1', cursor: 'pointer' }}>
                  Signature d'un contrat obligatoire avant le paiement
                </label>
              </div>

              <div style={qs.section}>
                <div style={qs.sectionHeader}>
                    <Package size={16} color="#1E3A5F" />
                    <h3 style={qs.sectionTitle}>SERVICE DEMANDÉ</h3>
                </div>
                
                <div style={qs.itemRow}>
                    <div style={{ flex: 3.5, position: 'relative' }}>
                        <label style={qs.subLabel}>Description de la prestation</label>
                        <input 
                            placeholder="Description ..." 
                            required 
                            readOnly={!!formData.reservationId}
                            style={{ 
                                ...qs.itemInput, 
                                cursor: formData.reservationId ? 'not-allowed' : 'text', 
                                backgroundColor: formData.reservationId ? '#f1f5f9' : '#fff',
                                color: formData.reservationId ? '#475569' : '#1e293b'
                            }} 
                            value={formData.items[0].description} 
                            onChange={(e) => handleItemChange('description', e.target.value)}
                            onFocus={() => !formData.reservationId && setActiveDropdown({ index: 0, type: 'prestation' })}
                        />
                        {!formData.reservationId && activeDropdown?.index === 0 && (
                            <div ref={dropdownRef} style={qs.dropdown}>
                            {allPrestations
                                .filter(p => p.name.toLowerCase().includes(formData.items[0].description.toLowerCase()))
                                .map((p, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => selectPrestation(p)}
                                    style={qs.dropdownItem}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    {p.type === 'product' ? <Package size={14} color="#24416b" /> : <Wrench size={14} color="#8b5cf6" />}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '700' }}>{p.name}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{p.price} TND</div>
                                    </div>
                                </div>
                                ))
                            }
                            </div>
                        )}
                    </div>
                    <div style={{ flex: 1.5 }}>
                        <label style={qs.subLabel}>Durée</label>
                        <input 
                            type="text" required 
                            placeholder="ex: 1h"
                            style={qs.itemInput} 
                            value={formData.items[0].duration} 
                            onChange={(e) => handleItemChange('duration', e.target.value)} 
                        />
                    </div>
                    <div style={{ flex: 2 }}>
                        <label style={qs.subLabel}>Prix Unit. (TND)</label>
                        <input type="number" required style={qs.itemInput} value={formData.items[0].unitPrice} onChange={(e) => handleItemChange('unitPrice', e.target.value)} />
                    </div>
                </div>
              </div>

              <div style={qs.formGroup}>
                <label style={qs.label}>Notes & Conditions Particulières</label>
                <textarea 
                  rows="3" 
                  placeholder="Informations complémentaires, garanties, délais ..."
                  style={qs.textarea}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>

              <div style={qs.footer}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={qs.btnSecondary}>Annuler</button>
                <button type="submit" disabled={isCreating} style={qs.btnPrimary}>
                  {isCreating ? <Loader2 className="animate-spin" size={20} /> : "Générer le Devis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const qs = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  modalHeader: { padding: '32px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 },
  modalSub: { fontSize: '14px', color: '#64748b', marginTop: '4px' },
  closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' },
  form: { padding: '32px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' },
  formGroup: { marginBottom: '24px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '14px', color: '#1e293b' },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  input: { width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', color: '#1e293b', transition: '0.2s', outline: 'none', background: '#fff' },
  select: { width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', color: '#1e293b', transition: '0.2s', outline: 'none', appearance: 'none', background: '#fff' },
  section: { background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  sectionTitle: { fontSize: '14px', fontWeight: '800', color: '#1E3A5F', margin: 0, textTransform: 'uppercase' },
  subLabel: { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' },
  itemRow: { display: 'flex', gap: '16px' },
  itemInput: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b', transition: '0.2s', background: '#fff' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginTop: '8px', maxHeight: '200px', overflowY: 'auto' },
  dropdownItem: { padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9' },
  textarea: { width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', color: '#1e293b', transition: '0.2s', outline: 'none', minHeight: '100px' },
  footer: { display: 'flex', gap: '16px', marginTop: '8px' },
  btnSecondary: { flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: '0.2s' },
  btnPrimary: { flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#24416b', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default Quotes;
