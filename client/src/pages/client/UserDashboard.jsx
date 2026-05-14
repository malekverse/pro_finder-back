import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logOut } from "../../redux/features/auth/authSlice";
import { apiSlice } from "../../redux/app/api/apiSlice";
import { useGetFollowedFeedQuery } from "../../redux/features/posts/postApiSlice";
import {
  useGetFollowedProductsQuery
} from "../../redux/features/products/productApiSlice";
import {
  useGetFollowedServicesQuery
} from "../../redux/features/company/companyServiceApiSlice";
import { useCreateOrderMutation } from "../../redux/features/orderApiSlice";
import { useCreateReservationMutation } from "../../redux/features/reservationApiSlice";
import { useCreateQuoteRequestMutation } from "../../redux/features/company/quoteApiSlice";
import { useInitializePaymentMutation } from "../../redux/features/paymentApiSlice";
import { Newspaper, Package, Wrench, X, CheckCircle2, Heart, Star, Building2, ShoppingBag, Clock, ShoppingCart, User } from "lucide-react";
import { toImageUrl } from "../../utils/imageUtils";
import Cart from "../../components/dashboard/client/Cart";

// Components
import Header from "../../components/dashboard/client/Header";
import Feed from "../../components/dashboard/client/Feed";
import AllServices from "../../components/dashboard/client/AllServices";
import AllProducts from "../../components/dashboard/client/AllProducts";
import SuggestedCompanies from "../../components/dashboard/client/SuggestedCompanies";
import ProductDetail from "../../components/dashboard/client/ProductDetail";
import ServiceDetail from "../../components/dashboard/client/ServiceDetail";
import ActionModal from "../../components/dashboard/client/ActionModal";
import CompaniesExplorer from "../../components/dashboard/client/CompaniesExplorer";
import ProfessionalsExplorer from "../../components/dashboard/client/ProfessionalsExplorer";

const UserDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const roles = user?.roles || [];
  const hasCompanyAccess = user?.companyId && roles.length > 1;

  const [activeTab, setActiveTab] = useState("feed"); // feed, services, products, societes, pros
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [productForDetail, setProductForDetail] = useState(null);
  const [serviceForDetail, setServiceForDetail] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const carts = useSelector((state) => state.cart.carts);

  const cartItemsCount = Object.values(carts).reduce((sum, cart) => sum + cart.items.length, 0);

  // API Hooks
  const { data: feedData, isLoading: isLoadingFeed, isFetching: isFetchingFeed, refetch: refetchFeed } = useGetFollowedFeedQuery({ page, limit: 10 }, { pollingInterval: 3000 });
  const { data: followedProducts = [] } = useGetFollowedProductsQuery(undefined, { pollingInterval: 3000 });
  const { data: followedServices = [] } = useGetFollowedServicesQuery(undefined, { pollingInterval: 3000 });

  const [createOrder, { isLoading: isOrdering }] = useCreateOrderMutation();
  const [createReservation, { isLoading: isReserving }] = useCreateReservationMutation();
  const [createQuoteRequest, { isLoading: isRequestingQuote }] = useCreateQuoteRequestMutation();
  const [initPayment, { isLoading: isPaying }] = useInitializePaymentMutation();

  const handleAction = (item, type) => {
    setSelectedItem(item);
    setActionType(type);
    setProductForDetail(null);
  };

  const [prefilledData, setPrefilledData] = useState(null);

  const handleServiceReserve = (data) => {
    // Au lieu de réserver directement, on ouvre l'ActionModal pour le numéro de téléphone
    setSelectedItem(data);
    setActionType('service');
    setPrefilledData(data);
    setServiceForDetail(null);
  };

  const handleSubmitAction = async (data) => {
    try {
      if (actionType === 'product') {
        if (data.quantity > (selectedItem.stock || 0)) {
          alert("Désolé, le stock est insuffisant pour cette quantité.");
          return;
        }
        const isPro = !!selectedItem.professionalId;
        const orderResult = await createOrder({
          companyId: !isPro ? (selectedItem.companyId?._id || selectedItem.companyId) : null,
          professionalId: isPro ? (selectedItem.professionalId?._id || selectedItem.professionalId) : null,
          items: [{ productId: selectedItem._id, quantity: data.quantity, price: selectedItem.price }],
          totalPrice: selectedItem.price * data.quantity,
          shippingAddress: {
            fullName: user?.fullName,
            phone: user?.phone,
            ...data.address
          },
          notes: data.note
        }).unwrap();
        
        // Rediriger vers la page des achats où l'utilisateur pourra cliquer sur "Payer"
        navigate("/user/purchases");
      } else {
        const isPro = !!selectedItem.professionalId;
        
        // Formater la date en YYYY-MM-DD pour éviter les décalages de fuseau horaire
        let formattedDate = data.date;
        if (data.date instanceof Date) {
          const y = data.date.getFullYear();
          const m = String(data.date.getMonth() + 1).padStart(2, '0');
          const d = String(data.date.getDate()).padStart(2, '0');
          formattedDate = `${y}-${m}-${d}`;
        }

        await createQuoteRequest({
          companyId: !isPro ? (selectedItem.companyId?._id || selectedItem.companyId) : null,
          professionalId: isPro ? (selectedItem.professionalId?._id || selectedItem.professionalId) : null,
          bookingServiceId: selectedItem._id,
          bookingDate: formattedDate,
          bookingTimeSlot: data.time,
          notes: data.note,
          clientPhone: data.address?.phone || data.phone,
          clientName: user?.fullName || user?.companyName || "Client",
          clientEmail: user?.email || "",
        }).unwrap();
        setQuoteSuccess(true);
        setTimeout(() => setQuoteSuccess(false), 3000);
      }
      setSelectedItem(null);
    } catch (err) {
      alert(err.data?.message || "Une erreur est survenue");
    }
  };

  const handleLogout = () => {
    dispatch(logOut());
    dispatch(apiSlice.util.resetApiState());
    navigate("/auth/login");
  };

  return (
    <div style={p.root}>
      <Header
        user={user}
        onProfileClick={() => navigate("/user/profile")}
        onLogout={handleLogout}
        onCompanyClick={hasCompanyAccess ? () => navigate("/company/stats") : null}
        onHomeClick={() => {
          setActiveTab("feed");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onCartClick={() => setIsCartOpen(true)}
        cartItemsCount={cartItemsCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {isCartOpen && <Cart onClose={() => setIsCartOpen(false)} />}
      <div style={p.layout}>
        <main style={p.main}>

          <div style={p.feedScroll}>
            {activeTab === "feed" && (
              <Feed
                setActiveTab={setActiveTab}
                onAction={(item, type) => {
                  if (type === 'product') {
                    setProductForDetail(item);
                    setSelectedImg(item.imagesProduct?.[0] || null);
                  } else {
                    setServiceForDetail(item);
                    setSelectedImg(item.imagesServices?.[0] || null);
                  }
                }}
                followedProducts={followedProducts}
                followedServices={followedServices}
                feedData={feedData}
                isLoadingFeed={isLoadingFeed}
                isFetchingFeed={isFetchingFeed}
                refetchFeed={refetchFeed}
                page={page}
                setPage={setPage}
              />
            )}
            {activeTab === "services" && (
              <AllServices onAction={(item) => {
                setServiceForDetail(item);
                setSelectedImg(item.imagesServices?.[0] || null);
              }} />
            )}
            {activeTab === "products" && (
              <AllProducts onAction={(item) => {
                setProductForDetail(item);
                setSelectedImg(item.imagesProduct?.[0] || null);
              }} />
            )}
            {activeTab === "societes" && (
              <CompaniesExplorer />
            )}
            {activeTab === "pros" && (
              <ProfessionalsExplorer />
            )}
          </div>
        </main>
        {activeTab !== "societes" && activeTab !== "pros" && (
          <aside className="no-scrollbar" style={p.rightSidebar}>
            <SuggestedCompanies onSeeMore={() => setActiveTab("societes")} />
          </aside>
        )}
      </div>

      {productForDetail && (
        <ProductDetail
          product={productForDetail}
          onClose={() => setProductForDetail(null)}
          onOrder={(p) => handleAction(p, 'product')}
        />
      )}

      {serviceForDetail && (
        <ServiceDetail
          service={serviceForDetail}
          onClose={() => setServiceForDetail(null)}
          onReserve={handleServiceReserve}
        />
      )}

      {selectedItem && (
        <ActionModal
          type={actionType}
          item={selectedItem}
          prefilledData={prefilledData}
          user={user}
          onClose={() => {
            setSelectedItem(null);
            setPrefilledData(null);
          }}
          onSubmit={handleSubmitAction}
          isLoading={isOrdering || isReserving || isPaying || isRequestingQuote}
        />
      )}

      {quoteSuccess && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#10b981', color: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 3000, display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeInUp 0.3s' }}>
          <CheckCircle2 size={20} />
          <span>Demande envoyée, veuillez attendre le devis !</span>
        </div>
      )}
      {/*style pour les carousels produits et services*/}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .carousel-card:hover .action-overlay { opacity: 1 !important; }
        .grid-card:hover .grid-overlay { opacity: 1 !important; }
        .carousel-card:hover img { transform: scale(1.05); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

// Styles
//css des page fil d'actualité
const p = {
  root: { minHeight: "100vh", background: "#f0f4f8" },
  layout: {
    maxWidth: 1250, margin: "0 auto",
    paddingTop: 86, paddingBottom: 40,
    paddingLeft: 16, paddingRight: 16,
    display: "flex", gap: 34, alignItems: "flex-start",
  },
  main: { flex: 1, minWidth: 0 },
  tabs: {
    display: "flex", gap: "8px", marginBottom: "16px",
    background: "#fff", padding: "6px", borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  tab: {
    flex: 1, padding: "10px", border: "none", background: "none",
    color: "#64748b", fontWeight: "700", cursor: "pointer",
    fontSize: "13px", display: "flex", alignItems: "center",
    justifyContent: "center", gap: "8px", borderRadius: "8px", transition: "0.2s",
  },
  tabActive: {
    flex: 1, padding: "10px", background: "#eff6ff", border: "none",
    color: "#1E3A5F", fontWeight: "700", cursor: "pointer",
    fontSize: "13px", display: "flex", alignItems: "center",
    justifyContent: "center", gap: "8px", borderRadius: "8px",
  },
  feedScroll: { display: "flex", flexDirection: "column", gap: 20 },
  rightSidebar: { 
    width: 260, 
    flexShrink: 0, 
    position: "sticky", 
    top: 86,
    height: "max-content",
    maxHeight: "calc(100vh - 106px)",
    overflowY: "auto"
  },
};
//css des page detail produit et service
const pd = {
  overlay: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { background: '#fff', width: '100%', maxWidth: '1100px', borderRadius: '12px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
  closeBtn: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', zIndex: 10 },
  container: { display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '30px', padding: '40px', maxHeight: '90vh', overflowY: 'auto' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  mainImgBox: { width: '100%', height: '400px', background: '#f8fafc', borderRadius: '8px', overflow: 'hidden', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mainImg: { width: '100%', height: '100%', objectFit: 'contain' },
  thumbList: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  thumbBox: { width: '70px', height: '70px', borderRadius: '6px', cursor: 'pointer', overflow: 'hidden', transition: '0.2s' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  midCol: { display: 'flex', flexDirection: 'column', gap: '15px' },
  title: { fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0, lineHeight: 1.3 },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: '15px' },
  currentPrice: { fontSize: '28px', fontWeight: '800', color: '#1e293b' },
  statusRow: { display: 'flex', gap: '20px', alignItems: 'center' },
  status: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#10b981' },
  divider: { height: '1px', background: '#e2e8f0', margin: '5px 0' },
  qtySection: { display: 'flex', alignItems: 'center', gap: '20px' },
  qtyLabel: { fontSize: '13px', fontWeight: '700', color: '#1e293b' },
  qtyBox: { display: 'flex', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' },
  qtyBtn: { width: '32px', height: '32px', background: '#fff', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' },
  qtyInput: { width: '40px', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', background: '#fff' },
  actionRow: { display: 'flex', gap: '15px', marginTop: '10px' },
  buyBtn: { flex: 1, padding: '14px', background: '#24416b', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase' },
  cartBtn: { flex: 1, padding: '14px', background: '#fff', color: '#24416b', border: '1px solid #24416b', borderRadius: '30px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase' },
  overview: { marginTop: '20px' },
  overviewTitle: { fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: '0 0 10px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sellerCard: { background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9' },
  sellerHeader: { display: 'flex', gap: '12px', marginBottom: '20px' },
  sellerLogo: { width: '50px', height: '50px', borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', overflow: 'hidden' },
  logo: { width: '100%', height: '100%', objectFit: 'cover' },
  sellerName: { fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' },
  sellerRating: { display: 'flex', alignItems: 'center', gap: '2px' },
  ratingCount: { fontSize: '12px', color: '#94a3b8', marginLeft: '5px' },
  visitBtn: { width: '100%', padding: '10px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  shippingInfo: { padding: '10px', display: 'flex', flexDirection: 'column', gap: '15px' },
};

export default UserDashboard;