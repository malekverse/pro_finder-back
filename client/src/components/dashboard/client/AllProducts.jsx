import React, { useState } from "react";
import { Loader, Star, BadgeCheck, ArrowUpRight, Search, Package } from "lucide-react";
import { useGetAllProductsQuery } from "../../../redux/features/products/productApiSlice";
import { toImageUrl } from "../../../utils/imageUtils";

const AllProducts = ({ onAction }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products = [], isLoading } = useGetAllProductsQuery(undefined, { pollingInterval: 3000 });

  const filteredProducts = products.filter(p => {
    const nameMatch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const companyMatch = (p.companyId?.companyName || p.professionalId?.fullName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return nameMatch || companyMatch;
  });

  if (isLoading) return <div style={f.center}><Loader size={28} className="animate-spin" color="#1E3A5F" /></div>;

  return (
    <div style={g.container}>
      <div style={g.searchWrapper}>
        <div style={g.searchInputContainer}>
          <Search size={18} color="#64748b" style={g.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher un produit ou un vendeur..."
            style={g.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={g.grid}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map(p => (
            <div
              key={p._id}
              className="product-card"
              style={g.card}
              onClick={() => onAction(p, 'product')}
            >
              <div style={g.imgWrapper}>
                {p.imagesProduct?.[0] ? (
                  <img src={toImageUrl(p.imagesProduct[0])} alt="" style={g.img} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                    <Package size={32} color="#cbd5e1" />
                  </div>
                )}
                <div style={g.badge}>PRODUIT</div>
                <div style={g.arrowBtn}>
                  <ArrowUpRight size={16} color="#fff" />
                </div>
              </div>

              <div style={g.content}>
                <div style={g.headerRow}>
                  <h3 style={g.title}>{p.name}</h3>
                  <div style={g.rating}>
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    <span>4.5</span>
                  </div>
                </div>

                <div style={g.companyRow}>
                  <span style={g.companyName}>
                    {p.companyId?.companyName || p.professionalId?.fullName || "Vendeur"}
                  </span>
                  <BadgeCheck size={14} color="#3b82f6" fill="#3b82f6" stroke="#fff" />
                </div>

                <div style={g.footer}>
                  <div style={g.priceSection}>
                    <div style={g.priceLabel}>PRIX</div>
                    <div style={g.priceValue}>
                      {p.price} DT <span style={g.unit}>{p.stock > 0 ? `/ en stock` : `/ épuisé`}</span>
                    </div>
                  </div>
                  <button style={g.actionBtn}>
                    Commander
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={g.noResults}>
            Aucun produit trouvé pour "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

const f = {
  center: { display: "flex", justifyContent: "center", alignItems: "center", padding: 60, minHeight: 200 },
};

const g = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  searchWrapper: {
    padding: '0 8px'
  },
  searchInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    maxWidth: '400px',
    width: '100%'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 40px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  grid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", 
    gap: "16px",
    padding: "8px"
  },
  card: { 
    background: "#fff", 
    borderRadius: "20px", 
    border: "1px solid #f1f5f9", 
    overflow: "hidden", 
    cursor: "pointer", 
    transition: "all 0.3s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  imgWrapper: { 
    position: 'relative', 
    width: '100%', 
    height: '140px', 
    overflow: 'hidden' 
  },
  img: { 
    width: "100%", 
    height: "100%", 
    objectFit: "cover" 
  },
  badge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '9px',
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: '0.5px'
  },
  arrowBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(4px)',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
  },
  content: { 
    padding: "12px" 
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '4px'
  },
  title: { 
    fontSize: "14px", 
    fontWeight: "800", 
    color: "#0f172a", 
    margin: 0,
    lineHeight: '1.2',
    flex: 1
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: '#fff9f0',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#f59e0b'
  },
  companyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '16px'
  },
  companyName: { 
    fontSize: "12px", 
    color: "#64748b",
    fontWeight: '500'
  },
  footer: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "flex-end" 
  },
  priceSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  priceLabel: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: '0.5px'
  },
  priceValue: { 
    fontSize: "18px", 
    fontWeight: "900", 
    color: "#0f172a" 
  },
  unit: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500'
  },
  actionBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  noResults: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '40px',
    color: '#64748b',
    fontSize: '14px'
  }
};

export default AllProducts;