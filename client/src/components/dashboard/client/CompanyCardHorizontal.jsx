import React from "react";
import { Star, MapPin, Phone, ArrowUpRight, ShieldCheck, User, Users } from "lucide-react";
import { toImageUrl } from "../../../utils/imageUtils";

const CompanyCardHorizontal = ({ company, onClick }) => {
  const {
    companyName,
    logoUrl,
    description,
    city,
    country,
    phone,
    rating,
    isGenerated,
    categoryName,
    servicesList,
    followersCount
  } = company;

  const averageRating = rating?.average || 0;
  const reviewCount = rating?.count || 0;

  return (
    <div style={s.card} onClick={onClick}>
      {/* Image Section */}
      <div style={s.imageBox}>
        {logoUrl ? (
          <img src={toImageUrl(logoUrl)} alt={companyName} style={s.image} />
        ) : (
          <div style={s.placeholder}>
            <User size={48} color="#94a3b8" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div style={s.content}>
        <div style={s.header}>
          <div style={s.titleRow}>
            <h3 style={s.name}>{companyName}</h3>
            {isGenerated && (
              <div style={s.iaBadge}>
                <ShieldCheck size={12} />
                <span>IA</span>
              </div>
            )}
          </div>
          <div style={s.ratingBox}>
            <Star size={14} fill="#fbbf24" color="#fbbf24" />
            <span style={s.ratingVal}>{averageRating}</span>
          </div>
        </div>

        <p style={s.category}>{servicesList?.[0] || categoryName || "Multi-services"}</p>

        <p style={s.desc}>
          {description?.replace(/\[.*?\]/g, "").slice(0, 140)}
          {description?.length > 140 ? "..." : ""}
        </p>

        <div style={s.meta}>
          <div style={s.metaItem}>
            <MapPin size={14} />
            <span>{[city, country].filter(Boolean).join(", ")}</span>
          </div>
          <div style={s.metaItem}>
            <Users size={14} />
            <span>{followersCount || 0} abonnés</span>
          </div>
        </div>

        <div style={s.footer}>
          <div style={s.phone}>
            <Phone size={14} />
            <span>{phone || "Non renseigné"}</span>
          </div>
          <button style={s.profileBtn}>
            Voir le profil <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const s = {
  card: {
    display: "flex",
    background: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
    minHeight: "180px",
    border: "1px solid #f1f5f9",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 12px 24px -10px rgba(0,0,0,0.1)",
    }
  },
  imageBox: {
    width: "220px",
    flexShrink: 0,
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden"
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease"
  },
  placeholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
  },
  content: {
    flex: 1,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "4px"
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  name: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0
  },
  iaBadge: {
    background: "linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)",
    color: "#92400e",
    fontSize: "10px",
    fontWeight: "800",
    padding: "2px 6px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    boxShadow: "0 2px 4px rgba(251, 191, 36, 0.2)"
  },
  ratingBox: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "#fffbeb",
    padding: "4px 8px",
    borderRadius: "8px",
  },
  ratingVal: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#b45309"
  },
  category: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#3b82f6",
    margin: "0 0 10px"
  },
  desc: {
    fontSize: "13.5px",
    color: "#434e5cff",
    lineHeight: "1.5",
    margin: "0 0 12px",
    flex: 1
  },
  meta: {
    display: "flex",
    gap: "16px",
    marginBottom: "15px"
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#434e5cff",
    fontWeight: "500"
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: "12px",
    borderTop: "1px solid #f1f5f9"
  },
  phone: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  profileBtn: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    borderRadius: "6px",
    transition: "background 0.2s ease"
  }
};

export default CompanyCardHorizontal;
