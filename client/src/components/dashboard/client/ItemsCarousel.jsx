import React, { useRef } from "react";
import { ChevronRight, ChevronLeft, ShoppingBag, CalendarCheck, Package, Wrench } from "lucide-react";
import { toImageUrl } from "../../../utils/imageUtils";

const ItemsCarousel = ({ title, items, type, onSeeMore, onAction }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div style={c.container}>
      <div style={c.header}>
        <h2 style={c.title}>{title}</h2>
        <button onClick={onSeeMore} style={c.seeMore}>Voir plus <ChevronRight size={14} /></button>
      </div>

      <div style={c.wrapper}>
        <button onClick={() => scroll('left')} style={{ ...c.navBtn, left: -15 }}><ChevronLeft size={20} /></button>
        <div ref={scrollRef} style={c.scrollArea}>
          {items.map((item) => {
            const itemImages = type === 'product' ? item.imagesProduct : item.imagesServices;
            return (
              <div key={item._id} className="carousel-card" style={c.card} onClick={() => onAction(item)}>
                <div style={c.imgContainer}>
                  {itemImages?.[0] ? (
                    <img src={toImageUrl(itemImages[0])} alt={item.name} style={c.img} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                      {type === 'product' ? <Package size={40} color="#cbd5e1" /> : <Wrench size={40} color="#cbd5e1" />}
                    </div>
                  )}
                  <div className="action-overlay" style={c.actionOverlay}>
                    {type === 'product' ? <ShoppingBag size={20} /> : <CalendarCheck size={20} />}
                    <span>{type === 'product' ? 'Commander' : 'Réserver'}</span>
                  </div>
                </div>
                <div style={c.info}>
                  <p style={c.itemName}>{item.name}</p>
                  <div style={c.footer}>
                    <p style={c.itemPrice}>{item.price} TND</p>
                    <p style={c.companyName}>@{item.companyId?.companyName || item.professionalId?.fullName}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => scroll('right')} style={{ ...c.navBtn, right: -15 }}><ChevronRight size={20} /></button>
      </div>
    </div>
  );
};

const c = {
  container: { marginBottom: 36, padding: "0" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 800, color: "#1e293b", margin: 0, letterSpacing: "-0.5px", display: 'flex', alignItems: 'center', gap: 8 },
  seeMore: { background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: 'all 0.2s', padding: '6px 12px', borderRadius: '8px' },
  wrapper: { position: "relative", display: "flex", alignItems: "center" },
  scrollArea: { display: "flex", gap: 16, overflowX: "hidden", padding: "4px 0" },
  card: { minWidth: 150, width: 150, cursor: "pointer", transition: 'transform 0.2s', position: 'relative' },
  imgContainer: { width: "100%", height: 150, borderRadius: "20px", overflow: "hidden", marginBottom: 10, background: "#fff", position: 'relative', boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  img: { width: "100%", height: "100%", objectFit: "cover", transition: 'scale 0.3s' },
  actionOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(30, 58, 95, 0.8)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0, transition: 'opacity 0.2s', fontWeight: 700, fontSize: '13px' },
  info: { display: "flex", flexDirection: "column", gap: 2 },
  itemName: { fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { fontSize: 13, fontWeight: 800, color: "#1E3A5F", margin: 0 },
  companyName: { fontSize: 10, color: "#94a3b8", margin: 0, fontWeight: 600 },
  navBtn: { position: "absolute", zIndex: 10, width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", color: '#1e293b' }
};

export default ItemsCarousel;