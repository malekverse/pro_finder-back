import React, { useState, useEffect } from "react";
import { X, Heart, Clock, Star, Building2, ShoppingBag, Calendar, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toImageUrl } from "../../../utils/imageUtils";
import CalendarPicker from "./CalendarPicker";
import TimeSlotPicker from "./TimeSlotPicker";
import axios from "axios";

const ServiceDetail = ({ service, onClose, onReserve }) => {
  const navigate = useNavigate();
  const [selectedImg, setSelectedImg] = useState(service?.imagesServices?.[0] || null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [note, setNote] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const formatDuration = (mins) => {
    if (!mins) return "À disc.";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ''}`;
    return `${mins} min`;
  };

  useEffect(() => {
    if (selectedDate && service?._id) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchSlots = async (date) => {
    setIsLoadingSlots(true);
    try {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}reservations/available-slots?serviceId=${service._id}&date=${dateStr}`, {
        withCredentials: true
      });
      setAvailableSlots(res.data);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  if (!service) return null;

  const handleReserve = () => {
    if (!selectedDate || !selectedSlot) {
        alert("Veuillez choisir une date et un créneau horaire.");
        return;
    }
    onReserve({
        ...service,
        bookingDate: selectedDate,
        bookingSlot: selectedSlot,
        notes: note
    });
  };

  return (
    <div style={pd.overlay} onClick={onClose}>
      <div style={pd.modal} onClick={e => e.stopPropagation()}>
        <button type="button" style={pd.closeBtn} onClick={onClose}><X size={24} /></button>
               <div style={pd.scrollArea}>
          <div style={pd.container}>
            <div style={pd.leftCol}>
              <div style={pd.mainImgBox}>
                {selectedImg ? (
                  <img src={toImageUrl(selectedImg)} alt={service.name} style={pd.mainImg} />
                ) : (
                  <ShoppingBag size={100} color="#cbd5e1" />
                )}
              </div>
              <div style={pd.thumbList}>
                {service.imagesServices?.map((img, i) => (
                  <div 
                    key={i} 
                    style={{...pd.thumbBox, border: selectedImg === img ? '2px solid #1E3A5F' : '1px solid #e2e8f0'}}
                    onMouseEnter={() => setSelectedImg(img)}
                  >
                    <img src={toImageUrl(img)} alt="" style={pd.thumb} />
                  </div>
                ))}
              </div>
            </div>

            <div style={pd.midCol}>
              <h1 style={pd.title}>{service.name}</h1>
              <div style={pd.priceRow}>
                <span style={pd.currentPrice}>{service.price?.toLocaleString() || 'À disc.'} DT</span>
              </div>

              <div style={pd.statusRow}>
                <span style={{...pd.status, color: '#10b981'}}>
                  <Clock size={16} /> DURÉE: {formatDuration(service.duration)}
                </span>
              </div>

              <div style={pd.divider} />

              <div style={pd.bookingSection}>
                  <div style={pd.bookingHeader}>
                      <Calendar size={18} color="#1E3A5F" />
                      <h3 style={pd.bookingTitle}>RÉSERVER UN CRÉNEAU</h3>
                  </div>

                  <div style={pd.bookingContent}>
                      <div style={pd.calendarWrapper}>
                          <p style={pd.stepLabel}>1. Choisissez une date</p>
                          <CalendarPicker 
                              selectedDate={selectedDate} 
                              onDateSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }} 
                          />
                      </div>

                      <div style={pd.slotsWrapper}>
                          <p style={pd.stepLabel}>2. Choisissez une heure</p>
                          <TimeSlotPicker 
                              slots={availableSlots} 
                              selectedSlot={selectedSlot} 
                              onSlotSelect={setSelectedSlot}
                              isLoading={isLoadingSlots}
                          />
                      </div>
                  </div>

                  <div style={pd.noteSection}>
                      <p style={pd.stepLabel}>3. Notes complémentaires (facultatif)</p>
                      <textarea 
                          placeholder="Ex: Précisions sur votre besoin, code d'accès, etc..."
                          style={pd.noteArea}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                      />
                  </div>
              </div>

              <div style={pd.actionRow}>
                <button 
                  type="button" 
                  disabled={!selectedDate || !selectedSlot}
                  style={{ ...pd.buyBtn, opacity: (!selectedDate || !selectedSlot) ? 0.5 : 1 }} 
                  onClick={handleReserve}
                >
                  {!selectedDate || !selectedSlot ? "CHOISISSEZ UNE DATE & HEURE" : "CONFIRMER LA RÉSERVATION"}
                </button>

              </div>
            </div>

            <div style={pd.rightCol}>
              <div style={pd.sellerCard}>
                <div style={pd.sellerHeader}>
                  <div style={pd.sellerLogo}>
                    {(service.companyId?.logoUrl || service.professionalId?.photoProfessional) ? (
                      <img src={toImageUrl(service.companyId?.logoUrl || service.professionalId?.photoProfessional)} alt="" style={pd.logo} />
                    ) : (
                      <Building2 size={24} color="#1c79faff" />
                    )}
                  </div>
                  <div>
                    <h4 style={pd.sellerName}>{service.companyId?.companyName || service.professionalId?.fullName || 'Prestataire'}</h4>
                    <div style={pd.sellerRating}>
                      <Star size={12} fill="#fbbf24" color="#fbbf24" />
                      <Star size={12} fill="#fbbf24" color="#fbbf24" />
                      <Star size={12} fill="#fbbf24" color="#fbbf24" />
                      <Star size={12} fill="#fbbf24" color="#fbbf24" />
                      <Star size={12} color="#cbd5e1" />
                      <span style={pd.ratingCount}>5</span>
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  style={pd.visitBtn} 
                  onClick={() => {
                    if (service.professionalId) {
                      navigate(`/user/professional/${service.professionalId?._id || service.professionalId}`);
                    } else {
                      navigate(`/user/company/${service.companyId?._id || service.companyId}`);
                    }
                  }}
                >
                  {service.professionalId ? "VOIR LE PROFIL" : "VISITER L'ENTREPRISE"}
                </button>
              </div>
            </div>
          </div>

          <div style={pd.bottomSection}>
              <div style={pd.divider} />
              <h3 style={pd.overviewTitle}>DESCRIPTION DU SERVICE</h3>
              <p style={pd.descriptionText}>
              {service.description || 'Aucune description disponible'}
              </p>
          </div>
        </div>
        <style>{`
          button:hover:not(:disabled) {
            filter: brightness(1.1);
            transform: translateY(-1px);
          }
          button:active:not(:disabled) {
            transform: translateY(0);
          }
        `}</style>
      </div>
    </div>
  );
};

