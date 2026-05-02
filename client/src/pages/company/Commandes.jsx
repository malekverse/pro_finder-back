import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  useGetCompanyOrdersQuery, 
  useUpdateOrderStatusMutation 
} from "../../redux/features/orderApiSlice";
import { 
  useGetCompanyReservationsQuery, 
  useUpdateReservationStatusMutation 
} from "../../redux/features/reservationApiSlice";
import { useGetProviderPaymentsQuery } from "../../redux/features/paymentApiSlice";
import { 
  ShoppingBag, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Package,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  DollarSign
} from "lucide-react";
import styles from "../../styles/Commandes.module.css";
import CompanyCalendar from "../../components/dashboard/Company/CompanyCalendar";

const Commandes = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders"); // orders, reservations, or calendar

  const { data: orders = [], isLoading: loadingOrders } = useGetCompanyOrdersQuery(undefined, { pollingInterval: 3000 });
  const { data: reservations = [], isLoading: loadingReservations } = useGetCompanyReservationsQuery(undefined, { pollingInterval: 3000 });
  const { data: payments = [], isLoading: loadingPayments } = useGetProviderPaymentsQuery(undefined, { pollingInterval: 3000 });

  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updateReservationStatus] = useUpdateReservationStatusMutation();

  const handleUpdateOrder = async (orderId, status) => {
    try {
      await updateOrderStatus({ orderId, status }).unwrap();
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };

  const handleUpdateReservation = async (reservationId, status) => {
    try {
      await updateReservationStatus({ reservationId, status }).unwrap();
    } catch (err) {
      console.error("Failed to update reservation:", err);
    }
  };

  const handleCreateQuote = (reservation) => {
    // S'assurer qu'on a bien l'ID de l'utilisateur
    const userId = reservation.userId?._id || reservation.userId;
    const userName = reservation.userId?.fullName || "Client";
    const userEmail = reservation.userId?.email || "";
    const userPhone = reservation.userId?.phone || "";

    console.log("Navigating to create quote for reservation:", reservation._id, "User:", userId);

    // Rediriger vers la page des documents avec l'onglet devis actif et les données pré-remplies
    navigate("/company/documents", { 
      state: { 
        tab: "quotes",
        openModal: true,
        prefill: {
          reservationId: reservation._id,
          userId: userId,
          userName: userName,
          userEmail: userEmail,
          userPhone: userPhone,
          serviceId: reservation.serviceId?._id || reservation.serviceId,
          serviceName: reservation.serviceId?.name || "Service",
          price: reservation.serviceId?.price || 0,
          duration: reservation.serviceId?.duration || "60 min",
          notes: `Détails de la réservation #${reservation._id.slice(-6).toUpperCase()} du ${new Date(reservation.date).toLocaleDateString()}.`
        }
      } 
    });
  };

  const getStatusBadge = (status) => {
    const s = {
      pending: { bg: "#fef3c7", color: "#92400e", label: "En attente" },
      confirmed: { bg: "#dcfce7", color: "#166534", label: "Confirmé" },
      paid: { bg: "#dcfce7", color: "#166534", label: "Payé" },
      shipped: { bg: "#dbeafe", color: "#1e40af", label: "Expédié" },
      delivered: { bg: "#f0fdf4", color: "#15803d", label: "Livré" },
      cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Annulé" },
      completed: { bg: "#f0fdf4", color: "#15803d", label: "Terminé" },
    };
    const style = s[status] || s.pending;
    return (
      <span style={{ 
        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
        background: style.bg, color: style.color, textTransform: 'uppercase'
      }}>
        {style.label}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Gestion des Ventes</h1>
          <p>Suivez vos commandes de produits et vos réservations de services</p>
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        <button 
          onClick={() => setActiveTab("orders")}
          className={activeTab === "orders" ? styles.tabActive : styles.tab}
        >
          <ShoppingBag size={18} /> Commandes ({orders.length})
        </button>
        <button 
          onClick={() => setActiveTab("reservations")}
          className={activeTab === "reservations" ? styles.tabActive : styles.tab}
        >
          <Calendar size={18} /> Réservations ({reservations.length})
        </button>
        <button 
          onClick={() => setActiveTab("payments")}
          className={activeTab === "payments" ? styles.tabActive : styles.tab}
        >
          <DollarSign size={18} /> Paiements ({payments.length})
        </button>
        <button 
          onClick={() => setActiveTab("calendar")}
          className={activeTab === "calendar" ? styles.tabActive : styles.tab}
        >
          <Calendar size={18} /> Vue Calendrier
        </button>
      </div>

      {activeTab === "orders" ? (
        <div className={styles.content}>
          {loadingOrders ? (
            <div className={styles.loader}><Loader2 className="animate-spin" /></div>
          ) : orders.length === 0 ? (
            <div className={styles.empty}>
              <Package size={48} />
              <p>Aucune commande pour le moment.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {[
                { title: "Nouvelles Commandes", status: ["pending", "paid"], icon: <Clock size={20} color="#f59e0b" />, bg: "#fffbeb" },
                { title: "En cours de traitement", status: ["confirmed", "shipped"], icon: <Truck size={20} color="#3b82f6" />, bg: "#eff6ff" },
                { title: "Terminées", status: ["delivered"], icon: <Package size={20} color="#94a3b8" />, bg: "#f8fafc" }
              ].map((section, idx) => {
                const filtered = orders.filter(o => section.status.includes(o.status));
                if (filtered.length === 0) return null;

                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 20px', background: section.bg, borderRadius: '12px', borderLeft: `5px solid ${section.icon.props.color}` }}>
                      {section.icon}
                      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{section.title} ({filtered.length})</h2>
                    </div>
                    <div className={styles.grid}>
                      {filtered.map((order) => (
                        <div key={order._id} className={styles.card} style={{ border: ["pending", "paid"].includes(order.status) ? '2px solid #f59e0b' : '1px solid #e2e8f0' }}>
                          <div className={styles.cardHeader}>
                            <div className={styles.orderId}>Commande #{order._id.slice(-6).toUpperCase()}</div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className={styles.cardBody}>
                            <div className={styles.userSection}>
                              <User size={16} />
                              <div>
                                <div className={styles.userName}>{order.userId?.fullName}</div>
                                <div className={styles.userMeta}>{order.userId?.email}</div>
                              </div>
                            </div>
                            <div className={styles.itemsList}>
                              {order.items.map((item, idx) => (
                                <div key={idx} className={styles.itemRow}>
                                  <span>{item.quantity}x {item.productId?.name}</span>
                                  <span>{item.price * item.quantity} €</span>
                                </div>
                              ))}
                            </div>
                            <div className={styles.addressSection}>
                              <MapPin size={16} />
                              <div className={styles.address}>
                                {order.shippingAddress.street}, {order.shippingAddress.city} {order.shippingAddress.zipCode}
                              </div>
                            </div>
                            <div className={styles.totalRow}>
                              <span>Total :</span>
                              <span className={styles.totalPrice}>{order.totalPrice} €</span>
                            </div>
                          </div>
                          <div className={styles.cardFooter}>
                            {order.status === "pending" && (
                              <>
                                <button onClick={() => handleUpdateOrder(order._id, "confirmed")} className={styles.btnConfirm}>Confirmer</button>
                                <button onClick={() => handleUpdateOrder(order._id, "cancelled")} className={styles.btnCancel}>Refuser</button>
                              </>
                            )}
                            {order.status === "paid" && (
                              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <button onClick={() => handleUpdateOrder(order._id, "confirmed")} className={styles.btnConfirm} style={{ flex: 1 }}>Confirmer & Préparer</button>
                                <button 
                                  onClick={() => navigate("/company/invoices", { state: { orderId: order._id } })} 
                                  className={styles.btnDeliver}
                                  style={{ flex: 1, backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                                >
                                  <FileSpreadsheet size={16} /> Facture
                                </button>
                              </div>
                            )}
                            {order.status === "confirmed" && (
                              <button onClick={() => handleUpdateOrder(order._id, "shipped")} className={styles.btnShip}><Truck size={16} /> Marquer comme expédié</button>
                            )}
                            {order.status === "shipped" && (
                              <button onClick={() => handleUpdateOrder(order._id, "delivered")} className={styles.btnDeliver}>Marquer comme livré</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === "reservations" ? (
        <div className={styles.content}>
          {loadingReservations ? (
            <div className={styles.loader}><Loader2 className="animate-spin" /></div>
          ) : reservations.length === 0 ? (
            <div className={styles.empty}>
              <Calendar size={48} />
              <p>Aucune réservation pour le moment.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
               {[
                { title: "À confirmer", status: "pending", icon: <Clock size={20} color="#f59e0b" />, bg: "#fffbeb" },
                { title: "Confirmées / À venir", status: "confirmed", icon: <CheckCircle size={20} color="#10b981" />, bg: "#f0fdf4" },
                { title: "Historique", status: ["completed", "cancelled"], icon: <Calendar size={20} color="#94a3b8" />, bg: "#f8fafc" }
              ].map((section, idx) => {
                const filtered = reservations.filter(r => Array.isArray(section.status) ? section.status.includes(r.status) : r.status === section.status);
                if (filtered.length === 0) return null;

                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 20px', background: section.bg, borderRadius: '12px', borderLeft: `5px solid ${section.icon.props.color || section.icon.props.fill}` }}>
                      {section.icon}
                      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{section.title} ({filtered.length})</h2>
                    </div>
                    <div className={styles.grid}>
                      {filtered.map((res) => (
                        <div key={res._id} className={styles.card} style={{ border: res.status === "pending" ? '2px solid #f59e0b' : '1px solid #e2e8f0' }}>
                          <div className={styles.cardHeader}>
                            <div className={styles.orderId}>Réservation #{res._id.slice(-6).toUpperCase()}</div>
                            {getStatusBadge(res.status)}
                          </div>
                          <div className={styles.cardBody}>
                            <div className={styles.userSection}>
                              <User size={16} />
                              <div>
                                <div className={styles.userName}>{res.userId?.fullName}</div>
                                <div className={styles.userMeta}>{res.userId?.phone}</div>
                              </div>
                            </div>
                            <div className={styles.serviceBox}>
                              <div className={styles.serviceName}>{res.serviceId?.name}</div>
                              <div className={styles.serviceMeta}>
                                <Clock size={14} /> {res.serviceId?.duration} min | {res.serviceId?.price} €
                              </div>
                            </div>
                            <div className={styles.dateTimeSection}>
                              <div className={styles.dateBadge}>
                                <Calendar size={14} /> {new Date(res.date).toLocaleDateString()}
                              </div>
                              <div className={styles.timeBadge}>
                                <Clock size={14} /> {res.timeSlot}
                              </div>
                            </div>
                            {res.notes && (
                              <div className={styles.notesBox}>
                                <AlertCircle size={14} />
                                <p>{res.notes}</p>
                              </div>
                            )}

                            {res.quote && (
                              <div 
                                onClick={() => navigate("/company/documents", { state: { tab: "quotes" } })}
                                style={{
                                  marginTop: '15px',
                                  padding: '12px',
                                  backgroundColor: res.quote.status === 'accepted' ? '#dcfce7' : res.quote.status === 'rejected' ? '#fee2e2' : '#eff6ff',
                                  borderRadius: '12px',
                                  border: `1px solid ${res.quote.status === 'accepted' ? '#86efac' : res.quote.status === 'rejected' ? '#fecaca' : '#bfdbfe'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                              >
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  backgroundColor: res.quote.status === 'accepted' ? '#166534' : res.quote.status === 'rejected' ? '#991b1b' : '#24416b',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white'
                                }}>
                                  <FileSpreadsheet size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontSize: '13px', 
                                    fontWeight: '700', 
                                    color: res.quote.status === 'accepted' ? '#166534' : res.quote.status === 'rejected' ? '#991b1b' : '#1e3a8a' 
                                  }}>
                                    Devis {res.quote.status === 'accepted' ? 'Accepté' : res.quote.status === 'rejected' ? 'Refusé' : 'Envoyé'}
                                  </div>
                                  <div style={{ 
                                    fontSize: '11px', 
                                    color: res.quote.status === 'accepted' ? '#15803d' : res.quote.status === 'rejected' ? '#b91c1c' : '#1e40af' 
                                  }}>
                                    N° {res.quote.quoteNumber} • {res.quote.totalAmount.toFixed(2)} TND
                                  </div>
                                </div>
                                {res.quote.status === 'accepted' && (
                                  <div style={{ color: '#166534' }}>
                                    <CheckCircle size={18} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className={styles.cardFooter}>
                            {res.status === "pending" && !res.quote && (
                              <>
                                <button 
                                  onClick={() => handleCreateQuote(res)} 
                                  className={styles.btnConfirm}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                  <FileSpreadsheet size={16} /> Établir un Devis
                                </button>
                                <button onClick={() => handleUpdateReservation(res._id, "cancelled")} className={styles.btnCancel}>Décliner</button>
                              </>
                            )}
                            {res.status === "confirmed" && (
                              <button onClick={() => handleUpdateReservation(res._id, "completed")} className={styles.btnDeliver}>Terminé</button>
                            )}
                            {res.status === "paid" && (
                              <button 
                                onClick={() => navigate("/company/invoices", { state: { reservationId: res._id } })} 
                                className={styles.btnDeliver}
                                style={{ width: '100%', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                              >
                                <FileSpreadsheet size={16} /> Voir la Facture
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === "payments" ? (
        <div className={styles.content}>
          {loadingPayments ? (
            <div className={styles.loader}><Loader2 className="animate-spin" /></div>
          ) : payments.length === 0 ? (
            <div className={styles.empty}>
              <DollarSign size={48} />
              <p>Aucun paiement reçu pour le moment.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {payments.map((payment) => (
                <div key={payment._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.orderId}>Paiement #{payment._id.slice(-6).toUpperCase()}</div>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                      background: payment.status === 'success' ? '#dcfce7' : '#fee2e2', 
                      color: payment.status === 'success' ? '#166534' : '#991b1b', 
                      textTransform: 'uppercase'
                    }}>
                      {payment.status === 'success' ? 'Payé' : 'Échoué'}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.userSection}>
                      <User size={16} />
                      <div>
                        <div className={styles.userName}>{payment.userId?.fullName}</div>
                        <div className={styles.userEmail}>{payment.userId?.email}</div>
                      </div>
                    </div>
                    <div style={{ margin: '15px 0', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Montant :</span>
                        <span style={{ fontWeight: '800', color: '#1e293b' }}>{payment.amount.toFixed(2)} TND</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Date :</span>
                        <span style={{ fontSize: '13px', color: '#1e293b' }}>{new Date(payment.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={12} /> Flouci ID: {payment.flouciPaymentId?.slice(0, 15)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.content}>
           <CompanyCalendar 
                reservations={reservations.filter(r => ["pending", "confirmed", "paid", "completed", "blocked"].includes(r.status))} 
                onUpdateStatus={handleUpdateReservation}
           />
        </div>
      )}
    </div>
  );
};

export default Commandes;
