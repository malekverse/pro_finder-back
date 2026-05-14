import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader, Building2, MapPin, Users, UserPlus } from "lucide-react";
import { useGetSuggestedCompaniesQuery, useFollowCompanyMutation } from "../../../redux/features/company/companyApiSlice";
import { toImageUrl } from "../../../utils/imageUtils";

const SuggestedCompanies = ({ onSeeMore }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const { data: suggestions = [], isLoading } = useGetSuggestedCompaniesQuery(undefined, { pollingInterval: 10000 });
  const [followCompany, { isLoading: following }] = useFollowCompanyMutation();
  const [followedIds, setFollowedIds] = useState([]);

  const formatFollowers = (count) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count;
  };

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

  return (
    <div style={sg.card}>
      <p style={sg.title}>Entreprises à suivre</p>
      {isLoading ? (
        <div style={sg.loader}>
          <Loader size={20} color="#1E3A5F" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : suggestions.length === 0 ? (
        <p style={sg.empty}>Aucune suggestion pour l'instant.</p>
      ) : (
        <div style={sg.list}>
          {suggestions.slice(0, 5).map((company) => {
            const isFollowed = followedIds.includes(company._id);
            const logo = toImageUrl(company.logoUrl);
            return (
              <div key={company._id} style={sg.item}>
                <div style={sg.logoWrap} onClick={() => navigate(`/user/company/${company._id}`)}>
                  {logo
                    ? <img src={logo} alt={company.companyName} style={sg.logo} />
                    : <div style={sg.logoFallback}><Building2 size={16} color="#94a3b8" /></div>}
                </div>
                <div style={sg.info}>
                  <span style={sg.name} onClick={() => navigate(`/user/company/${company._id}`)}>
                    {company.companyName}
                  </span>
                  <div style={sg.meta}>
                    <span style={sg.followers}>{formatFollowers(company.followersCount ?? 0)} abonnés</span>
                  </div>
                </div>
                <button
                  style={{ ...sg.followBtn, ...(isFollowed ? sg.followBtnActive : {}) }}
                  onClick={() => handleFollow(company._id)}
                  disabled={following}
                >
                  {isFollowed ? "Suivi ✓" : "Suivre"}
                </button>
              </div>
            );
          })}
          
          <button style={sg.seeMore} onClick={onSeeMore}>
            Voir plus
          </button>
        </div>
      )}
    </div>
  );
};

const sg = {
  card: {
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", padding: "8px",
    display: "flex", flexDirection: "column", gap: 15
  },
  header: { display: "flex", alignItems: "center", gap: 12 },
  title: {
    fontWeight: 800, fontSize: 18, color: "#1e293b",margin: 0,
    display: "flex",justifyContent: "center",
  },
  loader: { display: "flex", justifyContent: "center", padding: "12px 0" },
  empty: { fontSize: 14, color: "#64748b", margin: 0, textAlign: "center", padding: "8px 0" },
  list: { display: "flex", flexDirection: "column", gap: 20 },
  item: { display: "flex", alignItems: "center", gap: 14 },
  logoWrap: { flexShrink: 0, cursor: "pointer" },
  logo: { width: 38, height: 38, borderRadius: 8, objectFit: "cover", border: "1px solid #f1f5f9" },
  logoFallback: {
    width: 48, height: 48, borderRadius: 12,
    background: "#f8fafc", border: "1px solid #f1f5f9",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 },
  name: {
    fontSize: 13, fontWeight: 700, color: "#1e293b",
    cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  meta: { display: "flex", alignItems: "center", gap: 4, color: "#64748b", fontSize: 11 },
  followers: { fontWeight: 500 },
  location: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  followBtn: {
    flexShrink: 0, fontSize: 13, fontWeight: 700,
    background: "transparent", color: "#0060fbff",
    border: "none", cursor: "pointer",
    transition: "all 0.2s", padding: "4px 8px"
  },
  followBtnActive: { color: "#94a3b8" },
  seeMore: {
    marginTop: 8, padding: "12px", background: "#f0f7ff", color: "#3b82f6",
    border: "none", borderRadius: 16, fontWeight: 700, fontSize: 13,
    cursor: "pointer", transition: "0.2s", textAlign: "center"
  }
};

export default SuggestedCompanies;