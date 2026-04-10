import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../redux/features/cart/cartSlice";
import { X, Package, CheckCircle2, Heart, Star, Building2, ShoppingCart } from "lucide-react";
import { toImageUrl } from "../../../utils/imageUtils";

const ProductDetail = ({ product, onClose, onOrder }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedImg, setSelectedImg] = useState(product?.imagesProduct?.[0] || null);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAddToCart = () => {
    if (quantity > (product.stock || 0)) {
      alert("Quantité demandée supérieure au stock disponible !");
      return;
    }
    dispatch(addToCart({
      product,
      companyId: product.companyId?._id,
      companyName: product.companyId?.companyName,
      logoUrl: product.companyId?.logoUrl,
      quantity
    }));
    alert("Produit ajouté au panier !");
  };

  const incrementQty = () => {
    if (quantity < (product.stock || 0)) {
      setQuantity(prev => prev + 1);
    } else {
      alert("Stock maximum atteint !");
    }
  };
  const decrementQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div style={pd.overlay} onClick={onClose}>
      <div style={pd.modal} onClick={e => e.stopPropagation()}>
        <button style={pd.closeBtn} onClick={onClose}><X size={24} /></button>
        
        <div style={pd.container}>
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

          <div style={pd.midCol}>
            <h1 style={pd.title}>{product.name}</h1>
            <div style={pd.priceRow}>
              <span style={pd.currentPrice}>{product.price?.toLocaleString()} DT</span>
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
                <button style={pd.qtyBtn} onClick={decrementQty}>-</button>
                <input type="text" value={quantity} readOnly style={pd.qtyInput} />
                <button style={pd.qtyBtn} onClick={incrementQty}>+</button>
              </div>
            </div>

            <div style={pd.actionRow}>
              <button style={pd.buyBtn} onClick={() => onOrder({...product, quantity})}>ACHETER MAINTENANT</button>
              <button style={pd.cartBtn} onClick={handleAddToCart}>
                <ShoppingCart size={18} /> AJOUTER AU PANIER
              </button>
              <button style={pd.wishBtn}><Heart size={20} /></button>
            </div>

            <div style={pd.overview}>
              <h3 style={pd.overviewTitle}>DESCRIPTION DU PRODUIT</h3>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                {product.description || 'Aucune description disponible'}
              </p>
            </div>
          </div>

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
              <button style={pd.visitBtn} onClick={() => navigate(`/user/company/${product.companyId?._id}`)}>
                VISITER LA BOUTIQUE
              </button>
            </div>

            <div style={pd.shippingInfo}>
            </div>
          </div>
        </div>
      </div>
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
  currentPrice: { fontSize: '28px', fontWeight: '800', color: '#1e293b' },
  statusRow: { display: 'flex', gap: '20px', alignItems: 'center' },
  status: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#10b981' },
  sku: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
  divider: { height: '1px', background: '#e2e8f0', margin: '5px 0' },
  qtySection: { display: 'flex', alignItems: 'center', gap: '20px' },
  qtyLabel: { fontSize: '13px', fontWeight: '700', color: '#1e293b' },
  qtyBox: { display: 'flex', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' },
  qtyBtn: { width: '32px', height: '32px', background: '#fff', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' },
  qtyInput: { width: '40px', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', background: '#fff' },
  actionRow: { display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap' },
  buyBtn: { flex: '1 1 100%', padding: '14px', background: '#24416b', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase' },
  cartBtn: { flex: 1, padding: '14px', background: '#fff', color: '#24416b', border: '1px solid #24416b', borderRadius: '30px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  wishBtn: { width: '48px', height: '48px', border: '1px solid #e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' },
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

export default ProductDetail;