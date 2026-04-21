import React, { useState } from "react";
import { X, ShieldCheck, Star, Building2, Package, ShoppingCart, Plus, Minus, ArrowRight, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../redux/features/cart/cartSlice";
import { toImageUrl } from "../../../utils/imageUtils";

const ProductDetail = ({ product, onClose, onOrder }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedImg, setSelectedImg] = useState(product?.imagesProduct?.[0] || null);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAddToCart = () => {
    const sellerId = product.companyId?._id || product.professionalId?._id || product.companyId || product.professionalId;
    const sellerName = product.companyId?.companyName || product.professionalId?.fullName || "Vendeur";
    const sellerLogo = product.companyId?.logoUrl || product.professionalId?.photoProfessional;

    dispatch(addToCart({
      product,
      companyId: sellerId,
      companyName: sellerName,
      logoUrl: sellerLogo,
      quantity
    }));
    onClose();
  };

  const incrementQty = () => setQuantity(prev => prev + 1);
  const decrementQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div style={pd.overlay} onClick={onClose}>
      <div style={pd.modal} onClick={e => e.stopPropagation()}>
        <button type="button" style={pd.closeBtn} onClick={onClose} className="close-btn">
          <X size={22} />
        </button>
        
        <div style={pd.container}>
          {/* Section Gauche : Galerie d'images */}
          <div style={pd.leftCol}>
            <div style={pd.mainImgBox}>
              {selectedImg ? (
                <img src={toImageUrl(selectedImg)} alt={product.name} style={pd.mainImg} />
              ) : (
                <Package size={80} color="#cbd5e1" />
              )}
            </div>
            <div style={pd.thumbList}>
              {product.imagesProduct?.map((img, i) => (
                <div 
                  key={i} 
                  style={{...pd.thumbBox, border: selectedImg === img ? '2px solid #1E3A5F' : '1px solid #e2e8f0'}}
                  onMouseEnter={() => setSelectedImg(img)}
                  className="thumb-item"
                >
                  <img src={toImageUrl(img)} alt="" style={pd.thumb} />
                </div>
              ))}
            </div>
          </div>

          {/* Section Centrale : Détails du produit */}
          <div style={pd.midCol}>
            <div style={pd.breadcrumb}>
              <span style={pd.categoryTag}>Produit</span>
              <span style={pd.sku}>SKU: {product._id.slice(-8).toUpperCase()}</span>
            </div>
            
            <h1 style={pd.title}>{product.name}</h1>
            
            <div style={pd.priceSection}>
              <span style={pd.currentPrice}>{product.price?.toLocaleString()} DT</span>
              {product.oldPrice && <span style={pd.oldPrice}>{product.oldPrice?.toLocaleString()} DT</span>}
            </div>

            <div style={pd.statusRow}>
              <div style={pd.statusBadge}>
                <ShieldCheck size={14} /> <span>EN STOCK</span>
              </div>
              <div style={pd.ratingOverview}>
                <div style={pd.stars}>
                  {[1, 2, 3, 4].map(s => <Star key={s} size={14} fill="#fbbf24" color="#fbbf24" />)}
                  <Star size={14} color="#cbd5e1" />
                </div>
                <span style={pd.ratingLabel}>4.0 (12 avis)</span>
              </div>
            </div>

            <div style={pd.divider} />

            {/* Quantité */}
            <div style={pd.qtySection}>
              <span style={pd.sectionLabel}>Quantité</span>
              <div style={pd.qtyBox}>
                <button type="button" style={pd.qtyBtn} onClick={decrementQty}><Minus size={16} /></button>
                <span style={pd.qtyValue}>{quantity}</span>
                <button type="button" style={pd.qtyBtn} onClick={incrementQty}><Plus size={16} /></button>
              </div>
            </div>

            {/* Actions */}
            <div style={pd.actionRow}>
              <button 
                type="button" 
                style={pd.buyBtn} 
                onClick={() => onOrder(product)}
                className="btn-primary"
              >
                <span>Acheter maintenant</span>
                <ArrowRight size={18} />
              </button>
              <button 
                type="button" 
                style={pd.cartBtn} 
                onClick={handleAddToCart}
                className="btn-outline"
              >
                <ShoppingCart size={18} />
                <span>Ajouter au panier</span>
              </button>
            </div>

            {/* Description */}
            <div style={pd.overview}>
              <h3 style={pd.overviewTitle}>À propos de ce produit</h3>
              <p style={pd.description}>
                {product.description || 'Aucune description disponible pour ce produit premium.'}
              </p>
            </div>
          </div>

          {/* Section Droite : Vendeur */}
          <div style={pd.rightCol}>
            <div style={pd.sellerCard}>
              <div style={pd.sellerInfo}>
                <div style={pd.sellerLogo}>
                  {(product.companyId?.logoUrl || product.professionalId?.photoProfessional) ? (
                    <img src={toImageUrl(product.companyId?.logoUrl || product.professionalId?.photoProfessional)} alt="" style={pd.logo} />
                  ) : (
                    <Store size={24} color="#1E3A5F" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={pd.sellerName}>{product.companyId?.companyName || product.professionalId?.fullName || 'Boutique Pro'}</h4>
                  <div style={pd.sellerTag}>Vendeur Vérifié</div>
                </div>
              </div>
              
              <div style={pd.sellerStats}>
                <div style={pd.statItem}>
                  <span style={pd.statValue}>4.8</span>
                  <span style={pd.statLabel}>Note</span>
                </div>
                <div style={pd.statDivider} />
                <div style={pd.statItem}>
                  <span style={pd.statValue}>+100</span>
                  <span style={pd.statLabel}>Ventes</span>
                </div>
              </div>

              <button 
                type="button" 
                style={pd.visitBtn} 
                onClick={() => {
                  if (product.professionalId) {
                    navigate(`/user/professional/${product.professionalId?._id || product.professionalId}`);
                  } else {
                    navigate(`/user/company/${product.companyId?._id || product.companyId}`);
                  }
                }}
                className="btn-seller"
              >
                Visiter la boutique
              </button>
            </div>
            
            <div style={pd.securityCard}>
              <div style={pd.securityItem}>
                <ShieldCheck size={18} color="#10b981" />
                <span>Paiement sécurisé</span>
              </div>
              <div style={pd.securityItem}>
                <Package size={18} color="#3b82f6" />
                <span>Livraison rapide</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .thumb-item:hover { transform: translateY(-2px); border-color: #1E3A5F !important; }
        .btn-primary { 
          background: linear-gradient(135deg, #1E3A5F 0%, #2c5282 100%) !important; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; 
          box-shadow: 0 4px 15px rgba(30, 58, 95, 0.2); 
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(30, 58, 95, 0.3); opacity: 0.9; }
        .btn-outline { 
          transition: all 0.2s ease !important; 
          white-space: nowrap !important;
        }
        .btn-outline:hover { 
          background: #f8fafc !important; 
          border-color: #0f172a !important; 
          transform: translateY(-2px); 
        }
        .btn-seller:hover { background: #1E3A5F !important; color: #fff !important; }
        .close-btn:hover { background: #ef4444 !important; color: #fff !important; transform: rotate(90deg); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .pd-modal { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

const pd = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#fff', width: '100%', maxWidth: '1150px', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' },
  closeBtn: { position: 'absolute', top: '24px', right: '24px', background: '#f8fafc', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: '0.3s' },
  container: { display: 'grid', gridTemplateColumns: '420px 1fr 280px', gap: '40px', padding: '48px', overflowY: 'auto' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  mainImgBox: { width: '100%', aspectRatio: '1/1', background: '#f8fafc', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #f1f5f9' },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbList: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  thumbBox: { width: '75px', height: '75px', borderRadius: '12px', cursor: 'pointer', overflow: 'hidden', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid #e2e8f0' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  midCol: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: '12px' },
  categoryTag: { background: '#eff6ff', color: '#3b82f6', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' },
  sku: { fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.5px' },
  title: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0', lineHeight: 1.2 },
  priceSection: { display: 'flex', alignItems: 'baseline', gap: '12px', margin: '8px 0' },
  currentPrice: { fontSize: '28px', fontWeight: '800', color: '#1E3A5F' },
  oldPrice: { fontSize: '18px', color: '#94a3b8', textDecoration: 'line-through' },
  statusRow: { display: 'flex', alignItems: 'center', gap: '24px' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' },
  ratingOverview: { display: 'flex', alignItems: 'center', gap: '8px' },
  stars: { display: 'flex', gap: '2px' },
  ratingLabel: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
  divider: { height: '1px', background: '#f1f5f9', margin: '8px 0' },
  sectionLabel: { fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' },
  qtySection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  qtyBox: { display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid #e2e8f0' },
  qtyBtn: { width: '36px', height: '36px', background: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A5F', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  qtyValue: { width: '48px', textAlign: 'center', fontSize: '15px', fontWeight: '700', color: '#0f172a' },
  actionRow: { display: 'flex', gap: '16px', marginTop: '12px' },
  buyBtn: { flex: 1.4, height: '56px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '0 24px' },
  cartBtn: { flex: 1.2, height: '56px', background: '#fff', color: '#0f172a', border: '2px solid #0f172a', borderRadius: '16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '0 20px' },
  overview: { marginTop: '16px' },
  overviewTitle: { fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px' },
  description: { fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: 0 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sellerCard: { padding: '24px', border: '1px solid #f1f5f9', borderRadius: '24px', background: '#f8fafc', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  sellerInfo: { display: 'flex', gap: '14px', marginBottom: '24px' },
  sellerLogo: { width: '52px', height: '52px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: '100%', height: '100%', objectFit: 'cover' },
  sellerName: { fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px' },
  sellerTag: { fontSize: '11px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase' },
  sellerStats: { display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: '#fff', padding: '12px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #f1f5f9' },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statValue: { fontSize: '15px', fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: '11px', color: '#94a3b8', fontWeight: '600' },
  statDivider: { width: '1px', height: '24px', background: '#f1f5f9' },
  visitBtn: { width: '100%', padding: '12px', background: '#fff', border: '1px solid #1E3A5F', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#1E3A5F', cursor: 'pointer', transition: '0.2s' },
  securityCard: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 8px' },
  securityItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#64748b', fontWeight: '500' }
};

export default ProductDetail;
