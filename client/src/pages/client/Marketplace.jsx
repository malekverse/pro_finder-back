import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { 
  ShoppingBag, Package, Star, ArrowUpRight, CheckCircle2, 
  Home as HomeIcon, Building2, Briefcase, Store, Search, ChevronDown, LogOut, User, CreditCard, FileText
} from "lucide-react";
import { useGetAllProductsQuery } from "../../redux/features/products/productApiSlice";
import { useGetAllServicesQuery } from "../../redux/features/company/companyServiceApiSlice";
import { toImageUrl } from "../../utils/imageUtils";
import ProductDetail from "../../components/dashboard/client/ProductDetail";
import ServiceDetail from "../../components/dashboard/client/ServiceDetail";

const Header = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div style={h.bar}>
      <div style={{ ...h.brand, cursor: 'pointer' }} onClick={() => navigate("/")}>
        <div style={h.brandDot} />
        <span style={h.brandName}>ProFinder</span>
      </div>

      <div style={h.nav}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{ ...h.navBtn, color: "#64748b" }}
        >
          <HomeIcon size={18} /><span style={h.navLabel}>Accueil</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/marketplace")}
          style={{ ...h.navBtn, color: "#1E3A5F", borderBottom: "2px solid #1E3A5F" }}
        >
          <Store size={18} /><span style={h.navLabel}>Marketplace</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/", { state: { tab: 'companies' } })}
          style={{ ...h.navBtn, color: "#64748b" }}
        >
          <Building2 size={18} /><span style={h.navLabel}>Sociétés</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/", { state: { tab: 'professionals' } })}
          style={{ ...h.navBtn, color: "#64748b" }}
        >
          <Briefcase size={18} /><span style={h.navLabel}>Professionnels</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {!user ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/auth/signup" style={h.authBtnSignup}>
              S'inscrire
            </Link>
            <Link to="/auth/login" style={h.authBtnLogin}>
              Connexion
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <button 
                onClick={() => navigate("/user/dashboard")}
                style={{ ...h.navBtn, color: "#64748b", padding: '8px 12px' }}
              >
                Tableau de bord
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Marketplace = () => {
  const [view, setView] = useState("services"); // "services" or "products"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const { data: allProducts = [], isLoading: productsLoading } = useGetAllProductsQuery();
  const { data: allServices = [], isLoading: servicesLoading } = useGetAllServicesQuery();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const isLoading = view === "services" ? servicesLoading : productsLoading;
  const rawItems = view === "services" ? allServices : allProducts;

  const items = rawItems.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.companyId?.companyName || item.professionalId?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCardClick = (item, type) => {
    if (type === "SERVICE") {
      setSelectedService(item);
    } else {
      setSelectedProduct(item);
    }
  };

  const handleOrder = () => {
    if (!user) {
      navigate("/auth/login", { state: { from: "/marketplace" } });
    } else {
      navigate("/user/dashboard");
    }
  };

  const handleReserve = () => {
    if (!user) {
      navigate("/auth/login", { state: { from: "/marketplace" } });
    } else {
      navigate("/user/dashboard");
    }
  };

  return (
    <div style={m.page}>
      <Header user={user} />
      
      <div style={m.content}>
        {/* Header Section */}
        <div style={m.hero}>
          <div style={m.heroLeft}>
            <h1 style={m.title}>
              La <span style={m.titleAccent}>Marketplace</span> B2B
            </h1>
            <div style={m.searchContainer}>
              <Search size={20} color="#94a3b8" />
              <input 
                type="text" 
                placeholder={`Rechercher des ${view === "services" ? "services" : "produits"}...`}
                style={m.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div style={m.toggleContainer}>
            <button 
              style={{ ...m.toggleBtn, ...(view === "services" ? m.toggleBtnActive : {}) }}
              onClick={() => { setView("services"); setSearchQuery(""); }}
            >
              <FileText size={18} /> Services
            </button>
            <button 
              style={{ ...m.toggleBtn, ...(view === "products" ? m.toggleBtnActive : {}) }}
              onClick={() => { setView("products"); setSearchQuery(""); }}
            >
              <Package size={18} /> Produits
            </button>
          </div>
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div style={m.loading}>Chargement...</div>
        ) : items.length === 0 ? (
          <div style={m.noResults}>
            <Search size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <p>Aucun résultat trouvé pour "{searchQuery}"</p>
          </div>
        ) : (
          <div style={m.grid}>
            {items.map((item) => (
              <ItemCard 
                key={item._id} 
                item={item} 
                type={view === "services" ? "SERVICE" : "PRODUIT"}
                onClick={() => handleCardClick(item, view === "services" ? "SERVICE" : "PRODUIT")}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetail 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onOrder={handleOrder}
        />
      )}

      {selectedService && (
        <ServiceDetail 
          service={selectedService} 
          onClose={() => setSelectedService(null)} 
          onReserve={handleReserve}
        />
      )}
    </div>
  );
};

const ItemCard = ({ item, type, onClick }) => {
  const navigate = useNavigate();
  const imageUrl = type === "SERVICE" 
    ? (item.imagesServices?.[0] ? toImageUrl(item.imagesServices[0]) : null)
    : (item.imagesProduct?.[0] ? toImageUrl(item.imagesProduct[0]) : null);

  const providerName = item.companyId?.companyName || item.professionalId?.fullName || "Prestataire";
  const rating = 4.0 + Math.random() * 1.0;
  const unit = type === "SERVICE" ? "/ heure" : "/ unité";

  return (
    <div style={c.card} onClick={onClick}>
      <div style={c.imageContainer}>
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} style={c.image} />
        ) : (
          <div style={c.imagePlaceholder}>
            {type === "SERVICE" ? <Briefcase size={32} color="#cbd5e1" /> : <Package size={32} color="#cbd5e1" />}
          </div>
        )}
        <div style={c.typeBadge}>{type}</div>
        <div style={c.arrowIcon}>
          <ArrowUpRight size={16} color="#64748b" />
        </div>
      </div>
      
      <div style={c.info}>
        <div style={c.headerRow}>
          <h3 style={c.name}>{item.name}</h3>
        </div>
        
        <div style={c.providerRow}>
          <span style={c.providerName}>{providerName}</span>
          <CheckCircle2 size={12} color="#3b82f6" />
        </div>
        
        <div style={c.footer}>
          <div style={c.priceInfo}>
            <span style={c.priceLabel}>PRIX FIXE</span>
            <div style={c.priceValue}>
              <span style={c.priceAmount}>{item.price || "0"} DT</span>
              <span style={c.priceUnit}>{unit}</span>
            </div>
          </div>
          
          <button 
            style={c.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {type === "SERVICE" ? "Réserver" : "Acheter"}
          </button>
        </div>
      </div>
    </div>
  );
};

const h = {
  bar: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    height: 70, background: "#fff",
    borderBottom: "1px solid #e9eef5",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 40px",
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandDot: { width: 12, height: 12, borderRadius: "50%", background: "#1E3A5F" },
  brandName: { fontWeight: 800, fontSize: 22, color: "#1E3A5F", letterSpacing: "-0.5px" },
  nav: { display: "flex", gap: 10 },
  navBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    background: "none", border: "none", cursor: "pointer",
    color: "#64748b", padding: "10px 20px", borderBottom: "2px solid transparent",
    transition: "all 0.15s",
  },
  navLabel: { fontSize: 12, fontWeight: 600 },
  authBtnLogin: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 24px', borderRadius: '10px',
    background: '#1E3A5F', color: '#fff',
    fontWeight: '700', fontSize: '14px', textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(30, 58, 95, 0.25)', transition: 'all 0.2s'
  },
  authBtnSignup: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 24px', borderRadius: '10px',
    background: '#fff', color: '#1E3A5F',
    fontWeight: '700', fontSize: '14px', textDecoration: 'none',
    border: '2px solid #1E3A5F', transition: 'all 0.2s'
  }
};

