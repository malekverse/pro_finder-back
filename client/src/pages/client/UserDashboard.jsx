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
import { Newspaper, Package, Wrench } from "lucide-react";

// Components
import Header from "../../components/dashboard/client/Header";
import Feed from "../../components/dashboard/client/Feed";
import AllServices from "../../components/dashboard/client/AllServices";
import AllProducts from "../../components/dashboard/client/AllProducts";
import SuggestedCompanies from "../../components/dashboard/client/SuggestedCompanies";
import ProductDetail from "../../components/dashboard/client/ProductDetail";
import ActionModal from "../../components/dashboard/client/ActionModal";

const UserDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const roles = user?.roles || [];
  const hasCompanyAccess = user?.companyId && roles.length > 1;

  const [activeTab, setActiveTab] = useState("feed"); // feed, services, products
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [productForDetail, setProductForDetail] = useState(null);

  // API Hooks
  const { data: feedData, isLoading: isLoadingFeed, isFetching: isFetchingFeed, refetch: refetchFeed } = useGetFollowedFeedQuery({ page, limit: 10 }, { pollingInterval: 3000 });
  const { data: followedProducts = [] } = useGetFollowedProductsQuery(undefined, { pollingInterval: 3000 });
  const { data: followedServices = [] } = useGetFollowedServicesQuery(undefined, { pollingInterval: 3000 });
  
  const [createOrder, { isLoading: isOrdering }] = useCreateOrderMutation();
  const [createReservation, { isLoading: isReserving }] = useCreateReservationMutation();

  const handleAction = (item, type) => {
    setSelectedItem(item);
    setActionType(type);
    setProductForDetail(null);
  };

  const handleSubmitAction = async (data) => {
    try {
      if (actionType === 'product') {
        await createOrder({
          companyId: selectedItem.companyId?._id || selectedItem.companyId,
          items: [{ productId: selectedItem._id, quantity: data.quantity, price: selectedItem.price }],
          totalPrice: selectedItem.price * data.quantity,
          shippingAddress: {
            fullName: user?.fullName,
            phone: user?.phone,
            ...data.address
          },
          notes: data.note
        }).unwrap();
        alert("Commande effectuée avec succès !");
      } else {
        await createReservation({
          companyId: selectedItem.companyId?._id || selectedItem.companyId,
          serviceId: selectedItem._id,
          date: data.date,
          timeSlot: data.time,
          notes: data.note
        }).unwrap();
        alert("Réservation effectuée avec succès !");
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
        onProfileClick={() => navigate("/profile")} 
        onLogout={handleLogout}
        onCompanyClick={hasCompanyAccess ? () => navigate("/company/stats") : null}
        onHomeClick={() => {
          setActiveTab("feed");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      <div style={p.layout}>
        <main style={p.main}>
          <div style={p.tabs}>
            <button 
              onClick={() => setActiveTab("feed")} 
              style={activeTab === "feed" ? p.tabActive : p.tab}
            >
              <Newspaper size={18} /> Fil d'actualité
            </button>
            <button 
              onClick={() => setActiveTab("services")} 
              style={activeTab === "services" ? p.tabActive : p.tab}
            >
              <Wrench size={18} /> Services
            </button>
            <button 
              onClick={() => setActiveTab("products")} 
              style={activeTab === "products" ? p.tabActive : p.tab}
            >
              <Package size={18} /> Produits
            </button>
          </div>

          <div style={p.feedScroll}>
            {activeTab === "feed" && (
              <Feed 
                setActiveTab={setActiveTab} 
                onAction={(item, type) => {
                  if (type === 'product') setProductForDetail(item);
                  else handleAction(item, type);
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
            {activeTab === "services" && <AllServices onAction={handleAction} />}
            {activeTab === "products" && <AllProducts onAction={(item) => setProductForDetail(item)} />}
          </div>
        </main>
        <aside style={p.rightSidebar}><SuggestedCompanies /></aside>
      </div>

      {productForDetail && (
        <ProductDetail 
          product={productForDetail} 
          onClose={() => setProductForDetail(null)}
          onOrder={(p) => handleAction(p, 'product')}
        />
      )}

      {selectedItem && (
        <ActionModal 
          type={actionType}
          item={selectedItem}
          user={user}
          onClose={() => setSelectedItem(null)}
          onSubmit={handleSubmitAction}
          isLoading={isOrdering || isReserving}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .carousel-card:hover .action-overlay { opacity: 1 !important; }
        .grid-card:hover .grid-overlay { opacity: 1 !important; }
        .carousel-card:hover img { transform: scale(1.05); }
      `}</style>
    </div>
  );
};

// Styles
const p = {
  root: { minHeight: "100vh", background: "#f0f4f8" },
  layout: {
    maxWidth: 1160, margin: "0 auto",
    paddingTop: 76, paddingBottom: 40,
    paddingLeft: 16, paddingRight: 16,
    display: "flex", gap: 24, alignItems: "flex-start",
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
  rightSidebar: { width: 260, flexShrink: 0, position: "sticky", top: 76 },
};

export default UserDashboard;