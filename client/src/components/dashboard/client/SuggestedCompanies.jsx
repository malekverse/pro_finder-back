import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, Building2, MapPin, Users } from "lucide-react";
import { useGetSuggestedCompaniesQuery, useFollowCompanyMutation } from "../../../redux/features/company/companyApiSlice";
import { toImageUrl } from "../../../utils/imageUtils";

const SuggestedCompanies = () => {
  const navigate = useNavigate();
  const { data: suggestions = [], isLoading } = useGetSuggestedCompaniesQuery(undefined, { pollingInterval: 10000 });
  const [followCompany, { isLoading: following }] = useFollowCompanyMutation();
  const [followedIds, setFollowedIds] = useState([]);

  const handleFollow = async (companyId) => {
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
          {suggestions.map((company) => {
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
                  <span style={sg.city}>
                    <MapPin size={11} />
                    {company.city ? (
                      `${company.city}${company.country ? ', ' + company.country : ''}`
                    ) : "Tunisie"}
                  </span>
                  <span style={sg.city}>
                    <Users size={11} />
                    {company.followersCount ?? 0} abonnés
                  </span>
                </div>
                <button
                  style={{ ...sg.followBtn, ...(isFollowed ? sg.followBtnActive : {}) }}
                  onClick={() => handleFollow(company._id)}
                  disabled={following}
                >
                  {isFollowed ? "Suivi ✓" : "+ Suivre"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const sg = {
  card: {
    background: "#fff", border: "1px solid #e9eef5",
    borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", padding: "18px 16px",
  },
  title: {
    fontWeight: 800, fontSize: 13, color: "#0f172a",
    margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.05em",
  },
  loader: { display: "flex", justifyContent: "center", padding: "12px 0" },
  empty: { fontSize: 13, color: "#94a3b8", margin: 0, textAlign: "center", padding: "8px 0" },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  item: { display: "flex", alignItems: "center", gap: 10 },
  logoWrap: { flexShrink: 0, cursor: "pointer" },
  logo: { width: 38, height: 38, borderRadius: 8, objectFit: "cover", border: "1px solid #e9eef5" },
  logoFallback: {
    width: 38, height: 38, borderRadius: 8,
    background: "#f1f5f9", border: "1px solid #e9eef5",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 },
  name: {
    fontSize: 13, fontWeight: 700, color: "#0f172a",
    cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  city: { fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 },
  followBtn: {
    flexShrink: 0, fontSize: 12, fontWeight: 700, padding: "5px 10px",
    background: "#1E3A5F", color: "#fff",
    border: "none", borderRadius: 6, cursor: "pointer",
    transition: "all 0.2s", whiteSpace: "nowrap",
  },
  followBtnActive: { background: "#e2e8f0", color: "#1e293b" },
};

export default SuggestedCompanies;