const m = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    paddingTop: 100,
    paddingBottom: 60,
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 20px",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  heroLeft: {
    maxWidth: 600,
  },
  title: {
    fontSize: 42,
    fontWeight: 900,
    color: "#0f172a",
    margin: "0 0 16px",
    lineHeight: 1.1,
  },
  titleAccent: {
    color: "#3b82f6",
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    padding: "12px 20px",
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    marginTop: 20,
    width: "100%",
    maxWidth: 500,
  },
  searchInput: {
    flex: 1,
    border: "none",
    background: "none",
    outline: "none",
    fontSize: 16,
    color: "#1e293b",
    fontWeight: 500,
  },
  subtitle: {
    fontSize: 18,
    color: "#64748b",
    lineHeight: 1.6,
    margin: 0,
  },
  toggleContainer: {
    display: "flex",
    background: "#fff",
    padding: 6,
    borderRadius: 14,
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  toggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 24px",
    borderRadius: 10,
    border: "none",
    background: "none",
    color: "#64748b",
    fontWeight: 700,
    cursor: "pointer",
    transition: "0.2s",
  },
  toggleBtnActive: {
    background: "#f1f5f9",
    color: "#3b82f6",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 20,
  },
  loading: {
    textAlign: "center",
    padding: 100,
    fontSize: 18,
    color: "#64748b",
  },
  noResults: {
    textAlign: "center",
    padding: "80px 20px",
    fontSize: 18,
    color: "#64748b",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  }
};

const c = {
  card: {
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
    border: "1px solid #f1f5f9",
    transition: "0.3s",
    cursor: "pointer",
  },
  imageContainer: {
    position: "relative",
    height: 180,
    background: "#f8fafc",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    background: "#fff",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 0.5,
    color: "#1e293b",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  arrowIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  info: {
    padding: 16,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: 800,
    color: "#1e293b",
    margin: 0,
    lineHeight: 1.3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
   providerRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  providerName: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 600,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: 800,
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  priceValue: {
    display: "flex",
    alignItems: "baseline",
    gap: 2,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 900,
    color: "#1e293b",
  },
  priceUnit: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
  },
  actionBtn: {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    transition: "0.2s",
    boxShadow: "0 4px 10px rgba(59, 130, 246, 0.2)",
  }
};

export default Marketplace;
