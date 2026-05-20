import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { logOut } from "../../redux/features/auth/authSlice";
import { apiSlice } from "../../redux/api/apiSlice";
import {
  useGetSuggestedCompaniesQuery,
  useFollowCompanyMutation,
  useSearchCompaniesQuery,
  useGetRecommendedCompaniesQuery,
  useGetCountriesQuery,
  useGetRegionsQuery,
  useGetCategoriesQuery,
} from "../../redux/features/company/companyApiSlice";
import {
  useGetAllProductsQuery,
} from "../../redux/features/products/productApiSlice";
import {
  useGetAllServicesQuery,
} from "../../redux/features/company/companyServiceApiSlice";
import {
  useSearchProfessionalsQuery,
  useGetRecommendedProfessionalsQuery as useGetRecommendedProsQuery,
  useGetSuggestedProfessionalsQuery,
  useFollowProfessionalMutation,
  useUnfollowProfessionalMutation,
} from "../../redux/features/professional/professionalApiSlice";
import {
  Loader, Users, ChevronDown, LogOut,
  Home as HomeIcon, User, Building2, MapPin, Search, X,
  Briefcase, Tag, ChevronRight, Store, Star, Package, ShoppingBag, ChevronLeft, CheckCircle2, Clock,
  Stethoscope, Wrench, Car, Scale, Cpu, GraduationCap, Palette, Heart, Activity, Laptop, Camera, Music, Scissors,
  HardHat, Factory, ShoppingCart, Landmark, Plane, Truck, Hammer, Map, Building, Banknote, Coffee
} from "lucide-react";

import { toImageUrl } from "../../utils/imageUtils";

const Header = ({ user, onLogout, onAction, activeTab }) => {
  const navigate = useNavigate();

  return (
    <div style={h.bar}>
      <div style={{ ...h.brand, cursor: 'pointer' }} onClick={(e) => {
        e.preventDefault();
        if (window.location.pathname === "/") {
          onAction('home');
        } else {
          navigate("/");
        }
      }}>
        <div style={h.brandDot} />
        <span style={h.brandName}>ProFinder</span>
      </div>

      <div style={h.nav}>
        <button
          type="button"
          onClick={() => {
            if (window.location.pathname === "/") {
              onAction('home');
            } else {
              navigate("/");
            }
          }}
          style={{ ...h.navBtn, color: activeTab === null ? "#1E3A5F" : "#64748b", borderBottom: activeTab === null ? "2px solid #1E3A5F" : "none" }}
        >
          <HomeIcon size={18} /><span style={h.navLabel}>Accueil</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/marketplace")}
          style={{ ...h.navBtn, color: activeTab === 'marketplace' ? "#1E3A5F" : "#64748b", borderBottom: activeTab === 'marketplace' ? "2px solid #1E3A5F" : "none" }}
        >
          <Store size={18} /><span style={h.navLabel}>Marketplace</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('companies')}
          style={{ ...h.navBtn, color: activeTab === 'companies' ? "#1E3A5F" : "#64748b", borderBottom: activeTab === 'companies' ? "2px solid #1E3A5F" : "none" }}
        >
          <Building2 size={18} /><span style={h.navLabel}>Sociétés</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('professionals')}
          style={{ ...h.navBtn, color: activeTab === 'professionals' ? "#1E3A5F" : "#64748b", borderBottom: activeTab === 'professionals' ? "2px solid #1E3A5F" : "none" }}
        >
          <Briefcase size={18} /><span style={h.navLabel}>Professionnels</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                const roles = user.roles || [];
                if (roles.includes('admin')) navigate("/admin/stats");
                else if (roles.includes('company') || roles.includes('owner') || roles.includes('manager')) navigate("/company/stats");
                else if (roles.includes('professional')) navigate("/professional/stats");
                else navigate("/user/dashboard");
              }}
              style={h.authBtnSignup}
            >
              Tableau de bord
            </button>
            <button onClick={onLogout} style={h.authBtnLogin}>
              <LogOut size={16} /> Quitter
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/auth/signup" style={h.authBtnSignup}>
              S'inscrire
            </Link>
            <Link to="/auth/login" style={h.authBtnLogin}>
              Connexion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};


