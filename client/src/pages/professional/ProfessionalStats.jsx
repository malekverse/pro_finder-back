import React from 'react';
import { useGetProfessionalProfileQuery } from '../../redux/features/professional/professionalApiSlice';
import { User, Star, Users, Loader } from 'lucide-react';

const ProfessionalStats = () => {
  const { data: profile, isLoading } = useGetProfessionalProfileQuery();

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <Loader size={32} color="#1E3A5F" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
        Bienvenue, {profile?.fullName || 'Professionnel'} 👋
      </h1>
      <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '30px' }}>
        Voici un aperçu de votre activité sur la plateforme.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        <StatCard
          icon={<User size={22} />}
          title="Profil"
          value={profile?.fullName || 'N/A'}
          color="#6366f1"
          bg="#eef2ff"
        />
        <StatCard
          icon={<Star size={22} />}
          title="Statut"
          value="Actif"
          color="#10b981"
          bg="#f0fdf4"
        />
        <StatCard
          icon={<Users size={22} />}
          title="Email"
          value={profile?.email || 'N/A'}
          color="#3b82f6"
          bg="#eff6ff"
        />
      </div>

      <div style={{ marginTop: '40px', padding: '30px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
          Description
        </h3>
        <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7' }}>
          {profile?.description || "Vous n'avez pas encore ajouté de description. Accédez à votre profil pour en ajouter une."}
        </p>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color, bg }) => (
  <div style={{
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: bg,
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{title}</p>
      <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: '700', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
        {value}
      </p>
    </div>
  </div>
);

export default ProfessionalStats;
