import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logOut } from "../../redux/features/auth/authSlice";
import { apiSlice } from "../../redux/app/api/apiSlice";
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
  useGetServicesQuery,
  useGetRecommendedCompaniesQuery,
} from "../../redux/features/company/companyApiSlice";
import {
  useGetAllProductsQuery,
} from "../../redux/features/products/productApiSlice";
import {
  useGetAllServicesQuery,
} from "../../redux/features/company/companyServiceApiSlice";
import {
  Loader, Users, ChevronDown, LogOut, Bell,
  Home as HomeIcon, User, Newspaper, Building2, MapPin, Search, X,
  LogIn, UserPlus, Briefcase, Tag, ChevronRight, Heart, Wrench, Zap, Store, Star, Package, ShoppingBag, ChevronLeft, ShieldCheck, CheckCircle2, Clock
} from "lucide-react";

import { toImageUrl } from "../../utils/imageUtils";

const Header = ({ user, onProfileClick, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const initials = user?.fullName
    ? user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div style={h.bar}>
      <div style={{ ...h.brand, cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); navigate("/"); }}>
        <div style={h.brandDot} />
        <span style={h.brandName}>ProFinder</span>
      </div>
      
      <div style={h.nav}>
        <button type="button" style={{ ...h.navBtn, color: "#1E3A5F", borderBottom: "2px solid #1E3A5F" }}>
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
            <button type="button" style={h.profileBtn} onClick={() => setMenuOpen((v) => !v)}>
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
                  <button type="button" style={h.dropItem} onClick={() => { setMenuOpen(false); onProfileClick(); }}>
                    <User size={15} color="#1E3A5F" /> Mon profil
                  </button>
                  <div style={h.dropDivider} />
                  <button type="button" style={{ ...h.dropItem, color: "#dc2626" }} onClick={() => { setMenuOpen(false); onLogout(); }}>
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

  const { data: countries = [] } = useGetCountriesQuery(undefined, { pollingInterval: 3000 });
  const { data: regionsData } = useGetRegionsQuery(country, { skip: !country, pollingInterval: 3000 });
  const regions = regionsData?.regions || [];
  const { data: cities = [] } = useGetCitiesByRegionQuery(region, { skip: !region, pollingInterval: 3000 });

  const { data: categories = [] } = useGetCategoriesQuery(undefined, { pollingInterval: 3000 });
  const { data: subCategories = [] } = useGetSubCategoriesQuery(category, { skip: !category, pollingInterval: 3000 });
  const { data: services = [] } = useGetServicesBySubQuery(subCategory, { skip: !subCategory, pollingInterval: 3000 });

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

  const handleQuickTagClick = (e, tagName) => {
    e.preventDefault();
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

          <button type="button" style={sr.searchBtn} onClick={(e) => { e.preventDefault(); handleSearch(); }} disabled={isSearching}>
            {isSearching ? <Loader size={18} className="animate-spin" /> : "Rechercher"}
          </button>
        </div>
      </div>

      <div style={sr.quickTags}>
        {quickTags.map((tag, idx) => (
          <button key={idx} type="button" style={sr.tagBtn} onClick={(e) => handleQuickTagClick(e, tag.name || tag.label)}>
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

const ProductCarousel = ({ title, products, isLoading, onProductClick }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.account);
  const scrollRef = useRef(null);

  const handleOrder = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    onProductClick(product);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (isLoading) return <div style={r.section}><Loader size={24} className="animate-spin" /></div>;
  if (!products || products.length === 0) return null;

  return (
    <div style={r.section}>
      <div style={r.header}>
        <h2 style={r.title}>{title}</h2>
        <button type="button" style={r.moreBtn}>Voir plus <ChevronRight size={14} /></button>
      </div>
      <div style={{ position: 'relative' }}>
        <button type="button" onClick={(e) => { e.preventDefault(); scroll('left'); }} style={carouselBtnStyle('left')}><ChevronLeft size={20} /></button>
        <div ref={scrollRef} style={carouselContainerStyle}>
          {products.map((product) => (
            <div key={product._id} style={productCardStyle} onClick={(e) => { e.preventDefault(); onProductClick(product); }}>
              <div style={productImageContainer}>
                {product.imagesProduct?.[0] ? (
                  <img src={toImageUrl(product.imagesProduct[0])} alt={product.name} style={productImage} />
                ) : (
                  <Package size={40} color="#cbd5e1" />
                )}
              </div>
              <div style={productInfo}>
                <h4 style={productName}>{product.name}</h4>
                <div style={productPriceRow}>
                  <span style={productPrice}>{product.price} TND</span>
                  <button type="button" onClick={(e) => handleOrder(e, product)} style={orderBtnStyle}>Commander</button>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#64748b' }}>
                  @{product.companyId?.companyName || 'Société'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={(e) => { e.preventDefault(); scroll('right'); }} style={carouselBtnStyle('right')}><ChevronRight size={20} /></button>
      </div>
    </div>
  );
};

const ProductDetail = ({ product, onClose }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.account);
  const [selectedImg, setSelectedImg] = useState(product?.imagesProduct?.[0] || null);

  if (!product) return null;

  const handleBuy = () => {
    if (!user) {
      navigate("/auth/signup");
    } else {
      // Logique d'achat
      alert("Redirection vers la commande...");
    }
  };

  return (
    <div style={pd.overlay} onClick={onClose}>
      <div style={pd.modal} onClick={e => e.stopPropagation()}>
        <button type="button" style={pd.closeBtn} onClick={onClose}><X size={24} /></button>
        
        <div style={pd.container}>
          {/* GAUCHE: IMAGES */}
          <div style={pd.leftCol}>
            <div style={pd.mainImgBox}>
              {selectedImg ? (
                <img src={toImageUrl(selectedImg)} alt={product.name} style={pd.mainImg} />
              ) : (
                <Package size={100} color="#cbd5e1" />
              )}
            </div>
            <div style={pd.thumbList}>
              {product.imagesProduct?.map((img, i) => (
                <div 
                  key={i} 
                  style={{...pd.thumbBox, border: selectedImg === img ? '2px solid #1E3A5F' : '1px solid #e2e8f0'}}
                  onMouseEnter={() => setSelectedImg(img)}
                >
                  <img src={toImageUrl(img)} alt="" style={pd.thumb} />
                </div>
              ))}
            </div>
          </div>

          {/* MILIEU: INFOS PRODUIT */}
          <div style={pd.midCol}>
            <h1 style={pd.title}>{product.name}</h1>
            <div style={pd.priceRow}>
              <span style={pd.currentPrice}>{product.price?.toLocaleString()} DT</span>
              {product.oldPrice && <span style={pd.oldPrice}>{product.oldPrice?.toLocaleString()} DT</span>}
            </div>

            <div style={pd.statusRow}>
              <span style={{...pd.status, color: product.stock > 0 ? '#10b981' : '#ef4444'}}>
                <CheckCircle2 size={16} /> {product.stock > 0 ? 'EN STOCK' : 'RUPTURE'}
              </span>
              <span style={pd.sku}>SKU: {product._id.slice(-8).toUpperCase()}</span>
            </div>

            <div style={pd.divider} />

            <div style={pd.qtySection}>
              <span style={pd.qtyLabel}>QTÉ</span>
              <div style={pd.qtyBox}>
                <button type="button" style={pd.qtyBtn}>-</button>
                <input type="text" value="1" readOnly style={pd.qtyInput} />
                <button type="button" style={pd.qtyBtn}>+</button>
              </div>
            </div>

            <div style={pd.actionRow}>
              <button type="button" style={pd.buyBtn} onClick={(e) => { e.preventDefault(); handleBuy(); }}>ACHETER</button>
              <button type="button" style={pd.wishBtn}><Heart size={20} /></button>
            </div>

            <div style={pd.overview}>
              <h3 style={pd.overviewTitle}>DESCRIPTION DU PRODUIT</h3>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                {product.description || 'Aucune description disponible'}
              </p>
            </div>
          </div>

          {/* DROITE: SIDEBAR VENDEUR */}
          <div style={pd.rightCol}>
            <div style={pd.sellerCard}>
              <div style={pd.sellerHeader}>
                <div style={pd.sellerLogo}>
                  {product.companyId?.logoUrl ? (
                    <img src={toImageUrl(product.companyId.logoUrl)} alt="" style={pd.logo} />
                  ) : (
                    <Building2 size={24} color="#94a3b8" />
                  )}
                </div>
                <div>
                  <h4 style={pd.sellerName}>{product.companyId?.companyName || 'Boutique'}</h4>
                  <div style={pd.sellerRating}>
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} color="#cbd5e1" />
                    <span style={pd.ratingCount}>5</span>
                  </div>
                </div>
              </div>
              <button type="button" style={pd.visitBtn} onClick={(e) => { e.preventDefault(); navigate(`/user/company/${product.companyId?._id}`); }}>
                VISITER LA BOUTIQUE
              </button>
            </div>

            <div style={pd.shippingInfo}>
              {!user && (
                <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: '2px solid #ff6b00', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Connectez-vous pour commander</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={(e) => { e.preventDefault(); navigate("/auth/login"); }} style={{ flex: 1, padding: '8px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Connexion</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); navigate("/auth/signup"); }} style={{ flex: 1, padding: '8px', background: '#fff', color: '#1E3A5F', border: '1px solid #1E3A5F', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>S'inscrire</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServiceCarousel = ({ title, services, isLoading, onServiceClick }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.account);
  const scrollRef = useRef(null);

  const handleReserve = (e, service) => {
    e.preventDefault();
    e.stopPropagation();
    onServiceClick(service);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (isLoading) return <div style={r.section}><Loader size={24} className="animate-spin" /></div>;
  if (!services || services.length === 0) return null;

  return (
    <div style={r.section}>
      <div style={r.header}>
        <h2 style={r.title}>{title}</h2>
        <button type="button" style={r.moreBtn}>Voir plus <ChevronRight size={14} /></button>
      </div>
      <div style={{ position: 'relative' }}>
        <button type="button" onClick={(e) => { e.preventDefault(); scroll('left'); }} style={carouselBtnStyle('left')}><ChevronLeft size={20} /></button>
        <div ref={scrollRef} style={carouselContainerStyle}>
          {services.map((service) => (
            <div key={service._id} style={productCardStyle} onClick={(e) => { e.preventDefault(); onServiceClick(service); }}>
              <div style={productImageContainer}>
                {service.imagesServices?.[0] ? (
                  <img src={toImageUrl(service.imagesServices[0])} alt={service.name} style={productImage} />
                ) : (
                  <ShoppingBag size={40} color="#cbd5e1" />
                )}
              </div>
              <div style={productInfo}>
                <h4 style={productName}>{service.name}</h4>
                <div style={productPriceRow}>
                  <span style={productPrice}>{service.price || 'À disc.'} TND</span>
                  <button type="button" onClick={(e) => handleReserve(e, service)} style={orderBtnStyle}>Réserver</button>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#64748b' }}>
                  @{service.companyId?.companyName || 'Société'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={(e) => { e.preventDefault(); scroll('right'); }} style={carouselBtnStyle('right')}><ChevronRight size={20} /></button>
      </div>
    </div>
  );
};

const ServiceDetail = ({ service, onClose }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.account);
  const [selectedImg, setSelectedImg] = useState(service?.imagesServices?.[0] || null);

  if (!service) return null;

  const handleReserve = () => {
    if (!user) {
      navigate("/auth/signup");
    } else {
      navigate("/user/dashboard");
    }
  };

  return (
    <div style={pd.overlay} onClick={onClose}>
      <div style={pd.modal} onClick={e => e.stopPropagation()}>
        <button type="button" style={pd.closeBtn} onClick={onClose}><X size={24} /></button>
        
        <div style={pd.container}>
          <div style={pd.leftCol}>
            <div style={pd.mainImgBox}>
              {selectedImg ? (
                <img src={toImageUrl(selectedImg)} alt={service.name} style={pd.mainImg} />
              ) : (
                <ShoppingBag size={100} color="#cbd5e1" />
              )}
            </div>
            <div style={pd.thumbList}>
              {service.imagesServices?.map((img, i) => (
                <div 
                  key={i} 
                  style={{...pd.thumbBox, border: selectedImg === img ? '2px solid #1E3A5F' : '1px solid #e2e8f0'}}
                  onMouseEnter={() => setSelectedImg(img)}
                >
                  <img src={toImageUrl(img)} alt="" style={pd.thumb} />
                </div>
              ))}
            </div>
          </div>

          <div style={pd.midCol}>
            <h1 style={pd.title}>{service.name}</h1>
            <div style={pd.priceRow}>
              <span style={pd.currentPrice}>{service.price?.toLocaleString() || 'À disc.'} DT</span>
            </div>

            <div style={pd.statusRow}>
              <span style={{...pd.status, color: '#10b981'}}>
                <Clock size={16} /> DURÉE: {service.duration} min
              </span>
              <span style={pd.sku}>SKU: {service._id.slice(-8).toUpperCase()}</span>
            </div>

            <div style={pd.divider} />

            <div style={pd.actionRow}>
              <button type="button" style={pd.buyBtn} onClick={(e) => { e.preventDefault(); handleReserve(); }}>RÉSERVER MAINTENANT</button>
              <button type="button" style={pd.wishBtn}><Heart size={20} /></button>
            </div>

            <div style={pd.overview}>
              <h3 style={pd.overviewTitle}>DESCRIPTION DU SERVICE</h3>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                {service.description || 'Aucune description disponible'}
              </p>
            </div>
          </div>

          <div style={pd.rightCol}>
            <div style={pd.sellerCard}>
              <div style={pd.sellerHeader}>
                <div style={pd.sellerLogo}>
                  {service.companyId?.logoUrl ? (
                    <img src={toImageUrl(service.companyId.logoUrl)} alt="" style={pd.logo} />
                  ) : (
                    <Building2 size={24} color="#94a3b8" />
                  )}
                </div>
                <div>
                  <h4 style={pd.sellerName}>{service.companyId?.companyName || 'Boutique'}</h4>
                  <div style={pd.sellerRating}>
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} color="#cbd5e1" />
                    <span style={pd.ratingCount}>5</span>
                  </div>
                </div>
              </div>
              <button type="button" style={pd.visitBtn} onClick={(e) => { e.preventDefault(); navigate(`/user/company/${service.companyId?._id}`); }}>
                VISITER L'ENTREPRISE
              </button>
            </div>

            <div style={pd.shippingInfo}>
              {!user && (
                <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: '2px solid #ff6b00', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Connectez-vous pour réserver</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={(e) => { e.preventDefault(); navigate("/auth/login"); }} style={{ flex: 1, padding: '8px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Connexion</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); navigate("/auth/signup"); }} style={{ flex: 1, padding: '8px', background: '#fff', color: '#1E3A5F', border: '1px solid #1E3A5F', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>S'inscrire</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles pour les carousels
const carouselContainerStyle = {
  display: 'flex',
  gap: '20px',
  overflowX: 'hidden',
  scrollBehavior: 'smooth',
  padding: '10px 5px',
};

const carouselBtnStyle = (direction) => ({
  position: 'absolute',
  top: '50%',
  [direction]: '-20px',
  transform: 'translateY(-50%)',
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 2,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
});

const productCardStyle = {
  minWidth: '220px',
  maxWidth: '220px',
  background: '#fff',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};

const productImageContainer = {
  height: '180px',
  background: '#f8fafc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const productImage = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const productInfo = {
  padding: '15px',
};

const productName = {
  fontSize: '15px',
  fontWeight: '700',
  color: '#1e293b',
  margin: '0 0 10px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const productPriceRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const productPrice = {
  fontSize: '16px',
  fontWeight: '800',
  color: '#1E3A5F',
};

const orderBtnStyle = {
  padding: '6px 12px',
  background: '#1E3A5F',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: '700',
  cursor: 'pointer',
};

const RecommendedCompanies = () => {
  const { data: recommended = [], isLoading } = useGetRecommendedCompaniesQuery(undefined, { pollingInterval: 3000 });
  const navigate = useNavigate();

  if (isLoading || recommended.length === 0) return null;

  return (
    <div style={{ ...r.section, marginBottom: '30px' }}>
      <div style={r.header}>
        <h2 style={{ ...r.title, fontSize: '16px' }}>Sociétés Recommandées</h2>
        <button type="button" style={r.moreBtn} onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 1200, behavior: 'smooth' }); }}>
          Voir plus <ChevronRight size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recommended.slice(0, 5).map((company) => (
          <div key={company._id} style={{ ...r.card, padding: '10px' }} onClick={(e) => { e.preventDefault(); navigate(`/user/company/${company._id}`); }}>
            <div style={{ ...r.logoBox, width: '45px', height: '45px' }}>
              {company.logoUrl 
                ? <img src={toImageUrl(company.logoUrl)} alt="" style={r.logo} />
                : <Building2 size={20} color="#94a3b8" />
              }
            </div>
            <div style={r.info}>
              <h4 style={{ ...r.companyName, fontSize: '14px' }}>{company.companyName}</h4>
              <div style={r.ratingRow}>
                <div style={r.stars}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={10} fill={s <= Math.round(company.averageRating) ? "#fbbf24" : "none"} color={s <= Math.round(company.averageRating) ? "#fbbf24" : "#cbd5e1"} />
                  ))}
                </div>
                <span style={{ ...r.cityText, fontSize: '11px' }}>{company.city || "Tunisie"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CompanyFeed = ({ filters }) => {
  const { data: companies = [], isLoading, isFetching } = useSearchCompaniesQuery(filters, { pollingInterval: 3000 });

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
                  <span style={c.listReviewCount}>{company.rating?.count || 0} avis</span>
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const { data: allProducts, isLoading: productsLoading } = useGetAllProductsQuery();
  const { data: allServices, isLoading: servicesLoading } = useGetAllServicesQuery();

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
            <ProductCarousel 
              title="Produits des entreprises" 
              products={allProducts} 
              isLoading={productsLoading}
              onProductClick={(p) => setSelectedProduct(p)}
            />
            
            <ServiceCarousel 
              title="Services recommandés" 
              services={allServices} 
              isLoading={servicesLoading} 
              onServiceClick={(s) => setSelectedService(s)}
            />
            
            <div style={p.feedHeader}>
              <Search size={18} color="#1E3A5F" />
              <h2 style={p.feedTitle}>Résultats de Recherche</h2>
            </div>
            <div style={p.feedScroll}>
              <CompanyFeed filters={filters} />
            </div>
          </main>
          <aside style={p.rightSidebar}>
            <RecommendedCompanies />
            <SuggestedCompanies />
          </aside>
        </div>
      </div>

      {selectedProduct && (
        <ProductDetail 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      {selectedService && (
        <ServiceDetail 
          service={selectedService} 
          onClose={() => setSelectedService(null)} 
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

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
  currentPrice: { fontSize: '28px', fontWeight: '800', color: '#ff6b00' },
  statusRow: { display: 'flex', gap: '20px', alignItems: 'center' },
  status: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#10b981' },
  sku: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
  divider: { height: '1px', background: '#e2e8f0', margin: '5px 0' },
  qtySection: { display: 'flex', alignItems: 'center', gap: '20px' },
  qtyLabel: { fontSize: '13px', fontWeight: '700', color: '#1e293b' },
  qtyBox: { display: 'flex', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' },
  qtyBtn: { width: '32px', height: '32px', background: '#fff', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' },
  qtyInput: { width: '40px', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', background: '#fff' },
  actionRow: { display: 'flex', gap: '15px', marginTop: '10px' },
  buyBtn: { flex: 1, padding: '14px', background: '#ff6b00', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase' },
  cartBtn: { flex: 1, padding: '14px', background: '#fff', color: '#ff6b00', border: '1px solid #ff6b00', borderRadius: '30px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase' },
  wishBtn: { width: '48px', height: '48px', border: '1px solid #e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b00', cursor: 'pointer' },
  overview: { marginTop: '20px' },
  overviewTitle: { fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: '0 0 10px' },
  specs: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#475569' },
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
  shipItem: { display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: '#475569' },
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
    background: "none", cursor: "pointer",
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
