import React from "react";
import { useSelector } from "react-redux";
import { useGetCompanyReviewsQuery, useGetAverageRatingQuery } from "../../redux/features/reviewApiSlice";
import { Star, MessageSquare, Loader2, User } from "lucide-react";
import styles from "../../styles/Dashboard.module.css";

const Reviews = () => {
  const authUser = useSelector((state) => state.auth.user);
  const companyId = authUser?.companyId;

  const { data: reviews = [], isLoading: loadingReviews } = useGetCompanyReviewsQuery(companyId, { skip: !companyId, pollingInterval: 3000 });
  const { data: ratingStats } = useGetAverageRatingQuery(companyId, { skip: !companyId, pollingInterval: 3000 });

  if (loadingReviews) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <Loader2 className="animate-spin" size={40} color="#24416b" />
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", backgroundColor: "#f8fafc", minHeight: "100%" }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
          Avis et Recommandations
        </h1>
        <p style={{ color: "#64748b", marginTop: "8px" }}>
          Consultez ce que vos clients disent de vous
        </p>
      </div>

      {/* Résumé des notes */}
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '20px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
        marginBottom: '30px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '48px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
            {ratingStats?.averageRating || "0.0"}
          </p>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                fill={star <= Math.round(ratingStats?.averageRating || 0) ? "#fbbf24" : "none"}
                color={star <= Math.round(ratingStats?.averageRating || 0) ? "#fbbf24" : "#cbd5e1"}
              />
            ))}
          </div>
          <p style={{ color: '#64748b', marginTop: '10px', fontSize: '14px' }}>
            Basé sur {ratingStats?.totalReviews || 0} avis
          </p>
        </div>

        <div style={{ flex: 1, borderLeft: '1px solid #e2e8f0', paddingLeft: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '12px' }}>
              <MessageSquare size={24} color="#3b82f6" />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Total des commentaires</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{reviews.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {reviews.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            background: 'white', 
            borderRadius: '20px',
            border: '2px dashed #e2e8f0'
          }}>
            <MessageSquare size={48} color="#cbd5e1" style={{ marginBottom: '15px' }} />
            <p style={{ color: '#64748b', fontSize: '16px' }}>Vous n'avez pas encore reçu d'avis.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: '20px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {review.user_id?.avatarUrl ? (
                      <img 
                        src={review.user_id.avatarUrl.startsWith('http') ? review.user_id.avatarUrl : `http://localhost:5000/${review.user_id.avatarUrl}`}
                        alt="" 
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <User size={24} color="#94a3b8" />
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: '#1e293b', margin: 0 }}>{review.user_id?.fullName || "Utilisateur anonyme"}</p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                      {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={star <= review.rating ? "#fbbf24" : "none"}
                      color={star <= review.rating ? "#fbbf24" : "#cbd5e1"}
                    />
                  ))}
                </div>
              </div>
              <p style={{ marginTop: '16px', color: '#475569', lineHeight: '1.6', fontSize: '15px' }}>
                {review.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
