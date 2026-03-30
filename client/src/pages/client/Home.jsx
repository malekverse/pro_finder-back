import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logOut } from "../../redux/features/auth/authSlice";
import { apiSlice } from "../../redux/app/api/apiSlice";
import { useGetPublicFeedQuery } from "../../redux/features/posts/postApiSlice";
import {
  useGetSuggestedCompaniesQuery,
  useFollowCompanyMutation,
  useSearchCompaniesQuery,
  useGetCountriesQuery,
  useGetRegionsQuery,
  useGetCitiesByRegionQuery,
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
  useGetServicesBySubQuery,
  useGetRecommendedCompaniesQuery,
} from "../../redux/features/company/companyApiSlice";
import PostCard from "../../components/posts/PostCard";
import {
  Loader, Users, ChevronDown, LogOut, Bell,
  Home as HomeIcon, User, Newspaper, Building2, MapPin, Search, X,
  LogIn, UserPlus, Briefcase, Tag, ChevronRight, Heart, Wrench, Zap, Store, Star
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

const Header = ({ user, onProfileClick, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const initials = user?.fullName
    ? user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div style={h.bar}>
      <div style={h.brand} onClick={() => navigate("/")} >
        <div style={h.brandDot} />
        <span style={h.brandName}>ProFinder</span>
      </div>
      
      <div style={h.nav}>
        <button style={{ ...h.navBtn, color: "#1E3A5F", borderBottom: "2px solid #1E3A5F" }}>
          <HomeIcon size={18} /><span style={h.navLabel}>Accueil</span>
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
          <div style={{ position: "relative" }}>
            <button style={h.profileBtn} onClick={() => setMenuOpen((v) => !v)}>
              {user?.avatarUrl
                ? <img src={toImageUrl(user.avatarUrl)} alt="avatar" style={h.avatar} />
                : <div style={h.avatarFallback}>{initials}</div>}
              <div style={h.profileInfo}>
                <span style={h.profileName}>{user?.fullName || "Mon profil"}</span>
                <span style={h.profileSub}>Connecté</span>
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
                  <div style={h.dropDivider} />
                  <button style={{ ...h.dropItem, color: "#dc2626" }} onClick={() => { setMenuOpen(false); onLogout(); }}>
                    <LogOut size={15} color="#dc2626" /> Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CompanySearchBar = ({ onFilterChange }) => {
  const navigate = useNavigate();
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [service, setService] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: countries = [] } = useGetCountriesQuery();
  const { data: regionsData } = useGetRegionsQuery(country, { skip: !country });
  const regions = regionsData?.regions || [];
  const { data: cities = [] } = useGetCitiesByRegionQuery(region, { skip: !region });

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: subCategories = [] } = useGetSubCategoriesQuery(category, { skip: !category });
  const { data: services = [] } = useGetServicesBySubQuery(subCategory, { skip: !subCategory });

  const handleSearch = () => {
    setIsSearching(true);
    const filters = {
      country,
      region,
      city,
      category,
      subCategory,
      service
    };
    onFilterChange(filters);
    setTimeout(() => setIsSearching(false), 800);
  };

  const quickTags = [
    { label: "Médecins", icon: <Heart size={14} color="#ef4444" />, name: "Santé" },
    { label: "Plombiers", icon: <Wrench size={14} />, name: "Maison" },
    { label: "Avocats", icon: <Briefcase size={14} />, name: "Juridique" },
    { label: "Électriciens", icon: <Zap size={14} color="#fea809ff" />, name: "maison" },
    { label: "Transport", icon: <Store size={14} />, name: "transport" },
  ];

  const handleQuickTagClick = (tagName) => {
    // Trouver la catégorie correspondante dans la liste chargée depuis la DB
    const found = categories.find(c => 
      c.name.toLowerCase().includes(tagName.toLowerCase()) || 
      tagName.toLowerCase().includes(c.name.toLowerCase())
    );
    
    if (found) {
      setCategory(found._id);
      setSubCategory("");
      setService("");
      // Déclencher la recherche immédiatement avec cette catégorie
      onFilterChange({
        category: found._id,
        subCategory: "",
        service: "",
        country,
        region,
        city
      });
    }
  };

  return (
    <div style={sr.heroContainer}>
      <h1 style={sr.heroTitle}>Recherchez un professionnel <strong>ou une société...</strong></h1>
      
      <div style={sr.searchContainer}>
        {/* LIGNE 1 : TAXONOMIE */}
        <div style={sr.searchBarRow}>
          <div style={sr.filterGroup}>
            <Tag size={18} color="#1E3A5F" />
            <select style={sr.select} value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(""); setService(""); }}>
              <option value="">Toutes les catégories</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} color="#94a3b8" />
          </div>
          <div style={sr.divider} />
          <div style={sr.filterGroup}>
            <select style={sr.select} value={subCategory} onChange={(e) => { setSubCategory(e.target.value); setService(""); }} disabled={!category}>
              <option value="">Toutes les sous-catégories</option>
              {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <ChevronDown size={14} color="#94a3b8" />
          </div>
          <div style={sr.divider} />
          <div style={sr.filterGroup}>
            <select style={sr.select} value={service} onChange={(e) => setService(e.target.value)} disabled={!subCategory}>
              <option value="">Tous les services</option>
              {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <ChevronDown size={14} color="#94a3b8" />
          </div>
        </div>

        {/* LIGNE 2 : GÉOGRAPHIE */}
        <div style={sr.searchBarRow}>
          <div style={sr.filterGroup}>
            <MapPin size={18} color="#1E3A5F" />
            <select style={sr.select} value={country} onChange={(e) => { setCountry(e.target.value); setRegion(""); setCity(""); }}>
              <option value="">Tous les pays</option>
              {countries.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} color="#94a3b8" />
          </div>
          <div style={sr.divider} />
          <div style={sr.filterGroup}>
            <select style={sr.select} value={region} onChange={(e) => { setRegion(e.target.value); setCity(""); }} disabled={!country}>
              <option value="">Toutes les régions</option>
              {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
            <ChevronDown size={14} color="#94a3b8" />
          </div>
          <div style={sr.divider} />
          <div style={sr.filterGroup}>
            <select style={sr.select} value={city} onChange={(e) => setCity(e.target.value)} disabled={!region}>
              <option value="">Toutes les villes</option>
              {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} color="#94a3b8" />
          </div>

          <button style={sr.searchBtn} onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader size={18} className="animate-spin" /> : "Rechercher"}
          </button>
        </div>
      </div>

      <div style={sr.quickTags}>
        {quickTags.map((tag, idx) => (
          <button key={idx} style={sr.tagBtn} onClick={() => handleQuickTagClick(tag.name || tag.label)}>
            {tag.icon}
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const SuggestedCompanies = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.account);
  const { data: suggestions = [], isLoading } = useGetSuggestedCompaniesQuery(undefined, { pollingInterval: 10000 });
  const [followCompany, { isLoading: following }] = useFollowCompanyMutation();
  const [followedIds, setFollowedIds] = useState([]);

  const handleFollow = async (companyId) => {
    if (!user) {
        navigate("/auth/login");
        return;
    }
    const isFollowed = followedIds.includes(companyId);
    try {
      await followCompany({ companyId, isFollowed }).unwrap();
      setFollowedIds((prev) =>
        isFollowed ? prev.filter((id) => id !== companyId) : [...prev, companyId]
      );
    } catch (err) { console.error(err); }
  };


};

const RecommendedCompanies = () => {
  const { data: recommended = [], isLoading } = useGetRecommendedCompaniesQuery();
  const navigate = useNavigate();

  if (isLoading || recommended.length === 0) return null;

  return (
    <div style={r.section}>
      <div style={r.header}>
        <h2 style={r.title}>Sociétés Recommandées</h2>
        <button style={r.moreBtn} onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })}>
          Voir plus <ChevronRight size={14} />
        </button>
      </div>
      <div style={r.grid}>
        {recommended.map((company) => (
          <div key={company._id} style={r.card} onClick={() => navigate(`/user/company/${company._id}`)}>
            <div style={r.logoBox}>
              {company.logoUrl 
                ? <img src={toImageUrl(company.logoUrl)} alt="" style={r.logo} />
                : <Building2 size={24} color="#94a3b8" />
              }
            </div>
            <div style={r.info}>
              <h4 style={r.companyName}>{company.companyName}</h4>
              <div style={r.ratingRow}>
                <div style={r.stars}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={12} fill={s <= Math.round(company.averageRating) ? "#fbbf24" : "none"} color={s <= Math.round(company.averageRating) ? "#fbbf24" : "#cbd5e1"} />
                  ))}
                </div>
                <span style={r.cityText}>{company.city || "Tunisie"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CompanyFeed = ({ filters }) => {
  const { data: companies = [], isLoading, isFetching } = useSearchCompaniesQuery(filters);

  if (isLoading) return (
    <div style={f.center}>
      <Loader size={28} color="#1E3A5F" style={{ animation: "spin 1s linear infinite" }} />
      <p style={f.loadingText}>Recherche des entreprises...</p>
    </div>
  );

  if (companies.length === 0) return (
    <div style={f.empty}>
      <Building2 size={44} color="#cbd5e1" style={{ marginBottom: 16 }} />
      <p style={f.emptyTitle}>Aucune entreprise trouvée</p>
      <p style={f.emptyText}>
        Vérifiez vos filtres ou assurez-vous que les entreprises ont été <strong>validées par l'administrateur</strong> dans le dashboard de modération.
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {companies.map((company) => (
        <div key={company._id} style={c.listCard}>
          <div style={c.listHeader}>
            <div style={c.listLogoWrap}>
              {company.logoUrl 
                ? <img src={toImageUrl(company.logoUrl)} alt={company.companyName} style={c.listLogo} />
                : <div style={c.listLogoFallback}><Building2 size={20} color="#94a3b8" /></div>
              }
            </div>
            <div style={c.listInfo}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={c.listName}>{company.companyName}</h3>
                  <p style={c.listMeta}>
                    <MapPin size={12} /> {company.city || "Tunisie"}
                  </p>
                </div>
                <div style={c.listRating}>
                  <div style={c.listStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={14} fill={s <= Math.round(company.rating?.average || 0) ? "#fbbf24" : "none"} color={s <= Math.round(company.rating?.average || 0) ? "#fbbf24" : "#cbd5e1"} />
                    ))}
                  </div>
                  {company.rating?.count > 0 && (
                    <span style={c.listReviewCount}>{company.rating.count} avis</span>
                  )}
                </div>
              </div>
            </div>
            <div style={c.listActions}>
              <Link to={`/user/company/${company._id}`} style={c.listBtn}>
                Voir Profil
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.account);
  const [filters, setFilters] = useState({});

  const handleLogout = () => {
    dispatch(logOut());
    dispatch(apiSlice.util.resetApiState());
    navigate("/auth/login");
  };

  return (
    <div style={p.root}>
      <Header user={user} onProfileClick={() => navigate("/profile")} onLogout={handleLogout} />
      <div style={p.layout}>
        <div style={p.searchWrap}>
          <CompanySearchBar onFilterChange={(f) => setFilters(f)} />
        </div>
        
        <div style={p.contentWrapper}>
          <main style={p.main}>
            <RecommendedCompanies />
            
            <div style={p.feedHeader}>
              <Search size={18} color="#1E3A5F" />
              <h2 style={p.feedTitle}>Résultats de Recherche</h2>
            </div>
            <div style={p.feedScroll}>
              <CompanyFeed filters={filters} />
            </div>
          </main>
          <aside style={p.rightSidebar}><SuggestedCompanies /></aside>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
  profileBtn: {
    display: "flex", alignItems: "center", gap: 12,
    background: "none", border: "none", cursor: "pointer",
    padding: "8px 14px", borderRadius: 12, border: '1px solid #e2e8f0'
  },
  avatar: { width: 40, height: 40, borderRadius: "50%", objectFit: "cover" },
  avatarFallback: {
    width: 40, height: 40, borderRadius: "50%",
    background: "#1E3A5F", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 14,
  },
  profileInfo: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  profileName: { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  profileSub: { fontSize: 12, color: "#10b981", fontWeight: 600 },
  overlay: { position: "fixed", inset: 0, zIndex: 10 },
  dropdown: {
    position: "absolute", right: 0, top: 60,
    background: "#fff", border: "1px solid #e9eef5",
    borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    zIndex: 11, minWidth: 220, overflow: "hidden",
  },
  dropItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "14px 20px", width: "100%",
    background: "none", border: "none", cursor: "pointer",
    color: "#334155", fontSize: 15, fontWeight: 600, textAlign: "left",
  },
  dropDivider: { height: 1, background: "#f1f5f9" },
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

const r = {
  section: { marginBottom: 40 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 },
  moreBtn: { display: 'flex', alignItems: 'center', gap: 5, color: '#3b82f6', fontSize: 14, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  card: { background: '#fff', padding: 15, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', gap: 15, alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  logoBox: { width: 60, height: 60, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  logo: { width: '100%', height: '100%', objectFit: 'cover' },
  info: { flex: 1, minWidth: 0 },
  companyName: { fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 8 },
  stars: { display: 'flex', gap: 2 },
  cityText: { fontSize: 12, color: '#64748b', fontWeight: 500 },
};

const c = {
  listCard: { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  listHeader: { display: 'flex', padding: 20, gap: 20, alignItems: 'center' },
  listLogoWrap: { width: 80, height: 80, borderRadius: 14, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '1px solid #f1f5f9' },
  listLogo: { width: '100%', height: '100%', objectFit: 'cover' },
  listLogoFallback: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  listInfo: { flex: 1, minWidth: 0 },
  listName: { fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' },
  listMeta: { fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, margin: 0 },
  listRating: { textAlign: 'right' },
  listStars: { display: 'flex', gap: 2, marginBottom: 4, justifyContent: 'flex-end' },
  listReviewCount: { fontSize: 12, color: '#fbbf24', fontWeight: 700, background: '#fef3c7', padding: '2px 8px', borderRadius: 10 },
  listActions: { paddingLeft: 20, borderLeft: '1px solid #f1f5f9' },
  listBtn: { display: 'inline-flex', alignItems: 'center', background: '#3b82f6', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' },
};

const p = {
  root: { minHeight: "100vh", background: "#f8fafc" },
  layout: {
    maxWidth: 1200, margin: "0 auto",
    paddingTop: 90, paddingBottom: 60,
    paddingLeft: 20, paddingRight: 20,
    display: "flex", flexDirection: 'column', gap: 30
  },
  contentWrapper: {
    display: 'flex',
    gap: 30,
    alignItems: 'flex-start'
  },
  main: { flex: 1, minWidth: 0 },
  searchWrap: { 
    marginBottom: 40,
    padding: '40px',
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    borderRadius: '24px'
  },
  feedHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  feedTitle: { fontWeight: 800, fontSize: 20, color: "#0f172a", margin: 0 },
  feedScroll: { display: 'flex', flexDirection: 'column', gap: 20 },
  rightSidebar: { width: 320, flexShrink: 0, position: "sticky", top: 90 },
};

const sr = {
  heroContainer: {
    padding: '40px 0',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '30px'
  },
  heroTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1E3A5F',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto'
  },
  searchBarRow: {
    display: 'flex',
    alignItems: 'center',
    background: '#fff',
    borderRadius: '14px',
    padding: '6px 10px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    width: '100%',
    minHeight: '54px'
  },
  filterGroup: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 12px',
    position: 'relative',
    minWidth: 0
  },
  select: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1E3A5F',
    background: 'transparent',
    cursor: 'pointer',
    appearance: 'none',
    paddingRight: '15px',
    width: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  divider: {
    width: '1px',
    height: '24px',
    background: '#e2e8f0',
    flexShrink: 0
  },
  searchBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 24px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)',
    marginLeft: '5px',
    flexShrink: 0
  },
  quickTags: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '10px'
  },
  tagBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '12px',
    background: '#24416b',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 10px rgba(36, 65, 107, 0.2)'
  }
};

const f = {
  center: { display: "flex", flexDirection: "column", alignItems: "center", gap: 15, padding: "80px 0" },
  loadingText: { color: "#94a3b8", fontSize: 15, margin: 0, fontWeight: 500 },
  empty: {
    background: "#fff", border: "1px dashed #e2e8f0",
    borderRadius: 20, padding: "60px 40px", textAlign: "center",
  },
  emptyTitle: { fontWeight: 800, fontSize: 19, color: "#1e293b", margin: "0 0 10px" },
  emptyText: { fontSize: 15, color: "#94a3b8", margin: "0 auto", lineHeight: 1.7, maxWidth: 300 },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 40 },
  pageBtn: {
    padding: "10px 24px", background: "#1E3A5F", color: "#fff",
    border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 10px rgba(30, 58, 95, 0.15)'
  },
  pageInfo: { fontSize: 14, color: "#64748b", fontWeight: 700 },
};

const sg = {
  card: {
    background: "#fff", border: "1px solid #e9eef5",
    borderRadius: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.03)", padding: "24px 20px",
  },
  title: {
    fontWeight: 800, fontSize: 13, color: "#0f172a",
    margin: "0 0 18px", textTransform: "uppercase", letterSpacing: "0.08em",
  },
  loader: { display: "flex", justifyContent: "center", padding: "20px 0" },
  empty: { fontSize: 14, color: "#94a3b8", margin: 0, textAlign: "center", padding: "10px 0" },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  item: { display: "flex", alignItems: "center", gap: 12 },
  logoWrap: { flexShrink: 0, cursor: "pointer" },
  logo: { width: 44, height: 44, borderRadius: 12, objectFit: "cover", border: "1px solid #e9eef5" },
  logoFallback: {
    width: 44, height: 44, borderRadius: 12,
    background: "#f1f5f9", border: "1px solid #e9eef5",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 },
  name: {
    fontSize: 14, fontWeight: 700, color: "#0f172a",
    cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  city: { fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 },
  followBtn: {
    flexShrink: 0, fontSize: 12, fontWeight: 800, padding: "6px 12px",
    background: "#1E3A5F", color: "#fff",
    border: "none", borderRadius: 8, cursor: "pointer",
    transition: "all 0.2s", whiteSpace: "nowrap",
  },
  followBtnActive: { background: "#f1f5f9", color: "#1e293b", border: '1px solid #e2e8f0' },
};

export default Home;
