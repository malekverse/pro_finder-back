import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetMyOrdersQuery } from "../../redux/features/orderApiSlice";
import { useGetMyReservationsQuery } from "../../redux/features/reservationApiSlice";
import { useInitializePaymentMutation } from "../../redux/features/paymentApiSlice";
import { 
  ShoppingBag, 
  Calendar, 
  Clock, 
  MapPin, 
  Package,
  Loader2,
  AlertCircle,
  Building2,
  FileText,
  CreditCard
} from "lucide-react";
import styles from "../../styles/Commandes.module.css"; // Reuse same styles for consistency

const ClientPurchases = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");

  const { data: orders = [], isLoading: loadingOrders } = useGetMyOrdersQuery(undefined, { pollingInterval: 3000 });
  const { data: reservations = [], isLoading: loadingReservations } = useGetMyReservationsQuery(undefined, { pollingInterval: 3000 });
  const [initializePayment, { isLoading: isPaying }] = useInitializePaymentMutation();

  const handlePayment = async (item, type) => {
    try {
      const amount = item.totalPrice || item.totalAmount || item.totalValue || item.serviceId?.price;
      if (!amount) return alert("Montant invalide");

      console.log("🚀 [handlePayment] Sending payment items:", [
        {
          entityId: item._id,
          entityType: type === 'reservation' ? 'Reservation' : 'Order'
        }
      ]);

      const res = await initializePayment({
        items: [
          {
            entityId: item._id,
            entityType: type === 'reservation' ? 'Reservation' : 'Order'
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
          <h1>Mes Achats & Réservations</h1>
          <p>Suivez l'état de vos commandes et vos rendez-vous</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          onClick={() => setActiveTab("orders")}
          className={activeTab === "orders" ? styles.tabActive : styles.tab}
        >
          <ShoppingBag size={18} /> Mes Commandes ({orders.length})
        </button>
        <button 
          onClick={() => setActiveTab("reservations")}
          className={activeTab === "reservations" ? styles.tabActive : styles.tab}
        >
          <Calendar size={18} /> Mes Réservations ({reservations.length})
        </button>
      </div>

      {activeTab === "orders" ? (
        <div className={styles.content}>
          {loadingOrders ? (
            <div className={styles.loader}><Loader2 className="animate-spin" /></div>
          ) : orders.length === 0 ? (
            <div className={styles.empty}>
              <Package size={48} />
              <p>Vous n'avez passé aucune commande.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {orders.map((order) => (
                <div key={order._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.orderId}>Commande #{order._id.slice(-6).toUpperCase()}</div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className={styles.cardBody}>
                    <div className={styles.userSection}>
                      <Building2 size={16} />
                      <div>
                        <div className={styles.userName}>{order.companyId?.companyName}</div>
                      </div>
                    </div>

                    <div className={styles.itemsList}>
                      {order.items.map((item, idx) => (
                        <div key={idx} className={styles.itemRow}>
                          <span>{item.quantity}x {item.productId?.name}</span>
                          <span>{item.price * item.quantity} </span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.totalRow}>
                      <span>Total payé :</span>
                      <span className={styles.totalPrice}>{order.totalPrice} </span>
                    </div>

                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button 
                        onClick={() => handlePayment(order, 'order')}
                        disabled={isPaying}
                        className={styles.payButton}
                        style={{
                          width: '100%', marginTop: '15px', padding: '10px', borderRadius: '10px',
                          border: 'none', background: '#fbbf24', color: '#000', fontWeight: '800',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          opacity: isPaying ? 0.7 : 1
                        }}
                      >
                        <CreditCard size={18} /> {isPaying ? 'Chargement...' : 'Payer avec Flouci'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.content}>
          {loadingReservations ? (
            <div className={styles.loader}><Loader2 className="animate-spin" /></div>
          ) : reservations.length === 0 ? (
            <div className={styles.empty}>
              <Calendar size={48} />
              <p>Vous n'avez aucune réservation.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {reservations.map((res) => (
                <div key={res._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.orderId}>Réservation #{res._id.slice(-6).toUpperCase()}</div>
                    {getStatusBadge(res.status)}
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.userSection}>
                      <Building2 size={16} />
                      <div>
                        <div className={styles.userName}>{res.companyId?.companyName}</div>
                      </div>
                    </div>

                    <div className={styles.serviceBox}>
                      <div className={styles.serviceName}>{res.serviceId?.name}</div>
                      <div className={styles.serviceMeta}>
                        <Clock size={14} /> {res.serviceId?.duration} min | {res.serviceId?.price} 
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

                    {res.status === 'confirmed' && (!res.quote || (res.quote.status !== 'accepted' && !res.quote.isPaid)) && (
                      <button 
                        onClick={() => handlePayment(res, 'reservation')}
                        disabled={isPaying}
                        style={{
                          width: '100%', marginTop: '15px', padding: '10px', borderRadius: '10px',
                          border: 'none', background: '#fbbf24', color: '#000', fontWeight: '800',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          opacity: isPaying ? 0.7 : 1
                        }}
                      >
                        <CreditCard size={18} /> {isPaying ? 'Chargement...' : 'Payer avec Flouci'}
                      </button>
                    )}

                    {res.quote && !['paid', 'completed'].includes(res.status) && (
                      <div 
                        onClick={() => navigate("/user/documents", { state: { tab: "quotes" } })}
                        style={{
                          marginTop: '15px',
                          padding: '12px',
                          backgroundColor: res.quote.status === 'accepted' ? '#dcfce7' : '#eff6ff',
                          borderRadius: '12px',
                          border: `1px solid ${res.quote.status === 'accepted' ? '#86efac' : '#bfdbfe'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = res.quote.status === 'accepted' ? '#bbf7d0' : '#dbeafe'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = res.quote.status === 'accepted' ? '#dcfce7' : '#eff6ff'}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: res.quote.status === 'accepted' ? '#166534' : '#24416b',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <FileText size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: (res.quote.isPaid || res.status === 'paid') ? '#166534' : '#1e3a8a' }}>
                            Devis {res.quote.status === 'accepted' ? 'Accepté' : 'Reçu'}
                          </div>
                          <div style={{ fontSize: '11px', color: (res.quote.isPaid || res.status === 'paid') ? '#15803d' : '#1e40af' }}>
                            {(res.quote.isPaid || res.status === 'paid') ? 'Paiement effectué' : 'Cliquez pour voir les détails'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientPurchases;
