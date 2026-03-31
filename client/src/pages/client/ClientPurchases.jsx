import React, { useState } from "react";
import { useGetMyOrdersQuery } from "../../redux/features/orderApiSlice";
import { useGetMyReservationsQuery } from "../../redux/features/reservationApiSlice";
import { 
  ShoppingBag, 
  Calendar, 
  Clock, 
  MapPin, 
  Package,
  Loader2,
  AlertCircle,
  Building2
} from "lucide-react";
import styles from "../../styles/Commandes.module.css"; // Reuse same styles for consistency

const ClientPurchases = () => {
  const [activeTab, setActiveTab] = useState("orders");

  const { data: orders = [], isLoading: loadingOrders } = useGetMyOrdersQuery(undefined, { pollingInterval: 3000 });
  const { data: reservations = [], isLoading: loadingReservations } = useGetMyReservationsQuery(undefined, { pollingInterval: 3000 });

  const getStatusBadge = (status) => {
    const s = {
      pending: { bg: "#fef3c7", color: "#92400e", label: "En attente" },
      confirmed: { bg: "#dcfce7", color: "#166534", label: "Confirmé" },
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
                          <span>{item.price * item.quantity} €</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.totalRow}>
                      <span>Total payé :</span>
                      <span className={styles.totalPrice}>{order.totalPrice} €</span>
                    </div>
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
