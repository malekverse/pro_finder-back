import React, { useState } from "react";
import { 
  useGetCompanyOrdersQuery, 
  useUpdateOrderStatusMutation 
} from "../../redux/features/orderApiSlice";
import { 
  useGetCompanyReservationsQuery, 
  useUpdateReservationStatusMutation 
} from "../../redux/features/reservationApiSlice";
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
  AlertCircle
} from "lucide-react";
import styles from "../../styles/Commandes.module.css";

const Commandes = () => {
  const [activeTab, setActiveTab] = useState("orders"); // orders or reservations

  const { data: orders = [], isLoading: loadingOrders } = useGetCompanyOrdersQuery(undefined, { pollingInterval: 3000 });
  const { data: reservations = [], isLoading: loadingReservations } = useGetCompanyReservationsQuery(undefined, { pollingInterval: 3000 });

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
            <div className={styles.grid}>
              {orders.map((order) => (
                <div key={order._id} className={styles.card}>
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
          )}
        </div>
      ) : (
        <div className={styles.content}>
          {loadingReservations ? (
            <div className={styles.loader}><Loader2 className="animate-spin" /></div>
          ) : reservations.length === 0 ? (
            <div className={styles.empty}>
              <Calendar size={48} />
              <p>Aucune réservation pour le moment.</p>
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
                  </div>

                  <div className={styles.cardFooter}>
                    {res.status === "pending" && (
                      <>
                        <button onClick={() => handleUpdateReservation(res._id, "confirmed")} className={styles.btnConfirm}>Accepter</button>
                        <button onClick={() => handleUpdateReservation(res._id, "cancelled")} className={styles.btnCancel}>Décliner</button>
                      </>
                    )}
                    {res.status === "confirmed" && (
                      <button onClick={() => handleUpdateReservation(res._id, "completed")} className={styles.btnDeliver}>Terminé</button>
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

export default Commandes;
