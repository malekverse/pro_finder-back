import React from "react";
import { Loader, Building2, Package, ShoppingBag } from "lucide-react";
import { useGetAllProductsQuery } from "../../../redux/features/products/productApiSlice";
import { toImageUrl } from "../../../utils/imageUtils";

const AllProducts = ({ onAction }) => {
  const { data: products = [], isLoading } = useGetAllProductsQuery(undefined, { pollingInterval: 3000 });

  if (isLoading) return <div style={f.center}><Loader size={28} className="animate-spin" color="#1E3A5F" /></div>;

  return (
    <div style={g.grid}>
      {products.map(p => (
        <div
          key={p._id}
          className="grid-card"
          style={g.card}
          onClick={() => onAction(p, 'product')}
        >
          <div style={g.imgWrapper}>
            {p.imagesProduct?.[0] ? (
              <img src={toImageUrl(p.imagesProduct[0])} alt="" style={g.img} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <Package size={40} color="#cbd5e1" />
              </div>
            )}
            <div className="grid-overlay" style={g.overlay}>
              <ShoppingBag size={20} />
              <span>Commander</span>
            </div>
          </div>
          <div style={g.content}>
            <div style={g.companyName}><Building2 size={12} /> {p.companyId?.companyName}</div>
            <h3 style={g.title}>{p.name}</h3>
            <div style={g.footer}>
              <span style={g.price}>{p.price} TND</span>
              <span style={{ ...g.meta, color: '#16a34a' }}>{p.stock} en stock</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const f = {
  center: { display: "flex", justifyContent: "center", alignItems: "center", padding: 60, minHeight: 200 },
};

const g = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" },
  card: { background: "#fff", borderRadius: "12px", border: "1px solid #e9eef5", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" },
  imgWrapper: { position: 'relative', width: '100%', height: '160px', overflow: 'hidden' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(30, 58, 95, 0.8)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0, transition: 'opacity 0.2s', fontWeight: 700, fontSize: '14px' },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  content: { padding: "12px" },
  companyName: { fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" },
  title: { fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: "15px", fontWeight: "800", color: "#1E3A5F" },
  meta: { fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "3px" },
};

export default AllProducts;