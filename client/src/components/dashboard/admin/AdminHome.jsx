import React from 'react';
import { Users, Tags, Globe, Wrench } from "lucide-react";
import styles from "../../../styles/dashboardAdmin.module.css"; 

const AdminHome = () => {
  // On initialise à 0 pour avoir un dashboard propre sans erreurs API
  const stats = { users: 0, categories: 0, villes: 0, services: 0 };

  const cards = [
    { title: "Utilisateurs", value: stats.users, icon: <Users size={22}/>, color: "#6366f1", bg: "#eef2ff" },
    { title: "Villes", value: stats.villes, icon: <Globe size={22}/>, color: "#a855f7", bg: "#faf5ff" },
    { title: "Catégories", value: stats.categories, icon: <Tags size={22}/>, color: "#22c55e", bg: "#f0fdf4" },
    { title: "Services", value: stats.services, icon: <Wrench size={22}/>, color: "#f59e0b", bg: "#fffbeb" },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Vue d'ensemble en temps réel</h1>
      
      <div className={styles.gridWrapper} style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px',
        marginTop: '20px' 
      }}>
        {cards.map((card, index) => (
          <div key={index} className={styles.cardStat}>
            <div className={styles.statIcon} style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className={styles.statInfo}>
              <p className={styles.cardLabel}>{card.title}</p>
              <strong className={styles.cardValue}>
                {card.value}
              </strong>
            </div>
          </div>
        ))}
      </div>

      {/* Zone vide pour tes futurs graphiques ou tableaux */}
      <div style={{ 
        marginTop: '30px', 
        padding: '40px', 
        border: '2px dashed #e2e8f0', 
        borderRadius: '12px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        Le contenu détaillé du dashboard apparaîtra ici une fois les routes API prêtes.
      </div>
    </div>
  );
};

export default AdminHome;