import React from "react";
import { useGetFollowersStatsQuery } from "../../redux/features/company/companyApiSlice";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, 
  LineChart, Line, CartesianGrid, AreaChart, Area 
} from "recharts";
import { Users, UserPlus, TrendingUp, UsersRound, Loader2, MessageSquare, ThumbsUp, Calendar } from "lucide-react";
import styles from "../../styles/Dashboard.module.css";

const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

const Statistiques = () => {
  const { data: stats, isLoading } = useGetFollowersStatsQuery();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <Loader2 className="animate-spin" size={40} color="#24416b" />
      </div>
    );
  }

  // Préparation des données du graphique
  const monthlyStats = Array(12).fill(0);
  const monthlyPostStats = Array(12).fill(0);
  const monthlyEngagement = Array(12).fill(0);

  if (stats?.monthlyStats) {
    stats.monthlyStats.forEach(({ _id, count }) => {
      if (_id >= 1 && _id <= 12) {
        monthlyStats[_id - 1] = count;
      }
    });
  }

  if (stats?.monthlyPostStats) {
    stats.monthlyPostStats.forEach(({ _id, count }) => {
      if (_id >= 1 && _id <= 12) {
        monthlyPostStats[_id - 1] = count;
      }
    });
  }

  if (stats?.monthlyEngagementStats) {
    stats.monthlyEngagementStats.forEach(({ _id, likes, comments }) => {
      if (_id >= 1 && _id <= 12) {
        monthlyEngagement[_id - 1] = likes + comments;
      }
    });
  }

  const chartData = monthlyStats.map((count, index) => ({
    month: monthNames[index],
    followers: count,
    posts: monthlyPostStats[index],
    engagement: monthlyEngagement[index]
  }));

  const kpis = [
    { 
      label: "Total Followers", 
      value: stats?.totalFollowers || 0, 
      icon: <Users size={24} />, 
      color: "#24416b", 
      bg: "#eff6ff",
      trend: "+12%" 
    },
    { 
      label: "Total Publications", 
      value: stats?.totalPosts || 0, 
      icon: <Calendar size={24} />, 
      color: "#8b5cf6", 
      bg: "#f5f3ff",
      trend: "+5" 
    },
    { 
      label: "Engagement Total", 
      value: (stats?.totalLikes || 0) + (stats?.totalComments || 0), 
      icon: <MessageSquare size={24} />, 
      color: "#ec4899", 
      bg: "#fdf2f8",
      trend: "+24%" 
    },
    { 
      label: "Nouveaux (Mois)", 
      value: `+${stats?.newFollowersThisMonth || 0}`, 
      icon: <UserPlus size={24} />, 
      color: "#10b981", 
      bg: "#ecfdf5",
      trend: "En hausse" 
    },
  ];

  return (
    <div style={{ padding: "40px", backgroundColor: "#f8fafc", minHeight: "100%" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
            Dashboard Analytique
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px", marginTop: "5px" }}>
            Suivez la performance et l'engagement de votre entreprise en temps réel.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', background: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
           <button style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#24416b', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Mensuel</button>
           <button style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Annuel</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
        gap: "25px", 
        marginBottom: "40px" 
      }}>
        {kpis.map((kpi, index) => (
          <div key={index} style={{ 
            background: "#fff", 
            padding: "25px", 
            borderRadius: "20px", 
            display: "flex", 
            flexDirection: 'column',
            gap: "15px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
            border: "1px solid #e2e8f0",
            transition: 'transform 0.3s ease',
            cursor: 'default'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ 
                background: kpi.bg, 
                color: kpi.color, 
                padding: "12px", 
                borderRadius: "14px" 
              }}>
                {kpi.icon}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px' }}>
                {kpi.trend}
              </span>
            </div>
            <div>
              <p style={{ margin: 0, color: "#64748b", fontSize: "13px", fontWeight: "700", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</p>
              <p style={{ fontSize: "28px", fontWeight: "800", margin: "5px 0 0", color: "#1e293b" }}>
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "30px" }}>
        {/* Graphique de Croissance des Followers */}
        <div style={{ 
          background: "#fff", 
          padding: "30px", 
          borderRadius: "24px", 
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0"
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
              Évolution de l'Audience
            </h3>
            <div style={{ display: 'flex', gap: '15px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#24416b' }}></div>
                 <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Followers</span>
               </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#24416b" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#24416b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '15px' }}
              />
              <Area 
                type="monotone" 
                dataKey="followers" 
                stroke="#24416b" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorFollow)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique d'Engagement (Likes + Comments) */}
        <div style={{ 
          background: "#fff", 
          padding: "30px", 
          borderRadius: "24px", 
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0"
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
              Engagement du Contenu
            </h3>
            <div style={{ display: 'flex', gap: '15px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }}></div>
                 <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Interactions</span>
               </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '15px' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="engagement" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;