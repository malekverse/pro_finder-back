import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPublicProfessionalProfileQuery } from '../../redux/features/professional/professionalApiSlice';
import { toImageUrl } from '../../utils/imageUtils';
import {
  User, MapPin, Phone, Globe, Mail, Users, Star, Loader, ArrowLeft,
  UserPlus, UserMinus
} from 'lucide-react';
import { 
  useFollowProfessionalMutation, 
  useUnfollowProfessionalMutation,
  useCheckFollowProStatusQuery 
} from '../../redux/features/professional/professionalApiSlice';
import { useSelector } from 'react-redux';
import { ROLES } from '../../constants/roles';

const ProfessionalPublicProfile = () => {
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const { data: pro, isLoading, error, refetch } = useGetPublicProfessionalProfileQuery(professionalId);
  const { data: followStatus, isLoading: isStatusLoading } = useCheckFollowProStatusQuery(professionalId);
  const [followPro, { isLoading: isFollowing }] = useFollowProfessionalMutation();
  const [unfollowPro, { isLoading: isUnfollowing }] = useUnfollowProfessionalMutation();
  const authUser = useSelector((state) => state.auth.user);

  const handleFollowToggle = async () => {
    if (!authUser) {
      navigate('/auth/login');
      return;
    }
    try {
      if (followStatus?.isFollowing) {
        await unfollowPro(professionalId).unwrap();
      } else {
        await followPro(professionalId).unwrap();
      }
      refetch();
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const showFollowBtn = authUser && authUser.id !== professionalId && authUser.companyId !== professionalId;

  if (isLoading) return (
    <div style={s.loadingContainer}>
      <Loader size={32} color="#1E3A5F" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#64748b', marginTop: '16px' }}>Chargement du profil...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !pro) return (
    <div style={s.errorContainer}>
      <User size={48} color="#000000ff" />
      <h2 style={{ color: '#1e293b', marginTop: '16px' }}>Professionnel non trouvé</h2>
      <button onClick={() => navigate('/')} style={s.backBtn}>
        <ArrowLeft size={16} /> Retour à l'accueil
      </button>
    </div>
  );

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <button onClick={() => navigate(-1)} style={s.backLink}>
          <ArrowLeft size={18} /> Retour
        </button>
      </div>

      {/* Cover */}
      <div style={s.cover}>
        <div style={s.coverGradient} />
      </div>

      {/* Profile Card */}
      <div style={s.profileCard}>
        <div style={s.avatarWrapper}>
          {pro.photoProfessional ? (
            <img src={toImageUrl(pro.photoProfessional)} alt={pro.fullName} style={s.avatar} />
          ) : (
            <div style={s.avatarFallback}>
              <User size={48} color="#000000ff" />
            </div>
          )}
        </div>

        <div style={s.infoSection}>
          <h1 style={s.name}>{pro.fullName}</h1>

          <div style={s.metaRow}>
            {pro.city && (
              <span style={s.metaItem}>
                <MapPin size={14} color="#64748b" /> {pro.city}{pro.region ? `, ${pro.region}` : ''}{pro.country ? `, ${pro.country}` : ''}
              </span>
            )}
            <span style={s.metaItem}>
              <Users size={14} color="#64748b" /> {pro.followersCount || 0} abonnés
            </span>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div style={s.topActions}>
          {showFollowBtn && (
            <button 
              onClick={handleFollowToggle} 
              disabled={isFollowing || isUnfollowing || isStatusLoading}
              style={{
                ...s.followBtn,
                background: followStatus?.isFollowing ? '#f1f5f9' : '#fff',
                color: followStatus?.isFollowing ? '#475569' : '#1E3A5F',
              }}
            >
              {isFollowing || isUnfollowing ? (
                <Loader size={16} className="animate-spin" />
              ) : followStatus?.isFollowing ? (
                <><UserMinus size={16} /> Ne plus suivre</>
              ) : (
                <><UserPlus size={16} /> Suivre</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={s.content}>
        {/* About */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>À propos</h3>
          <p style={s.description}>
            {pro.description || "Ce professionnel n'a pas encore ajouté de description."}
          </p>
        </div>

        {/* Contact */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Coordonnées</h3>
          <div style={s.contactGrid}>
            {pro.email && (
              <div style={s.contactItem}>
                <div style={s.contactIcon}><Mail size={18} color="#3b82f6" /></div>
                <div>
                  <p style={s.contactLabel}>Email</p>
                  <p style={s.contactValue}>{pro.email}</p>
                </div>
              </div>
            )}
            {pro.phone && (
              <div style={s.contactItem}>
                <div style={s.contactIcon}><Phone size={18} color="#10b981" /></div>
                <div>
                  <p style={s.contactLabel}>Téléphone</p>
                  <p style={s.contactValue}>{pro.phone}</p>
                </div>
              </div>
            )}
            {pro.website && (
              <div style={s.contactItem}>
                <div style={s.contactIcon}><Globe size={18} color="#8b5cf6" /></div>
                <div>
                  <p style={s.contactLabel}>Site Web</p>
                  <a href={pro.website} target="_blank" rel="noopener noreferrer" style={s.contactLink}>{pro.website}</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const s = {
  root: { minHeight: '100vh', background: '#f8fafc' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  errorContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  header: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 30px' },
  backLink: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#1E3A5F', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '16px' },
  cover: { height: 220, background: 'linear-gradient(135deg, #1E3A5F 0%, #3b82f6 50%, #8b5cf6 100%)', position: 'relative', marginTop: 60 },
  coverGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(transparent, rgba(0,0,0,0.1))' },
  profileCard: { maxWidth: 900, margin: '-60px auto 0', padding: '0 20px', position: 'relative', zIndex: 10, display: 'flex', alignItems: 'flex-end', gap: '24px' },
  avatarWrapper: { flexShrink: 0 },
  avatar: { width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
  avatarFallback: { width: 140, height: 140, borderRadius: '50%', background: '#f1f5f9', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
  infoSection: { paddingBottom: '10px' },
  name: { fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px' },
  metaRow: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#64748b' },
  content: { maxWidth: 900, margin: '30px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '60px' },
  card: { background: '#fff', borderRadius: '16px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' },
  description: { fontSize: '15px', color: '#475569', lineHeight: '1.8', margin: 0, whiteSpace: 'pre-line' },
  contactGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  contactItem: { display: 'flex', gap: '14px', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' },
  contactIcon: { width: '44px', height: '44px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', flexShrink: 0 },
  contactLabel: { fontSize: '12px', fontWeight: '700', color: '#535b65ff', textTransform: 'uppercase', margin: '0 0 2px' },
  contactValue: { fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 },
  contactLink: { fontSize: '15px', fontWeight: '600', color: '#3b82f6', textDecoration: 'none', margin: 0 },
  topActions: { marginLeft: 'auto', display: 'flex', gap: '12px' },
  followBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 24px', borderRadius: '12px',
    fontSize: '14px', fontWeight: '800', border: '1px solid #e2e8f0',
    cursor: 'pointer', transition: 'all 0.2s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
  }
};

export default ProfessionalPublicProfile;