const SuggestedCompanies = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const { data: suggestions = [], isLoading } = useGetSuggestedCompaniesQuery(undefined, { pollingInterval: 50000 });
  const [followCompany] = useFollowCompanyMutation();
  const [followedIds, setFollowedIds] = useState([]);

  const handleFollow = async (companyId) => {
    if (!user) {
      navigate("/auth/login", { state: { from: location.pathname } });
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

  if (isLoading || suggestions.length === 0) return null;

  return (
    <div style={{ ...sg.card, marginBottom: '30px' }}>
      <h3 style={sg.title}>Entreprises à suivre</h3>
      <div style={sg.list}>
        {suggestions.map((comp) => (
          <div key={comp._id} style={sg.item}>
            <div style={sg.logoWrap} onClick={() => navigate(`/user/company/${comp._id}`)}>
              {comp.logoUrl
                ? <img src={toImageUrl(comp.logoUrl)} alt="" style={sg.logo} />
                : <div style={sg.logoFallback}><Building2 size={18} color="#94a3b8" /></div>
              }
            </div>
            <div style={sg.info}>
              <span style={sg.name} onClick={() => navigate(`/user/company/${comp._id}`)}>{comp.companyName}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={sg.city}><MapPin size={10} /> {comp.city || "Tunisie"}</span>
                <span style={sg.city}><Users size={10} /> {comp.followersCount || 0} abonnés</span>
              </div>
            </div>
            <button
              style={{ ...sg.followBtn, ...(followedIds.includes(comp._id) ? sg.followBtnActive : {}) }}
              onClick={() => handleFollow(comp._id)}
            >
              {followedIds.includes(comp._id) ? "Suivi" : "Suivre"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const SuggestedProfessionals = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const { data: suggestions = [], isLoading } = useGetSuggestedProfessionalsQuery(undefined, { pollingInterval: 30000 });
  const [followPro] = useFollowProfessionalMutation();
  const [unfollowPro] = useUnfollowProfessionalMutation();
  const [followedIds, setFollowedIds] = useState([]);

  const handleFollow = async (proId) => {
    if (!user) {
      navigate("/auth/login", { state: { from: location.pathname } });
      return;
    }
    const isFollowed = followedIds.includes(proId);
    try {
      if (isFollowed) {
        await unfollowPro(proId).unwrap();
        setFollowedIds(prev => prev.filter(id => id !== proId));
      } else {
        await followPro(proId).unwrap();
        setFollowedIds(prev => [...prev, proId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || suggestions.length === 0) return null;

  return (
    <div style={{ ...sg.card, marginBottom: '20px' }}>
      <h3 style={sg.title}>Professionnels à suivre</h3>
      <div style={sg.list}>
        {suggestions.map((pro) => (
          <div key={pro._id} style={sg.item}>
            <div style={sg.logoWrap} onClick={() => navigate(`/user/professional/${pro._id}`)}>
              {pro.photoProfessional
                ? <img src={toImageUrl(pro.photoProfessional)} alt="" style={{ ...sg.logo }} />
                : <div style={{ ...sg.logoFallback }}><User size={18} color="#94a3b8" /></div>
              }
            </div>
            <div style={sg.info}>
              <span style={sg.name} onClick={() => navigate(`/user/professional/${pro._id}`)}>{pro.fullName}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={sg.city}><MapPin size={10} /> {pro.city || "Tunisie"}</span>
                <span style={sg.city}><Users size={10} /> {pro.followersCount || 0} abonnés</span>
              </div>
            </div>
            <button
              style={{ ...sg.followBtn, ...(followedIds.includes(pro._id) ? sg.followBtnActive : {}) }}
              onClick={() => handleFollow(pro._id)}
            >
              {followedIds.includes(pro._id) ? "Suivi" : "Suivre"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CategoryCards = ({ onCategoryClick, selectedId }) => {
  const { data: categories = [], isLoading } = useGetCategoriesQuery();

  if (isLoading || categories.length === 0) return null;

  // Map category names to icons (Lucide-react icons)
  const getCategoryIcon = (name) => {
    const n = name.toLowerCase();

    // 1. Santé & Bien-être
    if (n.includes('santé') || n.includes('médic') || n.includes('bien-être') || n.includes('soin')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)' }}>
          <Stethoscope size={24} color="#fff" />
        </div>
      );
    }

    // 2. Maison & Dépannage
    if (n.includes('maison') || n.includes('dépannage') || n.includes('travaux') || n.includes('plomb') || n.includes('élec')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
          <Wrench size={24} color="#fff" />
        </div>
      );
    }

    // 3. Business & Juridique
    if (n.includes('business') || n.includes('juridique') || n.includes('droit') || n.includes('avocat')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
          <Scale size={24} color="#fff" />
        </div>
      );
    }

    // 4. Finance & Assurance (Separate from Business)
    if (n.includes('finance') || n.includes('assurance') || n.includes('banque') || n.includes('compta')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
          <Banknote size={24} color="#fff" />
        </div>
      );
    }

    // 5. Technologie & Digital
    if (n.includes('tech') || n.includes('digital') || n.includes('informatique') || n.includes('web') || n.includes('logiciel')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)' }}>
          <Cpu size={24} color="#fff" />
        </div>
      );
    }

    // 6. Éducation & Formation
    if (n.includes('éduc') || n.includes('form') || n.includes('cours') || n.includes('école') || n.includes('univ')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' }}>
          <GraduationCap size={24} color="#fff" />
        </div>
      );
    }

    // 7. Créatif & Médias
    if (n.includes('créat') || n.includes('média') || n.includes('art') || n.includes('photo') || n.includes('musique') || n.includes('pub')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)' }}>
          <Palette size={24} color="#fff" />
        </div>
      );
    }

    // 8. Automobile & Transport
    if (n.includes('auto') || n.includes('transport') || n.includes('véhicule') || n.includes('logistique') || n.includes('camion')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
          <Car size={24} color="#fff" />
        </div>
      );
    }

    // 9. BTP & Construction
    if (n.includes('btp') || n.includes('construction') || n.includes('immob') || n.includes('archi') || n.includes('bâti')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' }}>
          <HardHat size={24} color="#fff" />
        </div>
      );
    }

    // 10. Industrie & Production
    if (n.includes('industrie') || n.includes('prod') || n.includes('usine') || n.includes('fab')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' }}>
          <Factory size={24} color="#fff" />
        </div>
      );
    }

    // 11. Commerce & Distribution
    if (n.includes('commerce') || n.includes('vente') || n.includes('magasin') || n.includes('distribution') || n.includes('shopping')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' }}>
          <ShoppingCart size={24} color="#fff" />
        </div>
      );
    }

    // 12. Tourisme & Loisirs
    if (n.includes('tourism') || n.includes('loisir') || n.includes('voyage') || n.includes('hôtel') || n.includes('resto') || n.includes('café')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' }}>
          <Plane size={24} color="#fff" />
        </div>
      );
    }

    // 13. Services aux entreprises
    if (n.includes('entreprises') || n.includes('btob') || n.includes('b2b') || n.includes('conseil')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)' }}>
          <Briefcase size={24} color="#fff" />
        </div>
      );
    }

    // 14. Services personnels
    if (n.includes('perso') || n.includes('service') || n.includes('beauté') || n.includes('coiffure') || n.includes('garde')) {
      return (
        <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)' }}>
          <User size={24} color="#fff" />
        </div>
      );
    }

    // Default
    return (
      <div style={{ ...cat.iconWrap, background: 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)' }}>
        <Tag size={24} color="#fff" />
      </div>
    );
  };

  return (
    <div style={cat.container}>
      <div style={cat.grid}>
        {categories.map((c) => {
          const isSelected = selectedId === c._id;
          return (
            <div
              key={c._id}
              style={{
                ...cat.card,
                borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                background: isSelected ? '#eff6ff' : '#fff',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected ? '0 10px 20px rgba(59, 130, 246, 0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
              }}
              onClick={() => onCategoryClick(c)}
              className="category-card"
            >
              <div style={{ position: 'relative', width: '100%' }}>
                {getCategoryIcon(c.name)}
                {isSelected && (
                  <div style={{ position: 'absolute', top: -5, right: -5, background: '#3b82f6', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                    <CheckCircle2 size={14} color="#fff" />
                  </div>
                )}
              </div>
              <span style={{ ...cat.name, color: isSelected ? '#1d4ed8' : '#111827' }}>{c.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RecommendedProfessionals = () => {
  const { data: recommended = [], isLoading } = useGetRecommendedProsQuery(undefined, { pollingInterval: 30000 });
  const navigate = useNavigate();

  if (isLoading || recommended.length === 0) return null;

  return (
    <div style={{ ...r.section, marginBottom: '30px' }}>
      <div style={r.header}>
        <h2 style={{ ...r.title, fontSize: '16px' }}>Professionnels Recommandés</h2>
        <button type="button" style={r.moreBtn} onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 1200, behavior: 'smooth' }); }}>
          Voir plus <ChevronRight size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recommended.slice(0, 5).map((pro) => (
          <div key={pro._id} style={{ ...r.card, padding: '10px' }} onClick={(e) => { e.preventDefault(); navigate(`/user/professional/${pro._id}`); }}>
            <div style={{ ...r.logoBox, width: '45px', height: '45px', borderRadius: '50%' }}>
              {pro.photoProfessional
                ? <img src={toImageUrl(pro.photoProfessional)} alt="" style={r.logo} />
                : <User size={20} color="#b89494ff" />
              }
            </div>
            <div style={r.info}>
              <h4 style={{ ...r.companyName, fontSize: '14px' }}>{pro.fullName}</h4>
              <div style={r.ratingRow}>
                <div style={r.stars}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={10} fill={s <= Math.round(pro.averageRating) ? "#fbbf24" : "none"} color={s <= Math.round(pro.averageRating) ? "#fbbf24" : "#cbd5e1"} />
                  ))}
                </div>
                <span style={{ ...r.cityText, fontSize: '11px' }}>{pro.city || "Tunisie"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductCarousel = ({ title, products, isLoading, onProductClick }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
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
        <button type="button" onClick={() => navigate('/marketplace', { state: { view: 'products' } })} style={r.moreBtn}>Voir plus <ChevronRight size={14} /></button>
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
                  <span style={productPrice}>{product.price}</span>
                  <button type="button" onClick={(e) => handleOrder(e, product)} style={orderBtnStyle}>Commander</button>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#64748b' }}>
                  @{product.companyId?.companyName || product.professionalId?.fullName || 'Prestataire'}
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
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [selectedImg, setSelectedImg] = useState(product?.imagesProduct?.[0] || null);

  if (!product) return null;

  const handleBuy = () => {
    if (!user) {
      navigate("/auth/login", { state: { from: location.pathname } });
    } else {
      navigate("/user/dashboard");
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
                  style={{ ...pd.thumbBox, border: selectedImg === img ? '2px solid #1E3A5F' : '1px solid #e2e8f0' }}
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
              <span style={pd.currentPrice}>{product.price?.toLocaleString()}</span>
              {product.oldPrice && <span style={pd.oldPrice}>{product.oldPrice?.toLocaleString()}</span>}
            </div>

            <div style={pd.statusRow}>
              <span style={{ ...pd.status, color: product.stock > 0 ? '#10b981' : '#ef4444' }}>
                <CheckCircle2 size={16} /> {product.stock > 0 ? 'EN STOCK' : 'RUPTURE'}
              </span>

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
              <button type="button" style={pd.buyBtn} onClick={(e) => { e.preventDefault(); handleBuy(); }}>ACHETER MAINTENANT</button>
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
                  {(product.companyId?.logoUrl || product.professionalId?.photoProfessional) ? (
                    <img src={toImageUrl(product.companyId?.logoUrl || product.professionalId?.photoProfessional)} alt="" style={pd.logo} />
                  ) : (
                    <Building2 size={24} color="#94a3b8" />
                  )}
                </div>
                <div>
                  <h4 style={pd.sellerName}>{product.companyId?.companyName || product.professionalId?.fullName || 'Boutique'}</h4>
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
              <button type="button" style={pd.visitBtn} onClick={(e) => {
                e.preventDefault();
                if (product.professionalId) {
                  navigate(`/user/professional/${product.professionalId?._id || product.professionalId}`);
                } else {
                  navigate(`/user/company/${product.companyId?._id || product.companyId}`);
                }
              }}>
                {product.professionalId ? "VOIR LE PROFIL" : "VISITER LA BOUTIQUE"}
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
  const user = useSelector((state) => state.auth.user);
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
        <button type="button" onClick={() => navigate('/marketplace', { state: { view: 'services' } })} style={r.moreBtn}>Voir plus <ChevronRight size={14} /></button>
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
                  <span style={productPrice}>{service.price || 'À disc.'} </span>
                  <button type="button" onClick={(e) => handleReserve(e, service)} style={orderBtnStyle}>Réserver</button>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#64748b' }}>
                  @{service.companyId?.companyName || service.professionalId?.fullName || 'Prestataire'}
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
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [selectedImg, setSelectedImg] = useState(service?.imagesServices?.[0] || null);

  if (!service) return null;

  const handleBuy = () => {
    if (!user) {
      navigate("/auth/login", { state: { from: location.pathname } });
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
                  style={{ ...pd.thumbBox, border: selectedImg === img ? '2px solid #1E3A5F' : '1px solid #e2e8f0' }}
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
              <span style={pd.currentPrice}>{service.price?.toLocaleString() || 'À disc.'}</span>
            </div>

            <div style={pd.statusRow}>
              <span style={{ ...pd.status, color: '#10b981' }}>
                <Clock size={16} /> DURÉE: {service.duration}
              </span>

            </div>

            <div style={pd.divider} />

            <div style={pd.actionRow}>
              <button type="button" style={pd.buyBtn} onClick={(e) => { e.preventDefault(); handleBuy(); }}>CONFIRMER LA RÉSERVATION</button>
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
                  {(service.companyId?.logoUrl || service.professionalId?.photoProfessional) ? (
                    <img src={toImageUrl(service.companyId?.logoUrl || service.professionalId?.photoProfessional)} alt="" style={pd.logo} />
                  ) : (
                    <Building2 size={24} color="#94a3b8" />
                  )}
                </div>
                <div>
                  <h4 style={pd.sellerName}>{service.companyId?.companyName || service.professionalId?.fullName || 'Boutique'}</h4>                  <div style={pd.sellerRating}>
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <Star size={12} color="#cbd5e1" />
                    <span style={pd.ratingCount}>5</span>
                  </div>
                </div>
              </div>
              <button type="button" style={pd.visitBtn} onClick={(e) => {
                e.preventDefault();
                if (service.professionalId) {
                  navigate(`/user/professional/${service.professionalId?._id || service.professionalId}`);
                } else {
                  navigate(`/user/company/${service.companyId?._id || service.companyId}`);
                }
              }}>
                {service.professionalId ? "VOIR LE PROFIL" : "VISITER L'ENTREPRISE"}
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
  const navigate = useNavigate();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {companies.map((company) => (
        <div
          key={company._id}
          style={c.listCard}
          onClick={() => navigate(`/user/company/${company._id}`)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
          }}
        >
          <div style={c.listHeader}>
            <div style={c.listLogoWrap}>
              {company.logoUrl
                ? <img src={toImageUrl(company.logoUrl)} alt={company.companyName} style={c.listLogo} />
                : <div style={c.listLogoFallback}><Building2 size={32} color="#cbd5e1" /></div>
              }
            </div>
            <div style={c.listInfo}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={c.listName}>{company.companyName}</h3>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <p style={c.listMeta}>
                      <MapPin size={14} color="#3b82f6" /> {company.city || "Tunisie"}
                    </p>
                    {(company.servicesList?.[0] || company.categoryName) && (
                      <p style={{ ...c.listMeta, color: '#8b5cf6', fontWeight: '600' }}>
                        <Briefcase size={14} color="#8b5cf6" /> {company.categoryName || company.servicesList?.[0]}
                      </p>
                    )}
                  </div>
                  {company.servicesList?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                      {company.servicesList.map((svc, i) => (
                        <span key={i} style={c.serviceTag}>{svc}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={c.listRating}>
                  <div style={c.listStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={16} fill={s <= Math.round(company.rating?.average || 0) ? "#fbbf24" : "none"} color={s <= Math.round(company.rating?.average || 0) ? "#fbbf24" : "#cbd5e1"} />
                    ))}
                  </div>
                  <div style={c.listReviewCount}>{company.rating?.count || 0} avis</div>
                </div>
              </div>
            </div>
            <div style={c.listActions}>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/user/company/${company._id}`); }}
                style={c.listBtn}
              >
                Voir Profil
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ProfessionalFeed = ({ filters }) => {
  const navigate = useNavigate();
  const { data: professionals = [], isLoading } = useSearchProfessionalsQuery(filters, { pollingInterval: 3000 });

  if (isLoading) return (
    <div style={f.center}>
      <Loader size={28} color="#1E3A5F" style={{ animation: "spin 1s linear infinite" }} />
      <p style={f.loadingText}>Recherche des professionnels...</p>
    </div>
  );

  if (professionals.length === 0) return (
    <div style={f.empty}>
      <User size={44} color="#cbd5e1" style={{ marginBottom: 16 }} />
      <p style={f.emptyTitle}>Aucun professionnel trouvé</p>
      <p style={f.emptyText}>
        Vérifiez vos filtres ou assurez-vous que les professionnels ont été <strong>validés par l'administrateur</strong>.
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {professionals.map((pro) => (
        <div
          key={pro._id}
          style={c.listCard}
          onClick={() => navigate(`/user/professional/${pro._id}`)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
          }}
        >
          <div style={c.listHeader}>
            <div style={c.listLogoWrap}>
              {pro.photoProfessional
                ? <img src={toImageUrl(pro.photoProfessional)} alt={pro.fullName} style={{ ...c.listLogo, borderRadius: '50%' }} />
                : <div style={{ ...c.listLogoFallback, borderRadius: '50%' }}><User size={32} color="#cbd5e1" /></div>
              }
            </div>
            <div style={c.listInfo}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={c.listName}>{pro.fullName}</h3>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <p style={c.listMeta}>
                      <MapPin size={14} color="#3b82f6" /> {pro.city || "Tunisie"}
                    </p>
                    {(pro.servicesList?.[0] || pro.categoryName) && (
                      <p style={{ ...c.listMeta, color: '#8b5cf6', fontWeight: '600' }}>
                        <Briefcase size={14} color="#8b5cf6" /> {pro.categoryName || pro.servicesList?.[0]}
                      </p>
                    )}
                  </div>
                  {pro.servicesList?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                      {pro.servicesList.map((svc, i) => (
                        <span key={i} style={c.serviceTag}>{svc}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={c.listRating}>
                  <div style={c.listStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={16} fill={s <= Math.round(pro.rating?.average || 0) ? "#fbbf24" : "none"} color={s <= Math.round(pro.rating?.average || 0) ? "#fbbf24" : "#cbd5e1"} />
                    ))}
                  </div>
                  <div style={c.listReviewCount}>{pro.rating?.count || 0} avis</div>
                </div>
              </div>
            </div>
            <div style={c.listActions}>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/user/professional/${pro._id}`); }}
                style={{ ...c.listBtn, background: '#1E3A5F', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)' }}
              >
                Voir Profil
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
//component pour choisir pays et region
const HeroSelect = ({ value, onChange, options, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        if (searchRef.current.trim() === "") {
          onChange(""); 
        } else {
          const selected = options.find(o => o._id === value);
          setSearch(selected ? selected.name : "");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options, onChange]);

  useEffect(() => {
    const selected = options.find(o => o._id === value);
    setSearch(selected ? selected.name : "");
  }, [value, options]);

  const filteredOptions = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1 }}>
      <input
        type="text"
        placeholder={placeholder}
        style={{ ...hero.select, cursor: disabled ? 'not-allowed' : 'text' }}
        value={isOpen ? search : (options.find(o => o._id === value)?.name || "")}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          if (!disabled) setIsOpen(true);
        }}
        disabled={disabled}
      />
      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 20px)',
          left: -20,
          minWidth: '250px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 50,
          border: '1px solid #e2e8f0',
          padding: '8px'
        }} className="custom-scrollbar">
          {filteredOptions.length > 0 ? filteredOptions.map(opt => (
            <div
              key={opt._id}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: value === opt._id ? '#3b82f6' : '#1e293b',
                background: value === opt._id ? '#eff6ff' : 'transparent',
                textAlign: 'left',
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = value === opt._id ? '#eff6ff' : '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = value === opt._id ? '#eff6ff' : 'transparent'}
              onClick={() => {
                onChange(opt._id);
                setSearch(opt.name);
                setIsOpen(false);
              }}
            >
              {opt.name}
            </div>
          )) : (
            <div style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
              Aucun résultat
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTab, setSearchTab] = useState("companies"); // 'companies' | 'professionals'
  const [isShowingResults, setIsShowingResults] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

  const location = useLocation();
  const productRef = useRef(null);
  const serviceRef = useRef(null);
  const searchResultsRef = useRef(null);

  useEffect(() => {
    if (location.state?.tab) {
      setSearchTab(location.state.tab);
      setIsShowingResults(true);
      setTimeout(() => {
        if (searchResultsRef.current) searchResultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.state]);

  const { data: allProducts, isLoading: productsLoading } = useGetAllProductsQuery();
  const { data: allServices, isLoading: servicesLoading } = useGetAllServicesQuery();
  const { data: countries = [] } = useGetCountriesQuery();
  const { data: regionsData } = useGetRegionsQuery(selectedCountry, { skip: !selectedCountry });
  const regionsList = Array.isArray(regionsData?.regions) ? regionsData.regions : [];

  const handleLogout = () => {
    dispatch(logOut());
    dispatch(apiSlice.util.resetApiState());
    navigate("/auth/login");
  };

  const handleAction = (type) => {
    if (type === 'home') {
      setIsShowingResults(false);
      setSelectedCategoryId(null);
      setSelectedCountry("");
      setSelectedRegion("");
      setSearchQuery("");
      setAppliedFilters({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (type === 'products' && productRef.current) {
      productRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'services' && serviceRef.current) {
      serviceRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'professionals') {
      setSearchTab('professionals');
      setIsShowingResults(true);
      setTimeout(() => {
        if (searchResultsRef.current) searchResultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (type === 'companies') {
      setSearchTab('companies');
      setIsShowingResults(true);
      setTimeout(() => {
        if (searchResultsRef.current) searchResultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (type === 'join') {
      navigate("/auth/signup");
    }
  };

  const handleSearch = () => {
    setSelectedCategoryId(null);
    setAppliedFilters({
      q: searchQuery,
      country: selectedCountry,
      region: selectedRegion
    });
    setIsShowingResults(true);
    setTimeout(() => {
      if (searchResultsRef.current) searchResultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategoryId(category._id);
    setSearchTab(category.type === 'professional' ? 'professionals' : 'companies');
    setAppliedFilters({
      category: category._id
    });
    setIsShowingResults(true);
    setTimeout(() => {
      if (searchResultsRef.current) searchResultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div style={p.root}>
      <Header
        user={user}
        onLogout={handleLogout}
        onAction={handleAction}
        activeTab={isShowingResults ? searchTab : null}
      />
      <div style={p.layout}>
        <div style={hero.container}>
          <h1 style={hero.title}>
            Trouvez. Réservez. <span style={hero.highlight}>Payez en ligne.</span> En toute confiance.
          </h1>
          <p style={hero.subtitle}>
            La plateforme intelligente qui simplifie la mise en relation avec les meilleurs professionnels et entreprises dans le monde entier.
          </p>

          <div style={hero.searchBar}>
            <div style={hero.filterGroup}>
              <MapPin size={18} color="#3b82f6" />
              <HeroSelect
                value={selectedCountry}
                onChange={(val) => {
                  setSelectedCountry(val);
                  setSelectedRegion("");
                }}
                options={countries}
                placeholder="Sélectionner un pays"
              />
              <ChevronDown size={14} color="#64748b" />
            </div>

            <div style={hero.divider} />

            <div style={hero.filterGroup}>
              <HeroSelect
                value={selectedRegion}
                onChange={(val) => setSelectedRegion(val)}
                options={regionsList}
                placeholder="Choisir une région"
                disabled={!selectedCountry}
              />
              <ChevronDown size={14} color="#64748b" />
            </div>

            <div style={hero.divider} />

            <div style={hero.inputGroup}>
              <Search size={18} color="#64748b" />
              <input
                type="text"
                placeholder="Que recherchez-vous ?"
                style={hero.input}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <button style={hero.searchBtn} onClick={handleSearch}>
              Rechercher <ChevronRight size={18} />
            </button>

            {isShowingResults && (
              <button
                style={{
                  ...hero.searchBtn,
                  background: '#f1f5f9',
                  color: '#64748b',
                  boxShadow: 'none',
                  border: '1px solid #e2e8f0'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleAction('home');
                }}
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        <CategoryCards
          onCategoryClick={handleCategoryClick}
          selectedId={selectedCategoryId}
        />
        <div style={p.contentWrapper}>
          <main style={p.main}>
            {isShowingResults && (
              <div ref={searchResultsRef} className="results-container" style={{ marginBottom: 40 }}>
                <div style={p.feedHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Search size={18} color="#1E3A5F" />
                    <h2 style={p.feedTitle}>Résultats pour {searchTab === 'companies' ? 'Sociétés' : 'Professionnels'}</h2>
                  </div>

                </div>

                <div style={r.tabToggle}>
                  <button
                    style={{ ...r.tabBtn, ...(searchTab === 'companies' ? r.tabBtnActive : {}) }}
                    onClick={() => setSearchTab('companies')}
                  >
                    Entreprises
                  </button>
                  <button
                    style={{ ...r.tabBtn, ...(searchTab === 'professionals' ? r.tabBtnActive : {}) }}
                    onClick={() => setSearchTab('professionals')}
                  >
                    Professionnels
                  </button>
                </div>

                {searchTab === "companies" ? (
                  <CompanyFeed filters={appliedFilters} />
                ) : (
                  <ProfessionalFeed filters={appliedFilters} />
                )}
              </div>
            )}

            <div ref={productRef} style={{ display: isShowingResults ? 'none' : 'block' }}>
              <ProductCarousel
                title="Produits des entreprises"
                products={allProducts}
                isLoading={productsLoading}
                onProductClick={(p) => setSelectedProduct(p)}
              />
            </div>

            <div ref={serviceRef} style={{ display: isShowingResults ? 'none' : 'block' }}>
              <ServiceCarousel
                title="Services recommandés"
                services={allServices}
                isLoading={servicesLoading}
                onServiceClick={(s) => setSelectedService(s)}
              />
            </div>
          </main>
          <aside style={p.rightSidebar}>
            <RecommendedCompanies />
            <RecommendedProfessionals />
            {!isShowingResults && <SuggestedCompanies />}
            <SuggestedProfessionals />
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .showcase-card:hover { transform: translateY(-5px); }
        .category-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
          border-color: #3b82f6 !important;
        }
        .results-container {
          animation: fadeIn 0.5s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};
//css des produit detail
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
  divider: { height: '1px', background: '#e2e8f0', margin: '5px 0' },
  qtySection: { display: 'flex', alignItems: 'center', gap: '20px' },
  qtyLabel: { fontSize: '13px', fontWeight: '700', color: '#1e293b' },
  qtyBox: { display: 'flex', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' },
  qtyBtn: { width: '32px', height: '32px', background: '#fff', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' },
  qtyInput: { width: '40px', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', background: '#fff' },
  actionRow: { display: 'flex', gap: '15px', marginTop: '10px' },
  buyBtn: { flex: 1, padding: '14px', background: '#ff6b00', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase' },
  cartBtn: { flex: 1, padding: '14px', background: '#fff', color: '#ff6b00', border: '1px solid #ff6b00', borderRadius: '30px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase' },
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
//css de header
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
//css des sidebar
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
  tabToggle: {
    display: 'flex',
    background: '#f1f5f9',
    padding: '4px',
    borderRadius: '12px',
    marginBottom: '20px',
    width: 'fit-content'
  },
  tabBtn: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    background: 'transparent',
    color: '#64748b',
    transition: 'all 0.2s'
  },
  tabBtnActive: {
    background: '#fff',
    color: '#1E3A5F',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
  }
};
//css des cartes societe et professionnel
const c = {
  listCard: {
    background: '#fff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  },
  listHeader: { display: 'flex', padding: '24px', gap: '24px', alignItems: 'center' },
  listLogoWrap: {
    width: '100px',
    height: '100px',
    borderRadius: '18px',
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
  },
  listLogo: { width: '100%', height: '100%', objectFit: 'cover' },
  listLogoFallback: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  listInfo: { flex: 1, minWidth: 0 },
  listName: { fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px' },
  listMeta: { fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 },
  listRating: { textAlign: 'right' },
  listStars: { display: 'flex', gap: 2, marginBottom: '6px', justifyContent: 'flex-end' },
  listReviewCount: {
    fontSize: '12px',
    color: '#fbbf24',
    fontWeight: '800',
    background: '#fef3c7',
    padding: '4px 10px',
    borderRadius: '12px',
    display: 'inline-block'
  },
  listActions: { paddingLeft: '24px', borderLeft: '1px solid #f1f5f9' },
  listBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#1E3A5F',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: '700',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    boxShadow: '0 4px 10px rgba(30, 58, 95, 0.15)'
  },
  serviceTag: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    background: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    whiteSpace: 'nowrap'
  }
};
//css de page home
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
  feedHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  feedTitle: { fontWeight: 800, fontSize: 20, color: "#0f172a", margin: 0 },
  feedScroll: { display: 'flex', flexDirection: 'column', gap: 20 },
  rightSidebar: { width: 320, flexShrink: 0, position: "sticky", top: 90 },
};
//css de feed (resultat de recherche)
const f = {
  center: { display: "flex", flexDirection: "column", alignItems: "center", gap: 15, padding: "80px 0" },
  loadingText: { color: "#94a3b8", fontSize: 15, margin: 0, fontWeight: 500 },
  empty: {
    background: "#ffffffff", border: "1px dashed #e2e8f0",
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
//css de Entreprises et professionnels à suivre
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
//css de Trouvez. Réservez. Payez en ligne.
const hero = {
  container: {
    padding: '3px 2px 0px',
    textAlign: 'center',
    background: 'linear-gradient(10deg, #f8fafc 0%, #ffffffff 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
    borderRadius: '24px',
  },
  title: {
    fontSize: '48px',
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: '20px',
    lineHeight: '1.2',
    maxWidth: '850px',
  },
  highlight: {
    color: '#3b82f6',
  },
  subtitle: {
    fontSize: '18px',
    color: '#64748b',
    maxWidth: '700px',
    lineHeight: '1.6',
    marginBottom: '50px',
    fontWeight: '500',
  },
  searchBar: {
    background: '#fff',
    padding: '10px',
    borderRadius: '100px',
    display: 'flex',
    alignItems: 'center',
    gap: '0px',
    boxShadow: '0 10px 50px rgba(0,0,0,0.06)',
    width: '100%',
    maxWidth: '1000px',
    border: '1px solid #e2e8f0',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 25px',
    flex: 1,
    minWidth: 0,
  },
  divider: {
    width: '1px',
    height: '35px',
    background: '#e2e8f0',
  },
  select: {
    border: 'none',
    background: 'none',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
    width: '100%',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '5px',
    flex: 1.5,
  },
  input: {
    border: 'none',
    background: 'none',
    fontSize: '15px',
    width: '100%',
    outline: 'none',
    color: '#1e293b',
    fontWeight: '500',
  },
  searchBtn: {
    background: '#2563eb',
    color: '#fff',
    padding: '15px 25px',
    borderRadius: '100px',
    border: 'none',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
    whiteSpace: 'nowrap',
  }
};
//css des card category
const cat = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '10px',
  },

  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '22px',
    minHeight: '130px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    transition: '0.3s',
  },

  iconWrap: {
    width: '45px',
    height: '45px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
  },

  name: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '5px',
  },

};

export default Home;
