import React, { useState } from 'react';
import { useGetProfessionalProfileQuery, useGetFollowersStatsQuery } from '../../redux/features/professional/professionalApiSlice';
import { useGetNotificationsQuery } from "../../redux/features/notifications/notificationApiSlice";
import { 
  Users, UserPlus, TrendingUp, Calendar, Loader2, Bell, 
  Package, Wrench, FileText, Star, MessageSquare 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

const ProfessionalStats = () => {
  const [period, setPeriod] = useState("annual");
  const { data: profile } = useGetProfessionalProfileQuery();
  const { data: stats, isLoading: statsLoading } = useGetFollowersStatsQuery(period, { pollingInterval: 5000 });
  const { data: notificationsData } = useGetNotificationsQuery("Professional", { pollingInterval: 10000 });

  const notifications = Array.isArray(notificationsData) ? notificationsData : [];

  if (statsLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <Loader2 className="animate-spin" size={40} color="#24416b" />
    </div>
  );

  // Chart Data Preparation
  const isMonthly = period === "monthly";
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dataLength = isMonthly ? daysInMonth : 12;

  const aggregatedStats = Array(dataLength).fill(0);
  if (stats?.monthlyStats) {
    stats.monthlyStats.forEach(({ _id, count }) => {
      if (_id >= 1 && _id <= dataLength) aggregatedStats[_id - 1] = count;
    });
  }

  const chartData = aggregatedStats.map((count, index) => ({
    label: isMonthly ? `${index + 1}` : monthNames[index],
    followers: count,
  }));

  const kpis = [
    { label: "Abonnés", value: stats?.totalFollowers || 0, icon: <Users size={22} />, color: "#3b82f6", bg: "#eff6ff", trend: "+12%" },
    { label: "Publications", value: stats?.totalPosts || 0, icon: <FileText size={22} />, color: "#8b5cf6", bg: "#f5f3ff", trend: "+2" },
    { label: "Note Moyenne", value: profile?.averageRating || "5.0", icon: <Star size={22} />, color: "#fbbf24", bg: "#fffbeb", trend: "0.0" },
    { label: "Engagement", value: (stats?.totalLikes || 0) + (stats?.totalComments || 0), icon: <TrendingUp size={22} />, color: "#10b981", bg: "#f0fdf4", trend: "+5%" },
  ];

  const btnStyle = (active) => ({
    padding: '8px 16px', borderRadius: '8px', border: 'none', 
    background: active ? '#24416b' : 'transparent', color: active ? 'white' : '#64748b', 
    fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: '0.2s'
  });

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
            Bienvenue, {profile?.fullName || 'Professionnel'} 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '5px' }}>
            Voici les performances de votre activité en un coup d'œil.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '6px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
           <button style={btnStyle(period === "monthly")} onClick={() => setPeriod("monthly")}>Mensuel</button>
           <button style={btnStyle(period === "annual")} onClick={() => setPeriod("annual")}>Annuel</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {kpis.map((kpi, index) => (
          <div key={index} style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ background: kpi.bg, color: kpi.color, padding: '10px', borderRadius: '12px' }}>{kpi.icon}</div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', background: '#ecfdf5', padding: '4px 8px', borderRadius: '12px' }}>{kpi.trend}</span>
             </div>
             <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{kpi.label}</p>
             <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{kpi.value.toString()}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '25px' }}>Croissance des abonnés</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#24416b" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#24416b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="followers" stroke="#24416b" strokeWidth={3} fill="url(#colorPro)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Flash Actu</h3>
            <Bell size={20} color="#94a3b8" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.length > 0 ? notifications.slice(0, 5).map((n, i) => (
              <div key={n._id} style={{ display: 'flex', gap: '15px', padding: '16px 0', borderBottom: i === 4 ? 'none' : '1px solid #f1f5f9' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={18} color="#24416b" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{n.message}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Aucune notification pour le moment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalStats;