const pd = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#fff', width: '100%', maxWidth: '1100px', borderRadius: '16px', position: 'relative', overflow: 'hidden', maxHeight: '95vh', display: 'flex', flexDirection: 'column' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', zIndex: 10 },
  container: { display: 'flex', gap: '30px', padding: '40px 40px 0' },
  leftCol: { width: '350px', flexShrink: 0 },
  mainImgBox: { width: '100%', aspectRatio: '1/1', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '15px' },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbList: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  thumbBox: { width: '70px', height: '70px', borderRadius: '8px', cursor: 'pointer', overflow: 'hidden', transition: '0.2s' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  midCol: { flex: 1, minWidth: 0 },
  title: { fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' },
  priceRow: { marginBottom: '20px' },
  currentPrice: { fontSize: '24px', fontWeight: '800', color: '#1E3A5F' },
  statusRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' },
  status: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '700', color: '#10b981' },
  divider: { height: '1px', background: '#e2e8f0', margin: '25px 0' },
  qtySection: { marginBottom: '25px' },
  qtyLabel: { fontSize: '12px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '10px', textTransform: 'uppercase' },
  qtyBox: { display: 'flex', alignItems: 'center', width: 'fit-content', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
  qtyBtn: { width: '40px', height: '40px', background: '#fff', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: '600', color: '#1E3A5F', transition: '0.2s' },
  qtyInput: { width: '50px', height: '40px', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#1E3A5F' },
  actionRow: { display: 'flex', gap: '15px', marginBottom: '35px', marginTop: '20px' },
  buyBtn: { flex: 1, height: '52px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 6px -1px rgba(30, 58, 95, 0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  bookingSection: { 
    background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '25px',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
  },
  bookingHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  bookingTitle: { fontSize: '15px', fontWeight: '800', color: '#1E3A5F', margin: 0 },
  bookingContent: { display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' },
  calendarWrapper: { flex: '0 0 280px' },
  slotsWrapper: { flex: 1, minWidth: '200px' },
  stepLabel: { fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.025em' },
  noteSection: { marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' },
  noteArea: { width: '100%', minHeight: '80px', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#1e293b', outline: 'none', transition: '0.2s', resize: 'vertical' },
  scrollArea: { flex: 1, overflowY: 'auto', paddingBottom: '20px' },
  bottomSection: { padding: '0 40px 40px' },
  descriptionText: { fontSize: '15px', color: '#475569', lineHeight: '1.7', margin: 0 },
  overviewTitle: { fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '20px 0 10px', textTransform: 'uppercase' },
  rightCol: { width: '250px', flexShrink: 0 },
  sellerCard: { padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' },
  sellerHeader: { display: 'flex', gap: '12px', marginBottom: '20px' },
  sellerLogo: { width: '48px', height: '48px', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: '100%', height: '100%', objectFit: 'cover' },
  sellerName: { fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' },
  sellerRating: { display: 'flex', alignItems: 'center', gap: '2px' },
  ratingCount: { fontSize: '12px', color: '#94a3b8', marginLeft: '4px', fontWeight: '600' },
  visitBtn: { width: '100%', padding: '10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#1E3A5F', cursor: 'pointer', transition: '0.2s' }
};

export default ServiceDetail;
