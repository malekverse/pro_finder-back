import React, { useState } from "react";
import { X, Heart, ShieldCheck, Star, Building2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {toImageUrl } from "../../../utils/imageUtils";

const ProductDetail = ({ product, onClose, onOrder }) => {
  const navigate = useNavigate();
  const [selectedImg, setSelectedImg] = useState(product?.imagesProduct?.[0] || null);

  if (!product) return null;

  return (
    <div style={pd.overlay} onClick={onClose}>
      <div style={pd.modal} onClick={e => e.stopPropagation()}>
        <button type="button" style={pd.closeBtn} onClick={onClose}><X size={24} /></button>
        
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
              <span style={pd.status}>
                <ShieldCheck size={16} /> EN STOCK
              </span>
              <span style={pd.sku}>SKU: {product._id.slice(-8).toUpperCase()}</span>
            </div>

            <div style={pd.divider} />

            <div style={pd.qtySection}>
              <span style={pd.qtyLabel}>QUANTITÉ</span>
              <div style={pd.qtyBox}>
                <button type="button" style={pd.qtyBtn}>-</button>
                <input type="text" value="1" readOnly style={pd.qtyInput} />
                <button type="button" style={pd.qtyBtn}>+</button>
              </div>
            </div>

            <div style={pd.actionRow}>
              <button type="button" style={pd.buyBtn} onClick={() => onOrder(product)}>ACHETER MAINTENANT</button>
              <button type="button" style={pd.wishBtn}><Heart size={20} /></button>
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
                    < Star size={12} fill="#fbbf24" color="#fbbf24" />
                    < Star size={12} fill="#fbbf24" color="#fbbf24" />
                    < Star size={12} fill="#fbbf24" color="#fbbf24" />
                    < Star size={12} fill="#fbbf24" color="#fbbf24" />
                    < Star size={12} color="#cbd5e1" />
                    <span style={pd.ratingCount}>5</span>
                  </div>
                </div>
              </div>
              <button type="button" style={pd.visitBtn} onClick={() => navigate(`/user/company/${product.companyId?._id}`)}>
                VISITER L'ENTREPRISE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const pd = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#fff', width: '100%', maxWidth: '1100px', borderRadius: '16px', position: 'relative', overflow: 'hidden', maxHeight: '95vh', display: 'flex', flexDirection: 'column' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', zIndex: 10 },
  container: { display: 'flex', gap: '30px', padding: '40px', overflowY: 'auto' },
  leftCol: { width: '400px', flexShrink: 0 },
  mainImgBox: { width: '100%', aspectRatio: '1/1', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '15px' },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbList: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  thumbBox: { width: '70px', height: '70px', borderRadius: '8px', cursor: 'pointer', overflow: 'hidden', transition: '0.2s' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  midCol: { flex: 1, minWidth: 0 },
  title: { fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' },
  priceRow: { marginBottom: '20px' },
  currentPrice: { fontSize: '24px', fontWeight: '800', color: '#1E3A5F' },
  statusRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' },
  status: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '700', color: '#10b981' },
  sku: { fontSize: '12px', fontWeight: '600', color: '#94a3b8' },
  divider: { height: '1px', background: '#e2e8f0', margin: '25px 0' },
  qtySection: { marginBottom: '25px' },
  qtyLabel: { fontSize: '12px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '10px', textTransform: 'uppercase' },
  qtyBox: { display: 'flex', alignItems: 'center', width: 'fit-content', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
  qtyBtn: { width: '40px', height: '40px', background: '#fff', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: '600', color: '#1E3A5F', transition: '0.2s' },
  qtyInput: { width: '50px', height: '40px', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#1E3A5F' },
  actionRow: { display: 'flex', gap: '15px', marginBottom: '35px' },
  buyBtn: { flex: 1, height: '52px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' },
  wishBtn: { width: '52px', height: '52px', background: '#f1f5f9', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' },
  overviewTitle: { fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px', textTransform: 'uppercase' },
  rightCol: { width: '280px', flexShrink: 0 },
  sellerCard: { padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' },
  sellerHeader: { display: 'flex', gap: '12px', marginBottom: '20px' },
  sellerLogo: { width: '48px', height: '48px', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: '100%', height: '100%', objectFit: 'cover' },
  sellerName: { fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' },
  sellerRating: { display: 'flex', alignItems: 'center', gap: '2px' },
  ratingCount: { fontSize: '12px', color: '#94a3b8', marginLeft: '4px', fontWeight: '600' },
  visitBtn: { width: '100%', padding: '10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#1E3A5F', cursor: 'pointer', transition: '0.2s' }
};

export default ProductDetail;
