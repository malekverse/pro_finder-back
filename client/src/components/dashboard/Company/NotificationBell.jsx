import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2, Clock, User, MessageCircle, Star, UserPlus, ShoppingBag } from "lucide-react";
import { 
  useGetNotificationsQuery, 
  useMarkAsReadMutation, 
  useMarkAllAsReadMutation 
} from "../../../redux/features/notificationApiSlice";

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return "À l'instant";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours} h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Il y a ${diffInDays} j`;
  
  return date.toLocaleDateString("fr-FR");
};

const NotificationBell = ({ type }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { data: notifications = [], isLoading } = useGetNotificationsQuery(type, {
    pollingInterval: 10000 // Poll every 10 seconds
  });
  
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "follow": return <UserPlus size={16} color="#3b82f6" />;
      case "review": return <Star size={16} color="#f59e0b" />;
      case "comment": return <MessageCircle size={16} color="#10b981" />;
      case "order": return <ShoppingBag size={16} color="#10b981" />;
      case "reservation": return <Clock size={16} color="#8b5cf6" />;
      default: return <Bell size={16} color="#64748b" />;
    }
  };

  const getNotificationRoute = (notif) => {
    const role = type?.toLowerCase() || "user";
    
    switch (notif.type) {
      case "order":
      case "reservation":
        if (role === "company") return "/company/commandes";
        if (role === "professional") return "/professional/commandes";
        return "/user/purchases";
      
      case "quote":
      case "contract":
        if (role === "company") return `/company/${notif.type}s`; // /company/quotes or /company/contracts
        if (role === "professional") return "/professional/documents";
        return "/user/documents";

      case "review":
        if (role === "company") return "/company/reviews";
        if (role === "professional") return "/professional/reviews";
        return "/user/profile";

      case "follow":
        if (role === "company") return "/company/profile";
        if (role === "professional") return "/professional/profile";
        return "/user/profile";

      case "comment":
        if (role === "company") return "/company/posts";
        if (role === "professional") return "/professional/posts";
        return "/";

      case "stock_alert":
        if (role === "company") return "/company/produits";
        if (role === "professional") return "/professional/produits";
        return "/";

      default:
        return role === "user" ? "/user/dashboard" : `/${role}/stats`;
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await markAsRead(notif._id).unwrap();
      }
      
      const route = getNotificationRoute(notif);
      setIsOpen(false);
      navigate(route);
    } catch (err) {
      console.error("Failed to handle notification click:", err);
      // Still navigate even if marking as read fails
      const route = getNotificationRoute(notif);
      setIsOpen(false);
      navigate(route);
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          transition: "all 0.2s"
        }}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            background: "#ef4444",
            color: "white",
            fontSize: "10px",
            fontWeight: "700",
            minWidth: "16px",
            height: "16px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid white"
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: "0",
          marginTop: "10px",
          width: "350px",
          maxHeight: "450px",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{
            padding: "15px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f8fafc"
          }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead(type)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#24416b",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Check size={14} /> Tout marquer comme lu
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {isLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Chargement...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                <Bell size={32} style={{ opacity: 0.2, marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "14px" }}>Aucune notification pour le moment.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: "15px 20px",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    backgroundColor: notif.is_read ? "transparent" : "#eff6ff",
                    transition: "background 0.2s",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = notif.is_read ? "#f8fafc" : "#dbeafe"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.is_read ? "transparent" : "#eff6ff"}
                >
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid #e2e8f0",
                    position: "relative"
                  }}>
                    {notif.sender_id?.avatar ? (
                      <img src={notif.sender_id.avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <User size={18} color="#94a3b8" />
                    )}
                    <div style={{
                      position: "absolute",
                      bottom: "-2px",
                      right: "-2px",
                      background: "white",
                      borderRadius: "50%",
                      padding: "2px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                      {getIcon(notif.type)}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      margin: "0 0 4px 0", 
                      fontSize: "13px", 
                      color: "#334155", 
                      lineHeight: "1.4",
                      fontWeight: notif.is_read ? "400" : "600"
                    }}>
                      {notif.message}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#94a3b8", fontSize: "11px" }}>
                      <Clock size={10} />
                      {formatRelativeTime(notif.createdAt)}
                    </div>
                  </div>

                  {!notif.is_read && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6", marginTop: "6px", flexShrink: 0 }} />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{ padding: "10px", textAlign: "center", borderTop: "1px solid #f1f5f9" }}>
              <button 
                style={{ background: "none", border: "none", color: "#64748b", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
              >
                Voir tout l'historique
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
