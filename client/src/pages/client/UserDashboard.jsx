import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logOut } from "../../redux/features/auth/authSlice";
import { apiSlice } from "../../redux/app/api/apiSlice";
import { useGetFollowedFeedQuery } from "../../redux/features/posts/postApiSlice";
import { useGetAllProductsQuery } from "../../redux/features/products/productApiSlice";
import { useGetAllServicesQuery } from "../../redux/features/company/companyServiceApiSlice";
import {
  useGetSuggestedCompaniesQuery,
  useFollowCompanyMutation,
  useSearchCompaniesQuery,
} from "../../redux/features/company/companyApiSlice";
import PostCard from "../../components/posts/PostCard";
import {
  Loader, Users, ChevronDown, LogOut, Bell,
  Home, User, Newspaper, Building2, MapPin, Search, X,
  Package, Wrench, ShoppingBag, Clock, Calendar
} from "lucide-react";

const SERVER_URL = "http://localhost:5000";

const toImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("data:")) return url;
  if (!url.includes("/") && !url.includes("\\") && url.length > 100)
    return `data:image/jpeg;base64,${url}`;
  const clean = url.startsWith("/") ? url.slice(1) : url;
  return `${SERVER_URL}/${clean}`;
};

// Header
const Header = ({ user, onProfileClick, onLogout, onCompanyClick }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user?.fullName
    ? user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div style={h.bar}>
      <div style={h.brand}>
        <div style={h.brandDot} />
        <span style={h.brandName}>ProFinder</span>
      </div>
      <div style={h.nav}>
        <button style={{ ...h.navBtn, color: "#1E3A5F", borderBottom: "2px solid #1E3A5F" }}>
          <Home size={18} /><span style={h.navLabel}>Accueil</span>
        </button>
        <button style={h.navBtn}>
          <Bell size={18} /><span style={h.navLabel}>Notifications</span>
        </button>
      </div>
      <div style={{ position: "relative" }}>
        <button style={h.profileBtn} onClick={() => setMenuOpen((v) => !v)}>
          {user?.avatarUrl
            ? <img src={toImageUrl(user.avatarUrl)} alt="avatar" style={h.avatar} />
            : <div style={h.avatarFallback}>{initials}</div>}
          <div style={h.profileInfo}>
            <span style={h.profileName}>{user?.fullName || "Mon profil"}</span>
            <span style={h.profileSub}>Mon compte</span>
          </div>
          <ChevronDown size={14} color="#94a3b8"
            style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        {menuOpen && (
          <>
            <div style={h.overlay} onClick={() => setMenuOpen(false)} />
            <div style={h.dropdown}>
              <button style={h.dropItem} onClick={() => { setMenuOpen(false); onProfileClick(); }}>
                <User size={15} color="#1E3A5F" /> Mon profil
              </button>

              <button style={h.dropItem} onClick={() => { setMenuOpen(false); navigate("/purchases"); }}>
                <ShoppingBag size={15} color="#1E3A5F" /> Mes Achats
              </button>
              
              {onCompanyClick && (
                <button style={h.dropItem} onClick={() => { setMenuOpen(false); onCompanyClick(); }}>
                  <Building2 size={15} color="#1E3A5F" /> Espace Fournisseur
                </button>
              )}

              <div style={h.dropDivider} />
              <button style={{ ...h.dropItem, color: "#dc2626" }} onClick={() => { setMenuOpen(false); onLogout(); }}>
                <LogOut size={15} color="#dc2626" /> Déconnexion
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Barre de recherche entreprises (RTK Query + debounce)
const CompanySearchBar = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(v.trim());
      if (v.trim()) setOpen(true);
      else setOpen(false);
    }, 350);
  };

 const { data: results = [], isFetching } = useSearchCompaniesQuery({ q: debouncedQ }, {
    skip: !debouncedQ,
  });


  const clear = () => { setQuery(""); setDebouncedQ(""); setOpen(false); };

  const goTo = (id) => { navigate(`/user/company/${id}`); clear(); };

  return (
    <div ref={wrapRef} style={sr.wrap}>
      <div style={sr.inputRow}>
        <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
        <input
          style={sr.input}
          type="text"
          placeholder="Rechercher une entreprise..."
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {isFetching && (
          <Loader size={15} color="#94a3b8" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
        )}
        {query && !isFetching && (
          <button style={sr.clearBtn} onClick={clear}><X size={14} /></button>
        )}
      </div>

      {open && (
        <div style={sr.dropdown}>
          {results.length > 0 ? results.map((c) => {
            const logo = toImageUrl(c.logoUrl);
            return (
              <div
                key={c._id}
                style={sr.item}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                onMouseDown={() => goTo(c._id)}
              >
                {logo
                  ? <img src={logo} alt={c.companyName} style={sr.logo} />
                  : <div style={sr.logoFallback}><Building2 size={14} color="#94a3b8" /></div>}
                <div style={sr.itemInfo}>
                  <span style={sr.itemName}>{c.companyName}</span>
                  {c.city && <span style={sr.itemCity}><MapPin size={10} /> {c.city}</span>}
                </div>
              </div>
            );
          }) : (
            <div style={sr.noResult}>
              {isFetching ? "Recherche..." : `Aucun résultat pour « ${debouncedQ} »`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Suggestions sidebar droite
const SuggestedCompanies = () => {
  const navigate = useNavigate();
  const { data: suggestions = [], isLoading } = useGetSuggestedCompaniesQuery(undefined, { pollingInterval: 5000 });
  const [followCompany, { isLoading: following }] = useFollowCompanyMutation();
  const [followedIds, setFollowedIds] = useState([]);

  const handleFollow = async (companyId) => {
    const isFollowed = followedIds.includes(companyId);
    try {
      await followCompany({ companyId, isFollowed }).unwrap();
      setFollowedIds((prev) =>
        isFollowed ? prev.filter((id) => id !== companyId) : [...prev, companyId]
      );
    } catch (err) { console.error(err); }
  };

   return (
    <div style={sg.card}>
      <p style={sg.title}>Entreprises à suivre</p>
      {isLoading ? (
        <div style={sg.loader}>
          <Loader size={20} color="#1E3A5F" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : suggestions.length === 0 ? (
        <p style={sg.empty}>Aucune suggestion pour l'instant.</p>
      ) : (
        <div style={sg.list}>
          {suggestions.map((company) => {
            const isFollowed = followedIds.includes(company._id);
            const logo = toImageUrl(company.logoUrl);
            return (
              <div key={company._id} style={sg.item}>
                <div style={sg.logoWrap} onClick={() => navigate(`/user/company/${company._id}`)}>
                  {logo
                    ? <img src={logo} alt={company.companyName} style={sg.logo} />
                    : <div style={sg.logoFallback}><Building2 size={16} color="#94a3b8" /></div>}
                </div>
                <div style={sg.info}>
                  <span style={sg.name} onClick={() => navigate(`/user/company/${company._id}`)}>
                    {company.companyName}
                  </span>
                  <span style={sg.city}>
                    <MapPin size={11} />
                    {company.city ? (
                      `${company.city}${company.country ? ', ' + company.country : ''}`
                    ) : "Tunisie"}
                  </span>
                  <span style={sg.city}>
                    <Users size={11} />
                    {company.followersCount ?? 0} abonnés
                  </span>
                </div>
                <button
                  style={{ ...sg.followBtn, ...(isFollowed ? sg.followBtnActive : {}) }}
                  onClick={() => handleFollow(company._id)}
                  disabled={following}
                >
                  {isFollowed ? "Suivi ✓" : "+ Suivre"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Feed
const Feed = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, refetch } = useGetFollowedFeedQuery({ page, limit: 10 }, { pollingInterval: 5000 });
  const posts = data?.posts || [];
  const totalPages = data?.totalPages || 1;

  if (isLoading) return (
    <div style={f.center}>
      <Loader size={28} color="#1E3A5F" style={{ animation: "spin 1s linear infinite" }} />
      <p style={f.loadingText}>Chargement du fil...</p>
    </div>
  );

  if (posts.length === 0) return (
    <div style={f.empty}>
      <Users size={44} color="#cbd5e1" style={{ marginBottom: 16 }} />
      <p style={f.emptyTitle}>Aucune publication pour le moment</p>
      <p style={f.emptyText}>Suivez des entreprises pour voir leurs publications ici.</p>
    </div>
  );

  return (
    <div>
      {posts.map((post) => <PostCard key={post._id} post={post} onDeleted={refetch} />)}
      {totalPages > 1 && (
        <div style={f.pagination}>
          <button style={{ ...f.pageBtn, opacity: page <= 1 ? 0.4 : 1 }}
            disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Précédent</button>
          <span style={f.pageInfo}>{page} / {totalPages}</span>
          <button style={{ ...f.pageBtn, opacity: page >= totalPages ? 0.4 : 1 }}
            disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>Suivant →</button>
        </div>
      )}
    </div>
  );
};

// Page principale
const UserDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const roles = user?.roles || [];
  const hasCompanyAccess = user?.companyId && roles.length > 1;

  const [activeTab, setActiveTab] = useState("feed"); // feed, services, products

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
      />
      <div style={p.layout}>
        <main style={p.main}>
          <div style={p.searchWrap}><CompanySearchBar /></div>
          
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
            {activeTab === "feed" && <Feed />}
            {activeTab === "services" && <AllServices />}
            {activeTab === "products" && <AllProducts />}
          </div>
        </main>
        <aside style={p.rightSidebar}><SuggestedCompanies /></aside>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// All Services Browser
const AllServices = () => {
  const navigate = useNavigate();
  const { data: services = [], isLoading } = useGetAllServicesQuery();

  if (isLoading) return <div style={f.center}><Loader size={28} className="animate-spin" color="#1E3A5F" /></div>;

  return (
    <div style={g.grid}>
      {services.map(s => (
        <div 
          key={s._id} 
          style={g.card} 
          onClick={() => navigate(`/user/company/${s.companyId._id}`, { state: { activeTab: 'services', selectServiceId: s._id } })}
        >
          {s.images?.[0] && <img src={toImageUrl(s.images[0])} alt="" style={g.img} />}
          <div style={g.content}>
            <div style={g.companyName}><Building2 size={12} /> {s.companyId?.companyName}</div>
            <h3 style={g.title}>{s.name}</h3>
            <div style={g.footer}>
              <span style={g.price}>{s.price} €</span>
              <span style={g.meta}><Clock size={12} /> {s.duration} min</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// All Products Browser
const AllProducts = () => {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useGetAllProductsQuery();

  if (isLoading) return <div style={f.center}><Loader size={28} className="animate-spin" color="#1E3A5F" /></div>;

  return (
    <div style={g.grid}>
      {products.map(p => (
        <div 
          key={p._id} 
          style={g.card} 
          onClick={() => navigate(`/user/company/${p.companyId._id}`, { state: { activeTab: 'products', selectProductId: p._id } })}
        >
          {p.images?.[0] && <img src={toImageUrl(p.images[0])} alt="" style={g.img} />}
          <div style={g.content}>
            <div style={g.companyName}><Building2 size={12} /> {p.companyId?.companyName}</div>
            <h3 style={g.title}>{p.name}</h3>
            <div style={g.footer}>
              <span style={g.price}>{p.price} €</span>
              <span style={{ ...g.meta, color: '#16a34a' }}>{p.stock} en stock</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Styles
const h = {
  bar: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    height: 60, background: "#fff",
    borderBottom: "1px solid #e9eef5",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px",
  },
  brand: { display: "flex", alignItems: "center", gap: 8 },
  brandDot: { width: 10, height: 10, borderRadius: "50%", background: "#1E3A5F" },
  brandName: { fontWeight: 800, fontSize: 18, color: "#1E3A5F", letterSpacing: "-0.5px" },
  nav: { display: "flex", gap: 4 },
  navBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    background: "none", border: "none", cursor: "pointer",
    color: "#64748b", padding: "8px 16px", borderBottom: "2px solid transparent",
    transition: "all 0.15s",
  },
  navLabel: { fontSize: 11, fontWeight: 500 },
  profileBtn: {
    display: "flex", alignItems: "center", gap: 10,
    background: "none", border: "none", cursor: "pointer",
    padding: "6px 10px", borderRadius: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: "50%", objectFit: "cover" },
  avatarFallback: {
    width: 36, height: 36, borderRadius: "50%",
    background: "#1E3A5F", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 13,
  },
  profileInfo: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  profileName: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  profileSub: { fontSize: 11, color: "#94a3b8" },
  overlay: { position: "fixed", inset: 0, zIndex: 10 },
  dropdown: {
    position: "absolute", right: 0, top: 50,
    background: "#fff", border: "1px solid #e9eef5",
    borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    zIndex: 11, minWidth: 200, overflow: "hidden",
  },
  dropItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "11px 16px", width: "100%",
    background: "none", border: "none", cursor: "pointer",
    color: "#334155", fontSize: 14, fontWeight: 500, textAlign: "left",
  },
  dropDivider: { height: 1, background: "#f1f5f9" },
};

const p = {
  root: { minHeight: "100vh", background: "#f0f4f8" },
  layout: {
    maxWidth: 1160, margin: "0 auto",
    paddingTop: 76, paddingBottom: 40,
    paddingLeft: 16, paddingRight: 16,
    display: "flex", gap: 24, alignItems: "flex-start",
  },
  main: { flex: 1, minWidth: 0 },
  searchWrap: { marginBottom: 16 },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    background: "#fff",
    padding: "6px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  tab: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "none",
    color: "#64748b",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "8px",
    transition: "0.2s",
  },
  tabActive: {
    flex: 1,
    padding: "10px",
    background: "#eff6ff",
    border: "none",
    color: "#1E3A5F",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "8px",
  },
  feedHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingLeft: 2 },
  feedTitle: { fontWeight: 800, fontSize: 18, color: "#0f172a", margin: 0 },
  feedScroll: {
    maxHeight: "calc(100vh - 180px)",
    overflowY: "auto",
    paddingRight: 4,
    scrollbarWidth: "thin",
    scrollbarColor: "#cbd5e1 transparent",
  },
  rightSidebar: { width: 260, flexShrink: 0, position: "sticky", top: 76 },
};

const sr = {
  wrap: { position: "relative" },
  inputRow: {
    display: "flex", alignItems: "center", gap: 10,
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, padding: "10px 14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  input: {
    flex: 1, border: "none", outline: "none",
    fontSize: 14, color: "#0f172a", background: "transparent",
  },
  clearBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#94a3b8", display: "flex", alignItems: "center", padding: 0, flexShrink: 0,
  },
  dropdown: {
    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
    zIndex: 50, overflow: "hidden",
  },
  item: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", cursor: "pointer", background: "transparent",
  },
  logo: { width: 36, height: 36, borderRadius: 8, objectFit: "cover", border: "1px solid #e9eef5", flexShrink: 0 },
  logoFallback: {
    width: 36, height: 36, borderRadius: 8,
    background: "#f1f5f9", border: "1px solid #e9eef5",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  itemInfo: { display: "flex", flexDirection: "column", gap: 1, flex: 1, minWidth: 0 },
  itemName: { fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  itemCity: { fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 },
  noResult: { padding: "14px 16px", fontSize: 13, color: "#94a3b8", textAlign: "center" },
};

const f = {
  center: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "60px 0" },
  loadingText: { color: "#94a3b8", fontSize: 14, margin: 0 },
  empty: {
    background: "#fff", border: "1px dashed #e2e8f0",
    borderRadius: 14, padding: "48px 30px", textAlign: "center",
  },
  emptyTitle: { fontWeight: 700, fontSize: 17, color: "#1e293b", margin: "0 0 8px" },
  emptyText: { fontSize: 14, color: "#94a3b8", margin: "0 auto", lineHeight: 1.7, maxWidth: 280 },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 24 },
  pageBtn: {
    padding: "8px 20px", background: "#1E3A5F", color: "#fff",
    border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
  },
  pageInfo: { fontSize: 13, color: "#64748b", fontWeight: 600 },
};

const sg = {
  card: {
    background: "#fff", border: "1px solid #e9eef5",
    borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", padding: "18px 16px",
  },
  title: {
    fontWeight: 800, fontSize: 13, color: "#0f172a",
    margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.05em",
  },
  loader: { display: "flex", justifyContent: "center", padding: "12px 0" },
  empty: { fontSize: 13, color: "#94a3b8", margin: 0, textAlign: "center", padding: "8px 0" },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  item: { display: "flex", alignItems: "center", gap: 10 },
  logoWrap: { flexShrink: 0, cursor: "pointer" },
  logo: { width: 38, height: 38, borderRadius: 8, objectFit: "cover", border: "1px solid #e9eef5" },
  logoFallback: {
    width: 38, height: 38, borderRadius: 8,
    background: "#f1f5f9", border: "1px solid #e9eef5",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 },
  name: {
    fontSize: 13, fontWeight: 700, color: "#0f172a",
    cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  city: { fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 },
  followBtn: {
    flexShrink: 0, fontSize: 12, fontWeight: 700, padding: "5px 10px",
    background: "#1E3A5F", color: "#fff",
    border: "none", borderRadius: 6, cursor: "pointer",
    transition: "all 0.2s", whiteSpace: "nowrap",
  },
  followBtnActive: { background: "#e2e8f0", color: "#1e293b" },
};

const g = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e9eef5",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  img: { width: "100%", height: "140px", objectFit: "cover" },
  content: { padding: "12px" },
  companyName: { fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" },
  title: { fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: "15px", fontWeight: "800", color: "#1E3A5F" },
  meta: { fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "3px" },
};

export default UserDashboard;