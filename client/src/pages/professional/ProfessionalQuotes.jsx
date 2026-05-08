import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  useGetCompanyQuotesQuery, 
  useCreateQuoteMutation, 
  useUpdateQuoteMutation,
  useUpdateQuoteStatusMutation 
} from "../../redux/features/company/quoteApiSlice";
import { useGetProfessionalFollowersQuery, useGetProfessionalProfileQuery } from "../../redux/features/professional/professionalApiSlice";
import { useGetCompanyProductsQuery } from "../../redux/features/products/productApiSlice";
import { useGetCompanyServicesQuery } from "../../redux/features/company/companyServiceApiSlice";
import {
  FileSpreadsheet, Plus, Search, X, Loader2,
  User, Calendar, FileText, Package, Wrench, Eye, Download, Send, RefreshCw, FileSignature,
  Edit
} from "lucide-react";
import { generateQuotePDF } from "../../utils/pdfGenerator";

const ProfessionalQuotes = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const professionalId = user?.id;

  const prefillData = location.state?.prefill || null;
  const openModalOnLoad = location.state?.openModal && location.state?.tab === "quotes";

  const { data: proProfile } = useGetProfessionalProfileQuery();
  const [isModalOpen, setIsModalOpen] = useState(openModalOnLoad);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: quotes = [], isLoading, refetch } = useGetCompanyQuotesQuery(undefined, { pollingInterval: 3000 });
  const { data: followers = [] } = useGetProfessionalFollowersQuery();
  
  // For professionals, we might need to fetch products/services differently if they are not shared
  // But based on the file structure, they seem to use common queries
  const { data: products = [] } = useGetCompanyProductsQuery(professionalId, { skip: !professionalId });
  const { data: services = [] } = useGetCompanyServicesQuery(professionalId, { skip: !professionalId });
  
  const [createQuote, { isLoading: isCreating }] = useCreateQuoteMutation();
  const [updateQuote, { isLoading: isUpdating }] = useUpdateQuoteMutation();
  const [updateStatus] = useUpdateQuoteStatusMutation();

  const handleDownloadPDF = (quote) => {
    const profileForPdf = {
       companyName: proProfile?.fullName,
       phone: proProfile?.phone,
       email: proProfile?.email,
       logoUrl: proProfile?.photoProfessional,
       website: proProfile?.website,
       address: `${proProfile?.city || ""}, ${proProfile?.region || ""}`
    };
    generateQuotePDF(quote, profileForPdf);
  };

  const [formData, setFormData] = useState({
    id: "",
    userId: prefillData?.userId || "",
    userName: prefillData?.userName || "",
    userEmail: prefillData?.userEmail || "",
    reservationId: prefillData?.reservationId || "",
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    bookingDate: prefillData?.bookingDate || "", // Date réelle du service
    bookingTimeSlot: prefillData?.bookingTimeSlot || "", // Heure réelle du service
    notes: prefillData?.notes || "",
    requiresContract: false,
    items: prefillData?.serviceId ? [
      { description: `Service: ${prefillData.serviceName}`, quantity: 1, unitPrice: prefillData.price, duration: prefillData.duration || "60 min" }
    ] : [{ description: "", quantity: 1, unitPrice: 0, duration: "" }]
  });

  useEffect(() => {
    if (prefillData && openModalOnLoad) {
      setFormData({
        id: "",
        userId: prefillData.userId || "",
        userName: prefillData.userName || "",
        userEmail: prefillData.userEmail || "",
        reservationId: prefillData.reservationId || "",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bookingDate: prefillData.bookingDate || "",
        bookingTimeSlot: prefillData.bookingTimeSlot || "",
        notes: prefillData.notes || "",
        items: prefillData.serviceId ? [
          { description: `Service: ${prefillData.serviceName}`, quantity: 1, unitPrice: prefillData.price, duration: prefillData.duration || "60 min" }
        ] : [{ description: "", quantity: 1, unitPrice: 0, duration: "" }]
      });
      setIsModalOpen(true);
    }
  }, [prefillData, openModalOnLoad]);

  const [activeDropdown, setActiveDropdown] = useState(null);
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
      unitPrice: item.price,
      duration: item.duration || ""
    }];
    setFormData({ ...formData, items: newItems });
    setActiveDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rawUserId = formData.userId || prefillData?.userId;
    const finalUserId = (rawUserId && typeof rawUserId === 'object') ? rawUserId._id : rawUserId;

    if (!finalUserId) {
      alert("Erreur: ID Client manquant. Veuillez réessayer.");
      return;
    }

    try {
      const quoteData = { 
        ...formData, 
        userId: finalUserId,
        status: 'sent',
        taxRate: 19,
        subTotal: formData.items[0].unitPrice * (formData.items[0].quantity || 1),
        taxAmount: (formData.items[0].unitPrice * (formData.items[0].quantity || 1)) * 0.19,
        totalAmount: (formData.items[0].unitPrice * (formData.items[0].quantity || 1)) * 1.19
      };
      
      let response;
      if (formData.id) {
        response = await updateQuote({ id: formData.id, ...quoteData }).unwrap();
      } else {
        response = await createQuote(quoteData).unwrap();
      }
      
      setIsModalOpen(false);
      setFormData({
        id: "",
        userId: "",
        userName: "",
        userEmail: "",
        reservationId: "",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "",
        requiresContract: false,
        items: [{ description: "", quantity: 1, unitPrice: 0, duration: "" }]
      });
      refetch();
      alert("Devis généré et envoyé au client avec succès !");
    } catch (err) {
      console.error("❌ [Quotes] Failed to process quote:", err);
      alert(`Erreur: ${err.data?.message || "Échec de l'opération"}`);
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

  const allPrestations = [
    ...products.map(p => ({ ...p, type: 'product' })),
    ...services.map(s => ({ ...s, type: 'service' }))
  ];

  return (
    <div style={{ padding: "40px", backgroundColor: "#f8fafc", minHeight: isEmbedded ? "auto" : "100vh" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Gestion des Devis</h1>
          <p style={{ color: "#64748b", marginTop: "5px" }}>Créez et suivez vos propositions commerciales en tant que professionnel.</p>
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
              <div style={{ width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} color="#24416b" />
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Devis</div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{quote.quoteNumber}</div>
              {/* Client Name */}
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                {quote.clientName || quote.userId?.fullName || "Client"}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>{new Date(quote.createdAt).toLocaleDateString()}</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                  {(quote.totalAmount > 0 ? quote.totalAmount : (quote.bookingServiceId?.price || 0)).toFixed(2)} TND
                </div>
                <div>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', 
                    backgroundColor: 
                      quote.status === 'accepted' ? '#dcfce7' : 
                      quote.status === 'sent' ? '#eff6ff' : 
                      quote.status === 'rejected' ? '#fee2e2' : 
                      (quote.status === 'request' || quote.status === 'demande envoyée') ? '#fef9c3' : 
                      '#f1f5f9',
                    color: 
                      quote.status === 'accepted' ? '#166534' : 
                      quote.status === 'sent' ? '#1e40af' : 
                      quote.status === 'rejected' ? '#991b1b' : 
                      (quote.status === 'request' || quote.status === 'demande envoyée') ? '#854d0e' : 
                      '#475569'
                  }}>
                    {quote.status === 'draft' ? 'Brouillon' : 
                     quote.status === 'sent' ? 'Envoyé' : 
                     quote.status === 'accepted' ? 'Accepté' : 
                     quote.status === 'rejected' ? 'Refusé' : 
                     (quote.status === 'request' || quote.status === 'demande envoyée') ? 'Demande' : 
                     quote.status}
                  </span>
                </div>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                {(quote.status === 'request' || quote.status === 'demande envoyée') && (
                  <button 
                    onClick={() => {
                      setFormData({
                        id: quote._id,
                        userId: quote.userId?._id || quote.userId,
                        userName: quote.clientName || quote.userId?.fullName || "Client",
                        userEmail: quote.clientEmail || quote.userId?.email || "",
                        reservationId: quote.reservationId || "",
                        validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        bookingDate: quote.bookingDate ? new Date(quote.bookingDate).toISOString().split('T')[0] : "",
                        bookingTimeSlot: quote.bookingTimeSlot || "",
                        notes: quote.notes || "",
                        requiresContract: false,
                        items: [{ 
                          description: quote.bookingServiceId?.name || "Service demandé", 
                          quantity: 1, 
                          unitPrice: quote.bookingServiceId?.price || 0,
                          duration: quote.bookingServiceId?.duration || ""
                        }]
                      });
                      setIsModalOpen(true);
                    }}
                    title="Répondre à la demande"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#854d0e', padding: '5px' }}
                  >
                    <Edit size={18} />
                  </button>
                )}
                <button onClick={() => handleDownloadPDF(quote)} title="Télécharger PDF" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '5px' }}><Download size={18} /></button>
                {quote.status === 'draft' && (
                  <button onClick={() => handleStatusChange(quote._id, 'sent')} title="Envoyer au client" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: '5px' }}><Send size={18} /></button>
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
                          unitPrice: item.unitPrice,
                          duration: item.duration || ""
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
                {quote.isPaid && (
                  <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> PAYÉ
                  </span>
                )}
                {quote.status === 'accepted' && quote.requiresContract && !quote.contractId && (
                  <button 
                    onClick={() => {
                        navigate("/professional/documents", { 
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

                {quote.contractId && (
                  <button 
                    onClick={() => {
                        navigate("/professional/documents", { 
                            state: { tab: "contracts" } 
                        });
                    }}
                    title="Voir le contrat associé"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#24416b', padding: '5px' }}
                  >
                    <FileSignature size={18} />
                  </button>
                )}
                <button onClick={() => setSelectedQuote(quote)} title="Détails" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '5px' }}><Eye size={18} /></button>
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

            {selectedQuote.contractId && (
              <button 
                onClick={() => {
                  navigate("/professional/documents", { 
                    state: { tab: "contracts" } 
                  });
                  setSelectedQuote(null);
                }}
                style={{ 
                  width: '100%', padding: '14px', borderRadius: '12px', border: 'none', 
                  background: '#24416b', color: 'white', fontWeight: '800', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  marginBottom: '12px'
                }}
              >
                <FileSignature size={20} /> Voir le contrat associé
              </button>
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
                <h2 style={qs.modalTitle}>{formData.id ? "Répondre à la Demande" : "Nouveau Devis"}</h2>
                <p style={qs.modalSub}>
                  {formData.id ? `Proposition pour ${formData.userName}` : "Configurez votre proposition commerciale pour ce client."}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={qs.closeBtn}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} style={qs.form}>
              <div style={qs.grid}>
                <div style={qs.formGroup}>
                  <label style={qs.label}>Client (Abonné)</label>
                  <div style={{
                    ...qs.input,
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: '700',
                    color: '#1e293b',
                    border: '2px solid #e2e8f0',
                    minHeight: '52px',
                    padding: '8px 20px',
                    borderRadius: '14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} color="#64748b" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '16px' }}>{formData.userName || prefillData?.userName || "Client"}</span>
                        <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>{formData.userEmail || prefillData?.userEmail || "Email non renseigné"}</span>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '10px', 
                      backgroundColor: '#24416b', 
                      color: 'white', 
                      padding: '4px 12px', 
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                      fontWeight: '900',
                      letterSpacing: '0.5px'
                    }}>Client lié</span>
                  </div>
                </div>
                <div style={qs.formGroup}>
                  <label style={qs.label}>Date & Heure du Service</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={qs.inputWrapper}>
                      <Calendar size={18} style={qs.inputIcon} />
                      <input 
                          type="date" required 
                          style={{ ...qs.input, backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                          value={formData.bookingDate}
                          readOnly
                      />
                    </div>
                    <div style={qs.inputWrapper}>
                      <Clock size={18} style={qs.inputIcon} />
                      <input 
                          type="text" required 
                          style={{ ...qs.input, backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                          value={formData.bookingTimeSlot}
                          readOnly
                      />
                    </div>
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
                                backgroundColor: formData.reservationId ? '#f1f5f9' : '#fff'
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
                <button type="submit" disabled={isCreating || isUpdating} style={qs.btnPrimary}>
                  {isCreating || isUpdating ? <Loader2 className="animate-spin" size={20} /> : "Générer le Devis"}
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

export default ProfessionalQuotes;
