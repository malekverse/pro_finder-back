import React from "react";
import { useGetFollowerCountQuery, useGetFollowersStatsQuery } from "../../redux/features/company/companyApiSlice";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

const Statistiques = () => {
  const { data: countData, isLoading: countLoading } = useGetFollowerCountQuery();
  const { data: statsData, isLoading: statsLoading } = useGetFollowersStatsQuery();

  // Construire un tableau de 12 mois initialisé à 0
  const monthlyStats = Array(12).fill(0);

  if (statsData) {
    statsData.forEach(({ _id, count }) => {
      if (_id >= 1 && _id <= 12) {
        monthlyStats[_id - 1] = count;
      }
    });
  }

  // Préparer données pour recharts
  const chartData = monthlyStats.map((count, index) => ({
    month: monthNames[index],
    followers: count,
  }));

  return (
    <div style={{ padding: "20px" }}>
      <h1>Statistiques</h1>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          width: "150px",
          marginBottom: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 0 8px rgba(0,0,0,0.1)"
        }}
      >
        <div>
          <p style={{ margin: 0, color: "#555" }}>Followers</p>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>
            {countLoading ? "..." : countData?.followers || 0}
          </p>
        </div>
        <div style={{ color: "#3b82f6", fontSize: "28px" }}>👥</div>
      </div>

      {statsLoading ? (
        <p>Chargement du graphique...</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="followers" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default Statistiques;