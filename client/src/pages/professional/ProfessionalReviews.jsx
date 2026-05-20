import React from "react";
import { useSelector } from "react-redux";
import { useGetProfessionalReviewsQuery, useGetProfessionalAverageRatingQuery } from "../../redux/features/reviews/reviewApiSlice";
import { Star, MessageSquare, Loader2, User } from "lucide-react";
import styles from "../../styles/Dashboard.module.css";
import { toImageUrl } from "../../utils/imageUtils";

const ProfessionalReviews = () => {
  const authUser = useSelector((state) => state.auth.user);
  const professionalId = authUser?.id;

  const { data: reviews = [], isLoading: loadingReviews } = useGetProfessionalReviewsQuery(professionalId, { skip: !professionalId, pollingInterval: 5000 });
  const { data: ratingStats } = useGetProfessionalAverageRatingQuery(professionalId, { skip: !professionalId, pollingInterval: 5000 });

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
          Mes Avis & Retours clients
        </h1>
        <p style={{ color: "#64748b", marginTop: "8px" }}>
          Découvrez ce que vos clients pensent de vos services.
        </p>
      </div>

      {/* Résumé des notes */}
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '24px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
        marginBottom: '30px',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '56px', fontWeight: '900', color: '#1e293b', margin: 0, lineHeight: '1' }}>
            {ratingStats?.averageRating || "0.0"}
          </p>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '12px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={22}
                fill={star <= Math.round(ratingStats?.averageRating || 0) ? "#fbbf24" : "none"}
                color={star <= Math.round(ratingStats?.averageRating || 0) ? "#fbbf24" : "#cbd5e1"}
              />
            ))}
          </div>
          <p style={{ color: '#64748b', marginTop: '12px', fontSize: '14px', fontWeight: '600' }}>
            {ratingStats?.totalReviews || 0} avis au total
          </p>
        </div>

        <div style={{ flex: 1, borderLeft: '1px solid #f1f5f9', paddingLeft: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '16px' }}>
              <MessageSquare size={26} color="#3b82f6" />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: '600' }}>Commentaires reçus</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{reviews.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {reviews.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 0', 
            background: 'white', 
            borderRadius: '24px',
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ background: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <MessageSquare size={40} color="#cbd5e1" />
            </div>
            <p style={{ color: '#1e293b', fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>Aucun avis pour le moment</p>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Vos futurs avis apparaîtront ici dès que vos clients vous noteront.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: '24px', 
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '52px', 
                    height: '52px', 
                    borderRadius: '50%', 
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    {review.user_id?.avatarUrl ? (
                      <img 
                        src={toImageUrl(review.user_id.avatarUrl)}
                        alt="" 
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <User size={26} color="#94a3b8" />
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: '800', color: '#1e293b', margin: 0, fontSize: '16px' }}>{review.user_id?.fullName || "Utilisateur anonyme"}</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0', fontWeight: '500' }}>
                      {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2px', background: '#f8fafc', padding: '6px 10px', borderRadius: '12px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      fill={star <= review.rating ? "#fbbf24" : "none"}
                      color={star <= review.rating ? "#fbbf24" : "#cbd5e1"}
                    />
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '20px', position: 'relative' }}>
                <div style={{ width: '20px', height: '2px', background: '#3b82f6', position: 'absolute', top: '-10px', left: '0' }}></div>
                <p style={{ color: '#475569', lineHeight: '1.7', fontSize: '15px', fontWeight: '500' }}>
                  {review.comment}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfessionalReviews;
