import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  useGetPublicProfessionalProfileQuery,
  useFollowProfessionalMutation,
  useUnfollowProfessionalMutation,
  useCheckFollowProStatusQuery,
} from "../../redux/features/professional/professionalApiSlice";
import { useGetPostsByCompanyQuery } from "../../redux/features/posts/postApiSlice";
import PostCard from "../../components/Posts/PostCard";
import {
  ArrowLeft, Globe, Mail, Phone,
  MapPin, Newspaper, Loader, UserCheck, UserPlus, Flag, X, Send,
  Package, Wrench, Calendar, Info, Clock, CreditCard, Star, MessageSquare, AlertCircle, User, CheckCircle2, ShoppingCart
} from "lucide-react";
import { useCreateReportMutation } from "../../redux/features/reportApiSlice";
import { useGetCompanyProductsQuery } from "../../redux/features/products/productApiSlice";
import { useGetCompanyServicesQuery } from "../../redux/features/company/companyServiceApiSlice";
import { useCreateReservationMutation } from "../../redux/features/reservationApiSlice";
import { useCreateOrderMutation } from "../../redux/features/orderApiSlice";
import {
  useGetProfessionalReviewsQuery,
  useGetProfessionalAverageRatingQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useUpdateReviewMutation,
} from "../../redux/features/reviewApiSlice";
import { useInitializePaymentMutation } from "../../redux/features/paymentApiSlice";
import { useSelector } from "react-redux";
import { Edit, Trash2 } from "lucide-react";

import { toImageUrl } from "../../utils/imageUtils";

// Components Premium
import ProductDetail from "../../components/dashboard/client/ProductDetail";
import ServiceDetail from "../../components/dashboard/client/ServiceDetail";
import ActionModal from "../../components/dashboard/client/ActionModal";

const ProfessionalPublicProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { professionalId } = useParams();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("posts"); // posts, products, services, reviews

  const user = useSelector((state) => state.auth.user);

  const {
    data: followStatusData,
    refetch: refetchFollowStatus,
  } = useCheckFollowProStatusQuery(professionalId, {
    skip: !professionalId || !user,
    pollingInterval: 3000,
  });

  const isFollowed = followStatusData?.isFollowing ?? false;
  const isBlocked = followStatusData?.isBlocked ?? false;

  const [followPro, { isLoading: following }] = useFollowProfessionalMutation();
  const [unfollowPro, { isLoading: unfollowing }] = useUnfollowProfessionalMutation();

  const [createReport, { isLoading: reporting }] = useCreateReportMutation();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  // Reservation & Order Logic
  const [createReservation, { isLoading: reserving }] = useCreateReservationMutation();
  const [createOrder, { isLoading: ordering }] = useCreateOrderMutation();
  const [initPayment, { isLoading: isPaying }] = useInitializePaymentMutation();
  
  const [selectedService, setSelectedService] = useState(null);
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [reservationNotes, setReservationNotes] = useState("");
  const [resSuccess, setResSuccess] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.fullName || "",
    street: "",
    city: "",
    zipCode: "",
    phone: user?.phone || "",
  });
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Premium Detail Modals
  const [productForDetail, setProductForDetail] = useState(null);
  const [serviceForDetail, setServiceForDetail] = useState(null);
  const [selectedItemForAction, setSelectedItemForAction] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [prefilledActionData, setPrefilledActionData] = useState(null);

  // Review Logic
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [createReview, { isLoading: submittingReview }] = useCreateReviewMutation();
  const [updateReview, { isLoading: updatingReview }] = useUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  
  const { data: reviews = [], isLoading: loadingReviews } = useGetProfessionalReviewsQuery(professionalId, { skip: !professionalId, pollingInterval: 3000 });
  const { data: ratingStats } = useGetProfessionalAverageRatingQuery(professionalId, { skip: !professionalId, pollingInterval: 3000 });

  const { data: pro, isLoading: loadingProfile, refetch: refetchProfile } =
    useGetPublicProfessionalProfileQuery(professionalId, {
      skip: !professionalId,
      pollingInterval: 3000,
    });

  const {
    data: postsData,
    isLoading: loadingPosts,
    isFetching,
    refetch: refetchPosts,
  } = useGetPostsByCompanyQuery(
    { companyId: professionalId, page, limit: 10 },
    { skip: !professionalId, pollingInterval: 3000 }
  );

  const { data: products = [], isLoading: loadingProducts } = useGetCompanyProductsQuery(professionalId, { skip: !professionalId, pollingInterval: 3000 });
  const { data: proServices = [], isLoading: loadingServices } = useGetCompanyServicesQuery(professionalId, { skip: !professionalId, pollingInterval: 3000 });

  // ✅ Auto-select tab and item if redirected from dashboard
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.selectServiceId && proServices.length > 0) {
      const service = proServices.find(s => s._id === location.state.selectServiceId);
      if (service) {
        setSelectedService(service);
        window.history.replaceState({}, document.title);
      }
    }
  }, [proServices, location.state]);

  useEffect(() => {
    if (location.state?.selectProductId && products.length > 0) {
      const product = products.find(p => p._id === location.state.selectProductId);
      if (product) {
        setSelectedProduct(product);
        window.history.replaceState({}, document.title);
      }
    }
  }, [products, location.state]);

  useEffect(() => {
    setPage(1);
  }, [professionalId]);

  const handleFollowToggle = async () => {
    if (!user) {
      navigate("/auth/login", { state: { from: location.pathname } });
      return;
    }
    try {
      if (isFollowed) {
        await unfollowPro(professionalId).unwrap();
      } else {
        await followPro(professionalId).unwrap();
      }
      refetchFollowStatus();
      refetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth/login", { state: { from: location.pathname } });
      return;
    }
    if (!reportReason.trim()) return;
    try {
      await createReport({ professional_id: professionalId, reason: reportReason }).unwrap();
      setReportSuccess(true);
      setReportReason("");
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Report error", err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth/login", { state: { from: location.pathname } });
      return;
    }
    if (!reviewComment.trim()) return;
    try {
      if (editingReviewId) {
        await updateReview({
          id: editingReviewId,
          professional_id: professionalId,
          rating: reviewRating,
          comment: reviewComment,
        }).unwrap();
        setEditingReviewId(null);
        alert("Avis modifié avec succès !");
      } else {
        await createReview({
          professional_id: professionalId,
          rating: reviewRating,
          comment: reviewComment,
        }).unwrap();
        alert("Merci pour votre avis !");
      }
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      console.error("Review error", err);
      alert(err.data?.message || "Erreur lors de l'envoi de l'avis");
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review._id);
    setReviewRating(review.rating);
    setReviewComment(review.comment);
    const formElement = document.getElementById("review-form");
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteReview = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) {
      try {
        await deleteReview(id).unwrap();
        alert("Avis supprimé.");
      } catch (err) {
        console.error("Delete review error", err);
        alert("Erreur lors de la suppression de l'avis");
      }
    }
  };

  const handleBookService = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth/login", { state: { from: location.pathname } });
      return;
    }
    try {
      await createReservation({
        serviceId: selectedService._id,
        professionalId,
        date: reservationDate,
        timeSlot: reservationTime,
        notes: reservationNotes,
      }).unwrap();
      setResSuccess(true);
      setTimeout(() => {
        setSelectedService(null);
        setResSuccess(false);
        setReservationDate("");
        setReservationTime("");
        setReservationNotes("");
      }, 2000);
    } catch (err) {
      console.error("Reservation error", err);
      alert("Erreur lors de la réservation");
    }
  };

  const handlePlaceOrder = async (e) => {
    // Remplacé par handleSubmitAction via ActionModal
  };

  const handleSubmitAction = async (data) => {
    if (!user) {
      navigate("/auth/login", { state: { from: location.pathname } });
      return;
    }
    try {
      if (actionType === 'product') {
        const orderResult = await createOrder({
          professionalId,
          items: [{
            productId: selectedItemForAction._id,
            quantity: data.quantity,
            price: selectedItemForAction.price
          }],
          totalPrice: selectedItemForAction.price * data.quantity,
          shippingAddress: {
            fullName: user?.fullName,
            phone: user?.phone,
            ...data.address
          },
          notes: data.note
        }).unwrap();

        // DÉCLENCHER LE PAIEMENT (CHECKOUT)
        const paymentData = await initPayment({
          orderId: orderResult.order._id,
          successUrl: `${window.location.origin}/payment/success`,
          failUrl: `${window.location.origin}/payment/fail`
        }).unwrap();

        if (paymentData.result_url) {
          window.location.href = paymentData.result_url;
        } else {
          setOrderSuccess(true);
        }
      } else {
        // Formater la date en YYYY-MM-DD pour éviter les décalages de fuseau horaire
        let formattedDate = data.date;
        if (data.date instanceof Date) {
          const y = data.date.getFullYear();
          const m = String(data.date.getMonth() + 1).padStart(2, '0');
          const d = String(data.date.getDate()).padStart(2, '0');
          formattedDate = `${y}-${m}-${d}`;
        }

        await createReservation({
          professionalId: professional._id,
          serviceId: selectedItemForAction._id,
          date: formattedDate,
          timeSlot: data.time || data.bookingSlot,
          notes: data.note,
        }).unwrap();
        setResSuccess(true);
      }
      setSelectedItemForAction(null);
      setTimeout(() => {
        setOrderSuccess(false);
        setResSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Action error", err);
      alert(err.data?.message || "Une erreur est survenue");
    }
  };

  const handleAction = (item, type, prefilledData = null) => {
    setSelectedItemForAction(item);
    setActionType(type);
    setPrefilledActionData(prefilledData);
    setProductForDetail(null);
    setServiceForDetail(null);
  };

  const posts = postsData?.posts ?? [];
  const totalPages = postsData?.totalPages ?? 0;

  const fullAddress = useMemo(
    () => [pro?.cityName, pro?.regionName, pro?.countryName].filter(Boolean).join(", "),
    [pro]
  );

  if (loadingProfile) {
    return (
      <div style={s.page}>
        <div style={s.loadingCard}>
          <Loader size={24} style={{ animation: "spin 1s linear infinite" }} />
          <span>Chargement du profil...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!pro) {
    return (
      <div style={s.page}>
        <div style={s.card}>Profil professionnel introuvable.</div>
      </div>
    );
  }

  const photo = toImageUrl(pro.photoProfessional);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button type="button" onClick={() => navigate(-1)} style={s.backBtn}>
          <ArrowLeft size={16} /> Retour
        </button>

        <div style={s.card}>
          <div style={s.cover}>
             <div style={s.coverGradient} />
          </div>

          <div style={s.header}>
            {photo ? (
              <img src={photo} alt={pro.fullName} style={s.logo} />
            ) : (
              <div style={s.logoFallback}>
                <User size={36} />
              </div>
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={s.name}>{pro.fullName || "Professionnel"}</h1>
                {ratingStats?.averageRating > 0 && (
                  <div style={s.ratingBadge}>
                    <Star size={14} fill="#fbbf24" color="#fbbf24" />
                    <span>{ratingStats.averageRating}</span>
                    <span style={s.ratingCount}>({ratingStats.totalReviews})</span>
                  </div>
                )}
              </div>
              {!isBlocked && (pro.city || pro.region) ? (
                <p style={s.meta}>
                  <MapPin size={14} /> {pro.city}{pro.region ? `, ${pro.region}` : ''}{pro.country ? `, ${pro.country}` : ''}
                </p>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={handleFollowToggle}
                disabled={following || unfollowing}
                style={isFollowed ? s.btnFollowing : s.btnFollow}
              >
                {following || unfollowing ? (
                  <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : isFollowed ? (
                  <><UserCheck size={15} /> Déjà suivi</>
                ) : (
                  <><UserPlus size={15} /> Suivre</>
                )}
              </button>
              
              <button 
                onClick={() => {
                  if (!user) {
                    navigate("/auth/login", { state: { from: location.pathname } });
                    return;
                  }
                  setIsReportModalOpen(true);
                }}
                style={s.btnReport}
                title="Signaler ce professionnel"
              >
                <Flag size={15} />
              </button>
            </div>
          </div>

          {!isBlocked && pro.description ? <p style={s.description}>{pro.description}</p> : null}

          {!isBlocked && (
            <div style={s.links}>
              {pro.website && (
                <a href={pro.website} target="_blank" rel="noreferrer" style={s.linkChip}>
                  <Globe size={14} /> Site web
                </a>
              )}
              {pro.email && (
                <a href={`mailto:${pro.email}`} style={s.linkChip}>
                  <Mail size={14} /> {pro.email}
                </a>
              )}
              {pro.phone && (
                <a href={`tel:${pro.phone}`} style={s.linkChip}>
                  <Phone size={14} /> {pro.phone}
                </a>
              )}
            </div>
          )}
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          <button 
            onClick={() => setActiveTab("posts")} 
            style={activeTab === "posts" ? s.tabActive : s.tab}
          >
            <Newspaper size={18} /> Publications
          </button>
          <button 
            onClick={() => setActiveTab("services")} 
            style={activeTab === "services" ? s.tabActive : s.tab}
          >
            <Wrench size={18} /> Services ({proServices.length})
          </button>
          <button 
            onClick={() => setActiveTab("products")} 
            style={activeTab === "products" ? s.tabActive : s.tab}
          >
            <Package size={18} /> Produits ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab("reviews")} 
            style={activeTab === "reviews" ? s.tabActive : s.tab}
          >
            <MessageSquare size={18} /> Avis ({reviews.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === "posts" && (
          <section style={s.feedSection}>
            {loadingPosts && page === 1 ? (
              <div style={s.loadingCard}>
                <Loader size={22} style={{ animation: "spin 1s linear infinite" }} />
                <span>Chargement des publications...</span>
              </div>
            ) : posts.length === 0 ? (
              <div style={s.emptyFeed}>
                <Newspaper size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                <p>Aucune publication pour le moment.</p>
              </div>
            ) : (
              <div style={s.postsGrid}>
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div style={s.pagination}>
                <button 
                  disabled={page === 1 || isFetching} 
                  onClick={() => setPage(p => p - 1)}
                  style={s.pageBtn}
                >Précédent</button>
                <span style={s.pageInfo}>Page {page} sur {totalPages}</span>
                <button 
                  disabled={page === totalPages || isFetching} 
                  onClick={() => setPage(p => p + 1)}
                  style={s.pageBtn}
                >Suivant</button>
              </div>
            )}
          </section>
        )}

        {activeTab === "services" && (
          <div style={s.itemsGrid}>
            {proServices.length === 0 ? (
              <div style={s.emptyFeed}>Aucun service proposé.</div>
            ) : (
              proServices.map(service => (
                <div key={service._id} style={s.itemCard}>
                  {service.imagesServices?.[0] && (
                    <img src={toImageUrl(service.imagesServices[0])} alt={service.name} style={s.itemImg} />
                  )}
                  <div style={s.itemContent}>
                    <h4 style={s.itemName}>{service.name}</h4>
                    <div style={s.itemMeta}>
                      <span><Clock size={14} /> {service.duration} min</span>
                      <span style={s.itemPrice}>{service.price} TND</span>
                    </div>
                    <button onClick={() => setServiceForDetail(service)} style={s.itemBtn}>
                      <Calendar size={16} /> Réserver
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div style={s.itemsGrid}>
            {products.length === 0 ? (
              <div style={s.emptyFeed}>Aucun produit en vente.</div>
            ) : (
              products.map(product => (
                <div key={product._id} style={s.itemCard}>
                  {product.imagesProduct?.[0] && (
                    <img src={toImageUrl(product.imagesProduct[0])} alt={product.name} style={s.itemImg} />
                  )}
                  <div style={s.itemContent}>
                    <h4 style={s.itemName}>{product.name}</h4>
                    <div style={s.itemMeta}>
                      <span style={s.itemPrice}>{product.price} TND</span>
                    </div>
                    <button onClick={() => setProductForDetail(product)} style={s.itemBtn}>
                      <ShoppingCart size={16} /> Commander
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div style={s.reviewsSection}>
            <div style={s.reviewsHeader}>
              <div style={s.avgRatingBig}>
                <div style={s.avgValue}>{ratingStats?.averageRating || "0.0"}</div>
                <div style={s.avgStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={18} fill={star <= Math.round(ratingStats?.averageRating || 0) ? "#fbbf24" : "none"} color="#fbbf24" />
                  ))}
                </div>
                <div style={s.avgCount}>{ratingStats?.totalReviews || 0} avis</div>
              </div>
              
              <form id="review-form" onSubmit={handleReviewSubmit} style={s.reviewForm}>
                <h4 style={s.formTitle}>{editingReviewId ? "Modifier votre avis" : "Laisser un avis"}</h4>
                <div style={s.starRating}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setReviewRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                    >
                      <Star size={24} fill={star <= reviewRating ? "#fbbf24" : "none"} color="#fbbf24" />
                    </button>
                  ))}
                </div>
                <textarea 
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Partagez votre expérience avec ce professionnel..."
                  style={s.reviewTextarea}
                  required
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={submittingReview || updatingReview} style={s.reviewSubmitBtn}>
                    {submittingReview || updatingReview ? <Loader size={16} className="animate-spin" /> : "Envoyer"}
                  </button>
                  {editingReviewId && (
                    <button type="button" onClick={() => {setEditingReviewId(null); setReviewComment(""); setReviewRating(5);}} style={s.reviewCancelBtn}>Annuler</button>
                  )}
                </div>
              </form>
            </div>

            <div style={s.reviewsList}>
              {loadingReviews ? (
                <div style={s.loadingCard}><Loader size={20} className="animate-spin" /></div>
              ) : reviews.length === 0 ? (
                <div style={s.emptyFeed}>Soyez le premier à donner votre avis !</div>
              ) : (
                reviews.map(review => (
                  <div key={review._id} style={s.reviewCard}>
                    <div style={s.reviewHeader}>
                      <img src={toImageUrl(review.user_id?.avatarUrl)} alt={review.user_id?.fullName} style={s.reviewAvatar} />
                      <div style={{ flex: 1 }}>
                        <div style={s.reviewAuthor}>{review.user_id?.fullName}</div>
                        <div style={s.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={s.reviewStars}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={12} fill={star <= review.rating ? "#fbbf24" : "none"} color="#fbbf24" />
                        ))}
                      </div>
                    </div>
                    <p style={s.reviewComment}>{review.comment}</p>
                    {user?.id === review.user_id?._id && (
                      <div style={s.reviewActions}>
                        <button onClick={() => handleEditReview(review)} style={s.actionBtn}><Edit size={14} /> Modifier</button>
                        <button onClick={() => handleDeleteReview(review._id)} style={{ ...s.actionBtn, color: '#ef4444' }}><Trash2 size={14} /> Supprimer</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALS PREMIUM */}
      {serviceForDetail && (
        <ServiceDetail 
          service={serviceForDetail}
          onClose={() => setServiceForDetail(null)}
          onReserve={(s) => handleAction(s, 'service')}
        />
      )}

      {productForDetail && (
        <ProductDetail 
          product={productForDetail}
          onClose={() => setProductForDetail(null)}
          onOrder={(selection) => handleAction(selection, 'product', selection)}
        />
      )}

      {selectedItemForAction && (
        <ActionModal 
          type={actionType}
          item={selectedItemForAction}
          prefilledData={prefilledActionData}
          user={user}
          onClose={() => setSelectedItemForAction(null)}
          onSubmit={handleSubmitAction}
          isLoading={ordering || reserving || isPaying}
        />
      )}

      {(orderSuccess || resSuccess) && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#10b981', color: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 3000, display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeInUp 0.3s' }}>
          <CheckCircle2 size={20} />
          <span>{orderSuccess ? "Commande réussie !" : "Réservation envoyée !"}</span>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modal, maxWidth: '500px' }}>
            <button onClick={() => setIsReportModalOpen(false)} style={s.modalClose}><X size={24} /></button>
            <div style={s.modalHeader}>
              <Flag size={24} color="#ef4444" />
              <h2 style={s.modalTitle}>Signaler ce profil</h2>
            </div>
            
            {reportSuccess ? (
              <div style={s.successMsg}>
                <Info size={48} color="#10b981" />
                <h3>Signalement envoyé</h3>
                <p>Nos administrateurs examineront ce profil sous peu.</p>
              </div>
            ) : (
              <form onSubmit={handleReport} style={s.modalForm}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                  {pro.photoProfessional ? (
                    <img src={photo} alt="" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={24} color="#64748b" />
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{pro.fullName}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Profil à signaler</p>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>
                  Aidez-nous à maintenir la communauté sûre. Pourquoi signalez-vous ce professionnel ?
                </p>
                <textarea 
                  required
                  style={s.formTextarea} 
                  placeholder="Détaillez le problème rencontré..."
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                />
                <button type="submit" disabled={reporting} style={{ ...s.modalSubmit, background: '#ef4444' }}>
                  {reporting ? <Loader size={18} className="animate-spin" /> : "Envoyer le signalement"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  page: { minHeight: '100vh', background: '#f8fafc', padding: '20px 0 60px' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '0 20px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer', marginBottom: '20px' },
  card: { background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '30px' },
  cover: { height: '160px', background: 'linear-gradient(135deg, #1E3A5F 0%, #3b82f6 50%, #8b5cf6 100%)', position: 'relative' },
  coverGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(transparent, rgba(0,0,0,0.1))' },
  header: { padding: '0 40px 30px', marginTop: '-50px', display: 'flex', gap: '24px', alignItems: 'flex-end', position: 'relative' },
  logo: { width: '120px', height: '120px', borderRadius: '30px', border: '6px solid white', background: 'white', objectFit: 'cover', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  logoFallback: { width: '120px', height: '120px', borderRadius: '30px', border: '6px solid white', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' },
  name: { fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: '0 0 5px' },
  ratingBadge: { display: 'flex', alignItems: 'center', gap: '5px', background: '#fffbeb', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', border: '1px solid #fde68a' },
  ratingCount: { color: '#d97706', opacity: 0.7, fontWeight: '500' },
  meta: { display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '15px', fontWeight: '500', margin: 0 },
  btnFollow: { display: 'flex', alignItems: 'center', gap: '8px', background: '#24416b', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' },
  btnFollowing: { display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', color: '#24416b', border: '1px solid #dbeafe', padding: '12px 24px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' },
  btnReport: { width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '14px', cursor: 'pointer', transition: '0.2s' },
  description: { padding: '0 40px', color: '#475569', fontSize: '16px', lineHeight: '1.7', margin: '0 0 25px' },
  links: { padding: '0 40px 30px', display: 'flex', gap: '15px', flexWrap: 'wrap' },
  linkChip: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', color: '#1e293b', textDecoration: 'none', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', border: '1px solid #e2e8f0' },
  tabs: { display: 'flex', gap: '10px', background: 'white', padding: '10px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '30px' },
  tab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', borderRadius: '14px', border: 'none', background: 'none', color: '#64748b', fontWeight: '700', cursor: 'pointer', transition: '0.2s' },
  tabActive: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', borderRadius: '14px', border: 'none', background: '#24416b', color: 'white', fontWeight: '700', cursor: 'pointer' },
  feedSection: { display: 'flex', flexDirection: 'column', gap: '20px' },
  postsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '25px' },
  emptyFeed: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '24px', border: '1px dashed #cbd5e1', color: '#64748b' },
  itemsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' },
  itemCard: { background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
  itemImg: { width: '100%', height: '160px', objectFit: 'cover' },
  itemContent: { padding: '15px' },
  itemName: { margin: '0 0 10px', fontSize: '16px', fontWeight: '700', color: '#1e293b' },
  itemMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', color: '#64748b', fontSize: '13px' },
  itemPrice: { color: '#24416b', fontWeight: '800', fontSize: '16px' },
  itemBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' },
  reviewsSection: { background: 'white', borderRadius: '24px', padding: '30px', border: '1px solid #e2e8f0' },
  reviewsHeader: { display: 'flex', gap: '40px', marginBottom: '40px', flexWrap: 'wrap' },
  avgRatingBig: { textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '20px', minWidth: '180px' },
  avgValue: { fontSize: '48px', fontWeight: '900', color: '#1e293b' },
  avgStars: { display: 'flex', justifyContent: 'center', gap: '2px', margin: '10px 0' },
  avgCount: { fontSize: '14px', color: '#64748b', fontWeight: '600' },
  reviewForm: { flex: 1, minWidth: '300px' },
  formTitle: { margin: '0 0 15px', fontSize: '18px', fontWeight: '800' },
  starRating: { display: 'flex', gap: '5px', marginBottom: '15px' },
  reviewTextarea: { width: '100%', minHeight: '100px', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '15px', marginBottom: '15px', resize: 'none' },
  reviewSubmitBtn: { background: '#24416b', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
  reviewCancelBtn: { background: '#f1f5f9', color: '#64748b', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
  reviewsList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  reviewCard: { padding: '20px', borderBottom: '1px solid #f1f5f9' },
  reviewHeader: { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '12px' },
  reviewAvatar: { width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' },
  reviewAuthor: { fontWeight: '700', fontSize: '15px' },
  reviewDate: { fontSize: '12px', color: '#94a3b8' },
  reviewStars: { marginLeft: 'auto', display: 'flex', gap: '2px' },
  reviewComment: { color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: 0 },
  reviewActions: { display: 'flex', gap: '15px', marginTop: '12px' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: 'white', borderRadius: '32px', width: '100%', maxWidth: '600px', padding: '40px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' },
  modalClose: { position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  modalHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' },
  modalTitle: { fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '20px' },
  modalItemInfo: { display: 'flex', gap: '20px', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '20px', marginBottom: '10px' },
  modalItemImg: { width: '80px', height: '80px', borderRadius: '15px', objectFit: 'cover' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  formLabel: { fontSize: '14px', fontWeight: '700', color: '#475569' },
  formInput: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px' },
  formTextarea: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', minHeight: '100px', resize: 'none' },
  modalSubmit: { background: '#24416b', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' },
  successMsg: { textAlign: 'center', padding: '40px 0' },
  sectionDivider: { fontSize: '14px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '10px 0 5px' },
  orderSummary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#eff6ff', borderRadius: '16px', fontWeight: '800' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '30px' },
  pageBtn: { padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' },
  pageInfo: { color: '#64748b', fontWeight: '600' },
  loadingCard: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px', color: '#64748b' }
};

export default ProfessionalPublicProfile;
