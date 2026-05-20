import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  useGetPublicCompanyProfileQuery,
  useFollowCompanyMutation,
  useCheckFollowStatusQuery,
} from "../../redux/features/company/companyApiSlice";
import { useGetPostsByCompanyQuery } from "../../redux/features/posts/postApiSlice";
import PostCard from "../../components/Posts/PostCard";
import {
  ArrowLeft, Building2, Globe, Mail, Phone,
  MapPin, Newspaper, Loader, UserCheck, UserPlus, Flag, X, Send,
  Package, Wrench, Calendar, Info, Clock, CreditCard, Ban, Star, MessageSquare, AlertCircle, ShieldCheck, ShoppingCart,
  Edit, Trash2, CheckCircle2
} from "lucide-react";
import { useCreateReportMutation } from "../../redux/features/reports/reportApiSlice";
import { useGetCompanyProductsQuery } from "../../redux/features/products/productApiSlice";
import { useGetCompanyServicesQuery } from "../../redux/features/company/companyServiceApiSlice";
import { useCreateReservationMutation } from "../../redux/features/reservations/reservationApiSlice";
import { useCreateOrderMutation } from "../../redux/features/orders/orderApiSlice";
import { useCreateQuoteRequestMutation } from "../../redux/features/company/quoteApiSlice";
import {
  useGetCompanyReviewsQuery,
  useGetAverageRatingQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useUpdateReviewMutation,
} from "../../redux/features/reviews/reviewApiSlice";
import { useRequestClaimMutation as useReqClaim } from "../../redux/features/company/companyApiSlice";
import { useInitializePaymentMutation } from "../../redux/features/payments/paymentApiSlice";
import { useSelector } from "react-redux";


import { toImageUrl } from "../../utils/imageUtils";

// Components Premium
import ProductDetail from "../../components/dashboard/client/ProductDetail";
import ServiceDetail from "../../components/dashboard/client/ServiceDetail";
import ActionModal from "../../components/dashboard/client/ActionModal";

const CompanyPublicProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId } = useParams();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("posts"); // posts, products, services

  const user = useSelector((state) => state.auth.user);


  const {
    data: followStatusData,
    refetch: refetchFollowStatus,
  } = useCheckFollowStatusQuery(companyId, {
    skip: !companyId || !user,
    pollingInterval: 3000,
  });

  const isFollowed = followStatusData?.isFollowing ?? false;
  const isBlocked = followStatusData?.isBlocked ?? false;

  const [followCompany, { isLoading: following }] = useFollowCompanyMutation();

  const [createReport, { isLoading: reporting }] = useCreateReportMutation();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  // Reservation & Order Logic
  const [createReservation, { isLoading: reserving }] = useCreateReservationMutation();
  const [createOrder, { isLoading: ordering }] = useCreateOrderMutation();
  const [createQuoteRequest, { isLoading: isRequestingQuote }] = useCreateQuoteRequestMutation();
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
  
  const { data: reviews = [], isLoading: loadingReviews } = useGetCompanyReviewsQuery(companyId, { skip: !companyId, pollingInterval: 3000 });
  const { data: ratingStats } = useGetAverageRatingQuery(companyId, { skip: !companyId, pollingInterval: 3000 });

  const [requestClaim, { isLoading: claiming }] = useReqClaim();
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [claimWarning, setClaimWarning] = useState("");

  const { data: company, isLoading: loadingProfile, refetch: refetchProfile } =
    useGetPublicCompanyProfileQuery(companyId, {
      skip: !companyId,
      pollingInterval: 3000,
    });

  const {
    data: postsData,
    isLoading: loadingPosts,
    isFetching,
    refetch: refetchPosts,
  } = useGetPostsByCompanyQuery(
    { companyId, page, limit: 10 },
    { skip: !companyId, pollingInterval: 3000 }
  );

  const { data: products = [], isLoading: loadingProducts } = useGetCompanyProductsQuery(companyId, { skip: !companyId, pollingInterval: 3000 });
  const { data: companyServices = [], isLoading: loadingServices } = useGetCompanyServicesQuery(companyId, { skip: !companyId, pollingInterval: 3000 });

  // ✅ Auto-select tab and item if redirected from dashboard
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.selectServiceId && companyServices.length > 0) {
      const service = companyServices.find(s => s._id === location.state.selectServiceId);
      if (service) {
        setSelectedService(service);
        // Clear state to avoid reopening on re-renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [companyServices, location.state]);

  useEffect(() => {
    if (location.state?.selectProductId && products.length > 0) {
      const product = products.find(p => p._id === location.state.selectProductId);
      if (product) {
        setSelectedProduct(product);
        // Clear state to avoid reopening on re-renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [products, location.state]);

  useEffect(() => {
    setPage(1);
  }, [companyId]);

  const handleFollow = async () => {
    if (!user) {
      navigate("/auth/login", { state: { from: location.pathname } });
      return;
    }
    try {
      await followCompany({ companyId, isFollowed }).unwrap();
      // Refetch immédiat après l'action
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
      await createReport({ company_id: companyId, reason: reportReason }).unwrap();
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
          company_id: companyId,
          rating: reviewRating,
          comment: reviewComment,
        }).unwrap();
        setEditingReviewId(null);
        alert("Avis modifié avec succès !");
      } else {
        await createReview({
          company_id: companyId,
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
    // Scroll to review form
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
          companyId,
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
        
        // On ne déclenche plus le paiement automatiquement, on redirige vers les achats
        setOrderSuccess(true);
        navigate("/user/purchases");
      } else {
        // Formater la date en YYYY-MM-DD pour éviter les décalages de fuseau horaire
        let formattedDate = data.date;
        if (data.date instanceof Date) {
          const y = data.date.getFullYear();
          const m = String(data.date.getMonth() + 1).padStart(2, '0');
          const d = String(data.date.getDate()).padStart(2, '0');
          formattedDate = `${y}-${m}-${d}`;
        }

        await createQuoteRequest({
          companyId,
          bookingServiceId: selectedItemForAction._id,
          bookingDate: formattedDate,
          bookingTimeSlot: data.time || data.bookingSlot,
          notes: data.note,
          clientPhone: data.address?.phone || data.phone,
          clientName: user?.fullName || user?.companyName || "Client",
          clientEmail: user?.email || "",
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

  const handleRequestClaim = async () => {
    try {
      const result = await requestClaim(companyId).unwrap();
      setMaskedEmail(result.maskedEmail);
      if (result.warning) {
        setClaimWarning(result.warning);
      } else {
        setClaimWarning("");
      }
      setClaimSuccess(true);
      // On ne ferme pas automatiquement si c'est un avertissement (pour que l'utilisateur puisse lire)
      if (!result.warning) {
        setTimeout(() => {
          setIsClaimModalOpen(false);
          setClaimSuccess(false);
        }, 5000);
      }
    } catch (err) {
      console.error("Claim error", err);
      const msg = err.data?.message || "Erreur lors de la demande de revendication.";
      const detail = err.data?.details ? `\n\nDétails: ${err.data.details}` : "";
      alert(msg + detail);
    }
  };

  const posts = postsData?.posts ?? [];
  const totalPages = postsData?.totalPages ?? 0;

  const fullAddress = useMemo(
    () => [company?.cityName, company?.regionName, company?.countryName].filter(Boolean).join(", "),
    [company]
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

  if (!company) {
    return (
      <div style={s.page}>
        <div style={s.card}>Profil entreprise introuvable.</div>
      </div>
    );
  }

  const logo = toImageUrl(company.logoUrl);
  const cover = toImageUrl(company.coverUrl);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button type="button" onClick={() => navigate(-1)} style={s.backBtn}>
          <ArrowLeft size={16} /> Retour
        </button>

        <div style={s.card}>
          <div style={{ ...s.cover, height: cover ? 200 : 80, background: cover ? 'transparent' : "linear-gradient(120deg, #dbeafe, #e2e8f0)" }}>
            {cover ? <img src={cover} alt="cover" style={s.coverImg} /> : null}
          </div>

          <div style={s.header}>
            {logo ? (
              <img src={logo} alt="logo company" style={s.logo} />
            ) : (
              <div style={s.logoFallback}>
                <Building2 size={36} />
              </div>
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={s.name}>{company.companyName || "Entreprise"}</h1>
                {ratingStats?.averageRating > 0 && (
                  <div style={s.ratingBadge}>
                    <Star size={14} fill="#fbbf24" color="#fbbf24" />
                    <span>{ratingStats.averageRating}</span>
                    <span style={s.ratingCount}>({ratingStats.totalReviews})</span>
                  </div>
                )}
              </div>
              {!isBlocked && fullAddress ? (
                <p style={s.meta}>
                  <MapPin size={14} /> {fullAddress}
                </p>
              ) : null}
            </div>

            {/* ✅ Bouton Follow/Unfollow avec style dynamique */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isBlocked ? (
                <div style={{ ...s.btnFollow, background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed', border: '1px solid #e2e8f0' }}>
                  <Ban size={15} /> Bloqué
                </div>
              ) : (
                <>
                  {company?.isGenerated && (
                    <button 
                      onClick={() => setIsClaimModalOpen(true)}
                      style={{ ...s.btnFollow, background: '#10b981' }}
                    >
                      <ShieldCheck size={16} /> Revendiquer
                    </button>
                  )}
                  <button
                    onClick={handleFollow}
                    disabled={following}
                    style={isFollowed ? s.btnFollowing : s.btnFollow}
                  >
                    {following ? (
                      <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : isFollowed ? (
                      <><UserCheck size={15} /> Déjà suivi</>
                    ) : (
                      <><UserPlus size={15} /> Suivre</>
                    )}
                  </button>
                </>
              )}
              
              <button 
                onClick={() => {
                  if (!user) {
                    navigate("/auth/login", { state: { from: location.pathname } });
                    return;
                  }
                  setIsReportModalOpen(true);
                }}
                style={s.btnReport}
                title="Signaler cette entreprise"
              >
                <Flag size={15} />
              </button>
            </div>
          </div>

          {!isBlocked && company.description ? <p style={s.description}>{company.description}</p> : null}

          {!isBlocked && (
            <div style={s.links}>
              {company.website ? (
                <a href={company.website} target="_blank" rel="noreferrer" style={s.linkChip}>
                  <Globe size={14} /> Site web
                </a>
              ) : null}
              {company.email ? (
                <a href={`mailto:${company.email}`} style={s.linkChip}>
                  <Mail size={14} /> {company.email}
                </a>
              ) : null}
              {company.phone ? (
                <a href={`tel:${company.phone}`} style={s.linkChip}>
                  <Phone size={14} /> {company.phone}
                </a>
              ) : null}
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
            <Wrench size={18} /> Services ({companyServices.length})
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

        {/* Content based on Active Tab */}
        {isBlocked ? (
          <div style={{ ...s.emptyFeed, padding: '60px 20px', background: '#f8fafc', borderRadius: '20px', border: '1px dashed #e2e8f0' }}>
            <Ban size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
            <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>Accès restreint</h3>
            <p>Vous avez été bloqué par cette entreprise. Vous ne pouvez plus voir ses publications ni interagir avec ses services.</p>
          </div>
        ) : (
          <>
            {activeTab === "posts" && (
              <section style={s.feedSection}>
                {loadingPosts && page === 1 ? (
                  <div style={s.loadingCard}>
                    <Loader size={22} style={{ animation: "spin 1s linear infinite" }} />
                    <span>Chargement des publications...</span>
                  </div>
                ) : posts.length === 0 ? (
                  <div style={s.emptyFeed}>Aucune publication pour le moment.</div>
                ) : (
                  <>
                    {posts.map((post) => (
                      <PostCard key={post._id} post={post} onDeleted={() => refetchPosts()} />
                    ))}
                    {totalPages > 1 && (
                      <div style={s.pagination}>
                        <button
                          type="button"
                          style={{ ...s.pageBtn, opacity: page <= 1 ? 0.45 : 1 }}
                          disabled={page <= 1 || isFetching}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          ← Précédent
                        </button>
                        <span style={s.pageInfo}>
                          {page} / {totalPages}
                        </span>
                        <button
                          type="button"
                          style={{ ...s.pageBtn, opacity: page >= totalPages ? 0.45 : 1 }}
                          disabled={page >= totalPages || isFetching}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Suivant →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {activeTab === "services" && (
              <section style={s.gridSection}>
                {loadingServices ? (
                  <div style={s.loadingCard}><Loader size={22} className="animate-spin" /></div>
                ) : companyServices.length === 0 ? (
                  <div style={s.emptyFeed}>Aucun service proposé.</div>
                ) : (
                  <div style={s.grid}>
                    {companyServices.map((service) => (
                      <div key={service._id} style={s.itemCard}>
                        {service.imagesServices?.[0] && (
                          <img src={toImageUrl(service.imagesServices[0])} alt={service.name} style={s.itemImg} />
                        )}
                        <div style={s.itemContent}>
                          <h3 style={s.itemName}>{service.name}</h3>
                          <p style={s.itemDesc}>{service.description}</p>
                          <div style={s.itemFooter}>
                            <span style={s.itemPrice}>{service.price} </span>
                            <span style={s.itemDuration}><Clock size={14} /> {service.duration} </span>
                          </div>
                          <button 
                            style={s.bookBtn}
                            onClick={() => setServiceForDetail(service)}
                          >
                            <Calendar size={16} /> Réserver
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "products" && (
              <section style={s.gridSection}>
                {loadingProducts ? (
                  <div style={s.loadingCard}><Loader size={22} className="animate-spin" /></div>
                ) : products.length === 0 ? (
                  <div style={s.emptyFeed}>Aucun produit disponible.</div>
                ) : (
                  <div style={s.grid}>
                    {products.map((product) => (
                      <div key={product._id} style={s.itemCard}>
                        {product.imagesProduct?.[0] && (
                          <img src={toImageUrl(product.imagesProduct[0])} alt={product.name} style={s.itemImg} />
                        )}
                        <div style={s.itemContent}>
                          <h3 style={s.itemName}>{product.name}</h3>
                          <p style={s.itemDesc}>{product.description}</p>
                          <div style={s.itemFooter}>
                            <span style={s.itemPrice}>{product.price} </span>
                            <span style={s.itemStock}>{product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}</span>
                          </div>
                          <button 
                            style={s.orderBtn}
                            disabled={product.stock === 0}
                            onClick={() => setProductForDetail(product)}
                          >
                            <ShoppingCart size={16} /> Commander
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "reviews" && (
              <section style={s.feedSection}>
                {/* Formulaire d'avis */}
                <div id="review-form" style={s.reviewFormCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                      {editingReviewId ? "Modifier votre avis" : "Laissez un avis"}
                    </h3>
                    {editingReviewId && (
                      <button 
                        onClick={() => { setEditingReviewId(null); setReviewComment(""); setReviewRating(5); }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Annuler la modification
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleReviewSubmit}>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={24}
                          onClick={() => setReviewRating(star)}
                          style={{ cursor: 'pointer' }}
                          fill={star <= reviewRating ? "#fbbf24" : "none"}
                          color={star <= reviewRating ? "#fbbf24" : "#cbd5e1"}
                        />
                      ))}
                    </div>
                    <textarea
                      placeholder="Partagez votre expérience..."
                      style={s.textarea}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={submittingReview || updatingReview} 
                      style={{ ...s.submitBtn, marginTop: '10px', background: '#1E3A5F', width: 'auto', padding: '10px 25px' }}
                    >
                      {submittingReview || updatingReview ? <Loader size={18} className="animate-spin" /> : (editingReviewId ? "Enregistrer les modifications" : "Publier l'avis")}
                    </button>
                  </form>
                </div>

                {/* Liste des avis */}
                <div style={{ marginTop: '30px' }}>
                  {loadingReviews ? (
                    <div style={s.loadingCard}>
                      <Loader size={22} style={{ animation: "spin 1s linear infinite" }} />
                      <span>Chargement des avis...</span>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div style={s.emptyFeed}>Aucun avis pour le moment.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {reviews.map((review) => (
                        <div key={review._id} style={s.reviewCard}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <img 
                                src={toImageUrl(review.user_id?.avatarUrl)} 
                                alt={review.user_id?.fullName} 
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f1f5f9' }}
                              />
                              <div>
                                <p style={{ fontWeight: '600', color: '#1e293b' }}>{review.user_id?.fullName}</p>
                                <p style={{ fontSize: '12px', color: '#64748b' }}>{new Date(review.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={14}
                                    fill={star <= review.rating ? "#fbbf24" : "none"}
                                    color={star <= review.rating ? "#fbbf24" : "#cbd5e1"}
                                  />
                                ))}
                              </div>
                              {user && review.user_id?._id === user.id && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button 
                                    onClick={() => handleEditReview(review)}
                                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                                    title="Modifier mon avis"
                                  >
                                    <Edit size={14} /> Modifier
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteReview(review._id)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                                    title="Supprimer mon avis"
                                  >
                                    <Trash2 size={14} /> Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p style={{ marginTop: '12px', color: '#475569', lineHeight: '1.5' }}>{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* MODAL RESERVATION PREMIUM */}
      {serviceForDetail && (
        <ServiceDetail 
          service={serviceForDetail}
          onClose={() => setServiceForDetail(null)}
          onReserve={(selection) => handleAction(selection, 'service', selection)}
        />
      )}

      {/* MODAL PRODUIT PREMIUM */}
      {productForDetail && (
        <ProductDetail 
          product={productForDetail}
          onClose={() => setProductForDetail(null)}
          onOrder={(p) => handleAction(p, 'product')}
        />
      )}

      {/* ACTION MODAL (FORMULAIRE) */}
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

      {/* SUCCESS MESSAGES (SI BESOIN) */}
      {(orderSuccess || resSuccess) && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#10b981', color: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 3000, display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeInUp 0.3s' }}>
          <CheckCircle2 size={20} />
          <span>{orderSuccess ? "Commande réussie !" : "Demande envoyée, veuillez attendre le devis !"}</span>
        </div>
      )}

      {/* MODAL DE SIGNALEMENT */}
      {isReportModalOpen && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <div style={s.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: '#fef2f2', borderRadius: '10px' }}>
                  <Flag size={20} color="#ef4444" />
                </div>
                <h3 style={s.modalTitle}>Signaler l'entreprise</h3>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} style={s.closeBtn}>
                <X size={20} />
              </button>
            </div>

            {reportSuccess ? (
              <div style={s.successMsg}>
                <div style={{ background: '#10b981', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                  <UserCheck size={24} />
                </div>
                <p style={{ fontWeight: '600', color: '#065f46' }}>Signalement envoyé !</p>
                <p style={{ fontSize: '14px', color: '#047857', marginTop: '5px' }}>L'équipe de modération va examiner votre demande.</p>
              </div>
            ) : (
             <form onSubmit={handleReport}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  {company.logoUrl ? (
                    <img src={toImageUrl(company.logoUrl)} alt="" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={24} color="#64748b" />
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{company.companyName}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Entreprise à signaler</p>
                  </div>
                </div>
                <p style={s.modalInfo}>
                  Dites-nous pourquoi vous signalez <strong>{company?.companyName}</strong>. Votre signalement sera traité de manière anonyme.
                </p>
                
                <div style={s.formGroup}>
                  <label style={s.label}>Raison du signalement</label>
                  <textarea 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Ex: Contenu inapproprié, fraude, harcèlement..."
                    style={s.textarea}
                    required
                  />
                </div>

                <div style={s.modalFooter}>
                  <button 
                    type="button" 
                    onClick={() => setIsReportModalOpen(false)} 
                    style={s.cancelBtn}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={reporting || !reportReason.trim()}
                    style={s.submitBtn}
                  >
                    {reporting ? (
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>Envoyer le signalement <Send size={16} /></>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL REVENDICATION */}
      {isClaimModalOpen && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <div style={s.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: '#ecfdf5', borderRadius: '10px' }}>
                  <ShieldCheck size={20} color="#10b981" />
                </div>
                <h3 style={s.modalTitle}>Revendiquer cette entreprise</h3>
              </div>
              <button onClick={() => setIsClaimModalOpen(false)} style={s.closeBtn}><X size={20} /></button>
            </div>

            {claimSuccess ? (
              <div style={s.successMsg}>
                <div style={{ background: '#10b981', color: 'white', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Mail size={24} />
                </div>
                <p style={{ fontWeight: '700', color: '#111827', fontSize: '18px', marginBottom: '8px' }}>
                  {claimWarning ? "Action requise (Mode Test)" : "E-mail envoyé !"}
                </p>
                <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                  {claimWarning ? (
                    <span style={{ color: '#b45309', fontWeight: '600' }}>
                      {claimWarning}
                    </span>
                  ) : (
                    <>
                      Un lien de vérification a été envoyé à l'adresse officielle : <br/>
                      <strong style={{ color: '#059669' }}>{maskedEmail}</strong>
                    </>
                  )}
                </p>
                <button
                  onClick={() => setIsClaimModalOpen(false)}
                  style={{ ...s.submitBtn, background: claimWarning ? '#f59e0b' : '#10b981', marginTop: '25px', width: '100%' }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div>
                <p style={s.modalInfo}>
                  Pour prouver que vous êtes le propriétaire légitime de <b>{company.companyName}</b>, nous devons vérifier votre identité commerciale.
                </p>
                
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <AlertCircle size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                      En cliquant sur le bouton ci-dessous, un e-mail contenant un lien de sécurité sera envoyé à l'adresse enregistrée de l'entreprise.
                    </p>
                  </div>
                </div>

                <div style={s.modalFooter}>
                  <button onClick={() => setIsClaimModalOpen(false)} style={s.cancelBtn}>Annuler</button>
                  <button 
                    onClick={handleRequestClaim} 
                    disabled={claiming} 
                    style={{ ...s.submitBtn, background: '#10b981' }}
                  >
                    {claiming ? <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> : 'Envoyer le lien de vérification'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

const s = {
  page: {
    minHeight: "100vh",
    height: "100vh",
    padding: "20px 0px 60px",
  },
  container: { maxWidth: '1000px', margin: "0 auto", padding: '0 20px' },
  backBtn: {
    border: "1px solid #182f47ff",
    background: "#fff",
    color: "#334155",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    fontWeight: 600,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5ebf2",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    marginBottom: 20,
  },
  cover: { height: 160, background: "linear-gradient(120deg, #dbeafe, #e2e8f0)" },
  coverImg: { width: "100%", height: "100%", objectFit: "cover" },
  header: {
    padding: '0 40px 30px',
    marginTop: '-50px',
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-end',
    position: 'relative',
    flexWrap: 'wrap',
  },
  logo: {
    width: '120px',
    height: '120px',
    borderRadius: '30px',
    border: '6px solid white',
    background: 'white',
    objectFit: 'cover',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    flexShrink: 0,
  },
  logoFallback: {
    width: '120px',
    height: '120px',
    borderRadius: '30px',
    border: '6px solid white',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    flexShrink: 0,
  },

  name: { 
    margin: "0 0 5px", 
    color: "#1e293b", 
    fontSize: "32px", 
    fontWeight: "900",
    textAlign: "left",
    lineHeight: "1.2"
  },
  ratingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: '#fef3c7',
    color: '#92400e',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
     border: '1px solid #fde68a'
  },
  ratingCount: {
    fontSize: '12px',
    color: '#b45309',
    fontWeight: '500',
  },
  meta: { margin: 0, color: "#64748b", display: "flex", alignItems: "center", gap: 6, fontSize: 14 },

  tabs: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "10px",
  },
  tab: {
    padding: "10px 16px",
    background: "none",
    border: "none",
    color: "#64748b",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderRadius: "8px",
    transition: "0.2s",
  },
  tabActive: {
    padding: "10px 16px",
    background: "#eff6ff",
    border: "none",
    color: "#1E3A5F",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderRadius: "8px",
  },
  gridSection: { marginTop: 8 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  itemCard: {
    background: "#fff",
    borderRadius: "16px",
    border: "1.5px solid #e2e8f0",
    overflow: "hidden",
    transition: "0.2s",
  },
  itemImg: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
  },
  itemContent: {
    padding: "16px",
  },
  itemName: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#1e293b",
    margin: "0 0 8px",
  },
  itemDesc: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 16px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: "1.5",
  },
  itemFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  itemPrice: {
    fontSize: "18px",
    fontWeight: "900",
    color: "#1E3A5F",
  },
  itemDuration: {
    fontSize: "12px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  itemStock: {
    fontSize: "12px",
    color: "#16a34a",
    fontWeight: "700",
  },
  bookBtn: {
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  orderBtn: {
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "#16a34a",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },

  btnFollow: {
    background: "#24416b",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "0.2s ease",
    boxShadow: "0 4px 12px rgba(36, 65, 107, 0.2)",
  },
  btnFollowing: {
    background: "#fff",
    color: "#24416b",
    border: "2px solid #24416b",
    borderRadius: 10,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "0.2s ease",
  },
  btnReport: {
    background: "#fff",
    color: "#ef4444",
    border: "2px solid #fee2e2",
    borderRadius: 10,
    padding: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "0.2s ease",
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
  },
  modalContent: {
    background: '#fff', borderRadius: '24px', width: '90%', maxWidth: '450px',
    padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px',
  },
  modalTitle: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' },
  closeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  modalInfo: { fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '25px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' },
  textarea: {
    width: '100%', minHeight: '120px', padding: '15px', borderRadius: '14px', border: '1.5px solid #e2e8f0',
    fontSize: '14px', background: '#f8fafc', outline: 'none', transition: '0.2s', resize: 'vertical',
  },
  modalFooter: { display: 'flex', gap: '12px', marginTop: '25px' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: '700', cursor: 'pointer', color: '#64748b' },
  submitBtn: { flex: 1.5, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  successMsg: { textAlign: 'center', padding: '20px 0' },
  description: { padding: "0 20px 0", margin: "0 0 8px", lineHeight: 1.6, color: "#334155", fontSize: 15 },
  links: { display: "flex", flexWrap: "wrap", gap: 10, padding: "12px 20px 20px" },
  linkChip: {
    display: "inline-flex", alignItems: "center", gap: 7,
    textDecoration: "none", border: "1px solid #cfd8e3",
    background: "#f8fafc", color: "#1e293b",
    borderRadius: 999, padding: "8px 12px",
    fontSize: 13, fontWeight: 600,
  },
  feedSection: { display: "flex", flexDirection: "column", gap: 16, marginTop: 8 },
  feedHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingLeft: 4 },
  feedTitle: { fontWeight: 800, fontSize: 20, color: "#0f172a", margin: 0 },
  loadingCard: {
    background: "#fff", border: "1px solid #e5ebf2",
    borderRadius: 14, padding: 28,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 12, color: "#64748b", fontSize: 14,
  },
  emptyFeed: {
    padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: 15,
    background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
  },
  reviewFormCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    marginBottom: '20px',
  },
  reviewCard: {
    background: '#fff',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  },
  pagination: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 16, marginTop: 20, marginBottom: 8,
  },
  pageBtn: {
    padding: "8px 18px", background: "#1E3A5F", color: "#fff",
    border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
  },
  pageInfo: { fontSize: 13, color: "#64748b", fontWeight: 600 },

};

export default CompanyPublicProfile;