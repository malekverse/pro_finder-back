import React from 'react';
import { Users, Tags, Globe, Wrench, TrendingUp, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useGetAdminDashboardQuery } from '../../../redux/features/profileApiSlice';
import styles from "../../../styles/dashboardAdmin.module.css"; 

const AdminHome = () => {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading } = useGetAdminDashboardQuery();

  // Stats du dashboard (réelles si chargées, sinon fallback)
  const stats = dashboardData?.stats || { 
    users: 0, 
    villes: 0, 
    categories: 0, 
    services: 0,
    pendingCompanies: 0
  };

  // Données réelles pour la courbe (envoyées par le backend)
  const chartData = dashboardData?.growthData || [
    { name: 'Jan', users: 0, companies: 0 },
    { name: 'Fév', users: 0, companies: 0 },
    { name: 'Mar', users: 0, companies: 0 },
    { name: 'Avr', users: 0, companies: 0 },
    { name: 'Mai', users: 0, companies: 0 },
    { name: 'Juin', users: 0, companies: 0 },
  ];

  const cards = [
    { title: "Utilisateurs", value: stats.users, icon: <Users size={22}/>, color: "#6366f1", bg: "#eef2ff", trend: "+8%", path: "/admin/users" },
    { title: "Villes", value: stats.villes, icon: <Globe size={22}/>, color: "#a855f7", bg: "#faf5ff", trend: "Stable", path: "/admin/geography" },
    { title: "Catégories", value: stats.categories, icon: <Tags size={22}/>, color: "#22c55e", bg: "#f0fdf4", trend: "+2", path: "/admin/taxonomy" },
    { title: "Services", value: stats.services, icon: <Wrench size={22}/>, color: "#f59e0b", bg: "#fffbeb", trend: "+15%", path: "/admin/services" },
  ];

  // Helper pour formater le temps écoulé (ex: "10 min", "2h")
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}j`;
  };

  const pendingActions = dashboardData?.recentPending || [];

  if (isLoading) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader2 className="animate-spin" size={40} color="#24416b" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className={styles.title} style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Tableau de bord</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Bienvenue, voici l'état de votre plateforme aujourd'hui.</p>
        </div>
        <div className={styles.statusActive} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
          <CheckCircle2 size={16} /> Système Opérationnel
        </div>
      </div>
      
      <div className={styles.gridWrapper}>
        {cards.map((card, index) => (
          <div 
            key={index} 
            className={styles.cardStat} 
            onClick={() => navigate(card.path)}
          >
            <div className={styles.statIcon} style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className={styles.statInfo}>
              <p>{card.title}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <strong>{card.value}</strong>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>{card.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', marginBottom: '30px' }}>
        {/* Graphique de croissance */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>Croissance de la plateforme</h3>
            <div style={{ display: 'flex', gap: '15px' }}>
               <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1', fontWeight: '600' }}>
                 <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1' }}></div> Utilisateurs
               </span>
               <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontWeight: '600' }}>
                 <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#a855f7' }}></div> Entreprises
               </span>
            </div>
          </div>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="companies" stroke="#a855f7" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actions en attente */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Modération urgente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pendingActions.length > 0 ? (
              pendingActions.map(action => (
                <div key={action._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ padding: '10px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <Clock size={18} color="#f59e0b" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: '#1e293b' }}>{action.companyName}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Attente : {formatTimeAgo(action.createdAt)}</p>
                  </div>
                  <button 
                    onClick={() => navigate('/admin/moderation')}
                    style={{ padding: '8px 14px', fontSize: '0.75rem', fontWeight: '700', color: '#24416b', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}
                  >
                    Voir
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <CheckCircle2 size={40} color="#10b981" style={{ opacity: 0.2, marginBottom: '10px' }} />
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Aucune entreprise en attente.</p>
              </div>
            )}
            <button 
              className={styles.button} 
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() => navigate('/admin/moderation')}
            >
              Accéder à la modération
            </button>
          </div>
        </div>
      </div>

      {/* Raccourcis rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div 
          onClick={() => navigate('/admin/users')}
          style={{ padding: '25px', background: '#24416b', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 15px rgba(36, 65, 107, 0.2)' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px' }}>
            <Users size={28} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Gérer Utilisateurs</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Voir et éditer les comptes</p>
          </div>
        </div>
        <div 
          onClick={() => navigate('/admin/taxonomy')}
          style={{ padding: '25px', background: '#6366f1', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px' }}>
            <Tags size={28} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Taxonomie</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Catégories et Services</p>
          </div>
        </div>
        <div 
          onClick={() => navigate('/admin/geography')}
          style={{ padding: '25px', background: '#10b981', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px' }}>
            <Globe size={28} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Géographie</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Villes et Régions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;