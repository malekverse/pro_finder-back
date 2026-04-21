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
import { 
  ShoppingBag, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle, 
  Truck, 
  Package,
  Loader2,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import styles from "../../styles/Commandes.module.css";
import CompanyCalendar from "../../components/dashboard/Company/CompanyCalendar";

const ProfessionalCommandes = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders"); // orders, reservations, or calendar

  const { data: orders = [], isLoading: loadingOrders } = useGetCompanyOrdersQuery(undefined, { pollingInterval: 5000 });
  const { data: reservations = [], isLoading: loadingReservations } = useGetCompanyReservationsQuery(undefined, { pollingInterval: 5000 });

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
    navigate("/professional/documents", { 
      state: { 
        tab: "quotes",
        openModal: true,
        prefill: {
          reservationId: reservation._id,
          userId: reservation.userId?._id,
          userName: reservation.userId?.fullName,
          serviceId: reservation.serviceId?._id,
          serviceName: reservation.serviceId?.name,
          price: reservation.serviceId?.price,
          notes: `Devis pour réservation #${reservation._id.slice(-6).toUpperCase()} du ${new Date(reservation.date).toLocaleDateString()}.`
        }
      } 
    });
  };

  const getStatusBadge = (status) => {
    const s = {
      pending: { bg: "#fef3c7", color: "#92400e", label: "Attente" },
      confirmed: { bg: "#dcfce7", color: "#166534", label: "Confirmé" },
      shipped: { bg: "#dbeafe", color: "#1e40af", label: "Expédié" },
      delivered: { bg: "#f0fdf4", color: "#15803d", label: "Livré" },
      cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Annulé" },
      completed: { bg: "#f0fdf4", color: "#15803d", label: "Terminé" },
    };
    const style = s[status] || s.pending;
    return (
      <span style={{ 
        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
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
          <h1 style={{fontSize: '28px', color: '#1e293b'}}>Ventes & Rendez-vous</h1>
          <p style={{color: '#64748b'}}>Gérez vos commandes et votre planning de réservations.</p>
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabs} style={{backgroundColor: 'white', padding: '6px', borderRadius: '16px', display: 'inline-flex', gap: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px'}}>
        <button 
          onClick={() => setActiveTab("orders")}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            backgroundColor: activeTab === "orders" ? "#24416b" : "transparent",
            color: activeTab === "orders" ? "white" : "#64748b",
            fontWeight: '600', transition: '0.2s'
          }}
        >
          <ShoppingBag size={18} /> Commandes ({orders.length})
        </button>
        <button 
          onClick={() => setActiveTab("reservations")}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            backgroundColor: activeTab === "reservations" ? "#24416b" : "transparent",
            color: activeTab === "reservations" ? "white" : "#64748b",
            fontWeight: '600', transition: '0.2s'
          }}
        >
          <Calendar size={18} /> Réservations ({reservations.length})
        </button>
        <button 
          onClick={() => setActiveTab("calendar")}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            backgroundColor: activeTab === "calendar" ? "#24416b" : "transparent",
            color: activeTab === "calendar" ? "white" : "#64748b",
            fontWeight: '600', transition: '0.2s'
          }}
        >
          <Calendar size={18} /> Calendrier
        </button>
      </div>

      {activeTab === "orders" ? (
        <div className={styles.content}>
          {loadingOrders ? (
            <div style={{display: 'flex', justifyContent: 'center', padding: '60px'}}><Loader2 className="animate-spin" size={40} color="#24416b" /></div>
          ) : orders.length === 0 ? (
            <div style={{textAlign: 'center', padding: '80px', background: 'white', borderRadius: '24px'}} >
              <Package size={48} color="#cbd5e1" style={{marginBottom: '16px', marginLeft: 'auto', marginRight: 'auto'}} />
              <p style={{color: '#64748b'}}>Aucune commande reçue.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {orders.map((order) => (
                <div key={order._id} className={styles.card} style={{borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0'}}>
                  <div className={styles.cardHeader} style={{padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{fontWeight: '700'}}>Commande #{order._id.slice(-6).toUpperCase()}</div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div style={{padding: '20px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px'}}>
                      <div style={{width: '40px', height: '40px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><User size={20} color="#64748b" /></div>
                      <div>
                        <div style={{fontWeight: '700', fontSize: '14px'}}>{order.userId?.fullName}</div>
                        <div style={{fontSize: '12px', color: '#94a3b8'}}>{order.userId?.email}</div>
                      </div>
                    </div>

                    <div style={{background: '#f8fafc', padding: '12px', borderRadius: '12px', marginBottom: '20px'}}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px'}}>
                          <span>{item.quantity}x {item.productId?.name}</span>
                          <span style={{fontWeight: '600'}}>{item.price * item.quantity} TND</span>
                        </div>
                      ))}
                      <div style={{borderTop: '1px solid #e2e8f0', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: '700'}}>
                        <span>Total</span>
                        <span style={{color: '#24416b'}}>{order.totalPrice} TND</span>
                      </div>
                    </div>

                    <div style={{display: 'flex', gap: '8px', color: '#64748b', fontSize: '13px'}}>
                       <MapPin size={16} /> <span>{order.shippingAddress.street}, {order.shippingAddress.city}</span>
                    </div>
                  </div>

                  <div style={{padding: '20px', background: '#f8fafc', display: 'flex', gap: '8px'}}>
                    {order.status === "pending" && (
                      <>
                        <button onClick={() => handleUpdateOrder(order._id, "confirmed")} style={{flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#24416b', color: 'white', fontWeight: '600', cursor: 'pointer'}}>Confirmer</button>
                        <button onClick={() => handleUpdateOrder(order._id, "cancelled")} style={{flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '600', cursor: 'pointer'}}>Refuser</button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <button onClick={() => handleUpdateOrder(order._id, "shipped")} style={{width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#24416b', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}><Truck size={18} /> Marquer Expédié</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "reservations" ? (
        <div className={styles.content}>
          {loadingReservations ? (
            <div style={{display: 'flex', justifyContent: 'center', padding: '60px'}}><Loader2 className="animate-spin" size={40} color="#24416b" /></div>
          ) : reservations.length === 0 ? (
            <div style={{textAlign: 'center', padding: '80px', background: 'white', borderRadius: '24px'}} >
              <Calendar size={48} color="#cbd5e1" style={{marginBottom: '16px', marginLeft: 'auto', marginRight: 'auto'}} />
              <p style={{color: '#64748b'}}>Aucun rendez-vous planifié.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {reservations.map((res) => (
                <div key={res._id} className={styles.card} style={{borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0'}}>
                   <div style={{padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{fontWeight: '700'}}>Réservation #{res._id.slice(-6).toUpperCase()}</div>
                    {getStatusBadge(res.status)}
                  </div>

                  <div style={{padding: '20px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px'}}>
                      <div style={{width: '40px', height: '40px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><User size={20} color="#64748b" /></div>
                      <div>
                        <div style={{fontWeight: '700', fontSize: '14px'}}>{res.userId?.fullName}</div>
                        <div style={{fontSize: '12px', color: '#94a3b8'}}>{res.userId?.phone}</div>
                      </div>
                    </div>

                    <div style={{padding: '12px', background: '#eff6ff', borderRadius: '12px', marginBottom: '15px'}}>
                      <div style={{fontWeight: '700', fontSize: '15px', color: '#1e3a8a'}}>{res.serviceId?.name}</div>
                      <div style={{display: 'flex', gap: '12px', fontSize: '12px', color: '#1e40af', marginTop: '4px'}}>
                        <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Clock size={14} /> {res.serviceId?.duration} min</span>
                        <span style={{fontWeight:'700'}}>{res.serviceId?.price} TND</span>
                      </div>
                    </div>

                    <div style={{display: 'flex', gap: '8px', marginBottom: '15px'}}>
                      <div style={{background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600'}}><Calendar size={14} /> {new Date(res.date).toLocaleDateString()}</div>
                      <div style={{background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600'}}><Clock size={14} /> {res.timeSlot}</div>
                    </div>

                    {res.notes && (
                      <div style={{fontSize: '13px', color: '#64748b', background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '15px'}}>
                        <AlertCircle size={14} style={{float: 'left', marginRight: '6px'}} /> {res.notes}
                      </div>
                    )}
                  </div>

                  <div style={{padding: '20px', background: '#f8fafc', display: 'flex', gap: '8px'}}>
                    {res.status === "pending" && (
                      <>
                        <button onClick={() => handleCreateQuote(res)} style={{flex: 1.5, padding: '10px', borderRadius: '10px', border: 'none', background: '#24416b', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}><FileSpreadsheet size={16} /> Devis</button>
                        <button onClick={() => handleUpdateReservation(res._id, "cancelled")} style={{flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '600', cursor: 'pointer'}}>Décliner</button>
                      </>
                    )}
                    {res.status === "confirmed" && (
                      <button onClick={() => handleUpdateReservation(res._id, "completed")} style={{width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer'}}>Terminer</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.content}>
           <CompanyCalendar 
                reservations={reservations.filter(r => ["confirmed", "completed", "blocked"].includes(r.status))} 
                onUpdateStatus={handleUpdateReservation}
           />
        </div>
      )}
    </div>
  );
};

export default ProfessionalCommandes;
