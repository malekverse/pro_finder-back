import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader, X, MapPin, Building2, User } from "lucide-react";
import { useSearchCompaniesQuery } from "../../../redux/features/company/companyApiSlice";
import { useSearchProfessionalsQuery } from "../../../redux/features/professional/professionalApiSlice";
import { toImageUrl } from "../../../utils/imageUtils";

const GlobalSearchBar = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(v.trim());
      if (v.trim()) setOpen(true);
      else setOpen(false);
    }, 400);
  };

  // Recherches parallèles
  const { data: companies = [], isFetching: isFetchingCos } = useSearchCompaniesQuery({ q: debouncedQ }, { skip: !debouncedQ });
  const { data: pros = [], isFetching: isFetchingPros } = useSearchProfessionalsQuery({ q: debouncedQ }, { skip: !debouncedQ });

  const isFetching = isFetchingCos || isFetchingPros;

  const clear = () => { setQuery(""); setDebouncedQ(""); setOpen(false); };
  
  const results = [
    ...companies.map(c => ({ ...c, type: 'company' })),
    ...pros.map(p => ({ ...p, type: 'pro' }))
  ].slice(0, 10);

  const handleSelect = (item) => {
    if (item.type === 'company') navigate(`/societe/${item._id}`);
    else navigate(`/pro/${item._id}`);
    clear();
  };

  return (
    <div ref={wrapRef} style={sr.wrap}>
      <div style={sr.inputRow}>
        <Search size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
        <input
          style={sr.input}
          type="text"
          placeholder="Trouver une entreprise ou un expert..."
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {isFetching && (
          <Loader size={16} color="#3b82f6" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
        )}
        {query && !isFetching && (
          <button style={sr.clearBtn} onClick={clear}><X size={16} /></button>
        )}
      </div>

      {open && (
        <div style={sr.dropdown}>
          {results.length > 0 ? (
            <div style={sr.resultsList}>
              {results.map((res) => (
                <div
                  key={`${res.type}-${res._id}`}
                  style={sr.item}
                  onClick={() => handleSelect(res)}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={sr.logoWrapper}>
                    {res.type === 'company' ? (
                      res.logoUrl ? <img src={toImageUrl(res.logoUrl)} style={sr.logo} alt="" /> : <Building2 size={16} color="#94a3b8" />
                    ) : (
                      res.photoProfessional ? <img src={toImageUrl(res.photoProfessional)} style={sr.logo} alt="" /> : <User size={16} color="#94a3b8" />
                    )}
                  </div>
                  <div style={sr.itemContent}>
                    <div style={sr.nameRow}>
                      <span style={sr.itemName}>{res.companyName || res.fullName}</span>
                      <span style={{ ...sr.typeBadge, background: res.type === 'company' ? '#eff6ff' : '#f0fdf4', color: res.type === 'company' ? '#2563eb' : '#16a34a' }}>
                        {res.type === 'company' ? 'Entreprise' : 'Professionnel'}
                      </span>
                    </div>
                    {res.city && (
                      <span style={sr.itemMeta}><MapPin size={10} /> {res.city}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={sr.empty}>
              {isFetching ? "Recherche en cours..." : `Aucun résultat pour "${debouncedQ}"`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const sr = {
  wrap: { position: "relative", width: "100%" },
  inputRow: {
    display: "flex", alignItems: "center", gap: 12,
    background: "#fff", border: "1.5px solid #f1f5f9",
    borderRadius: 16, padding: "12px 18px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },
  input: {
    flex: 1, border: "none", outline: "none", fontSize: "14px",
    fontWeight: "500", color: "#0f172a", background: "transparent",
  },
  clearBtn: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" },
  dropdown: {
    position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
    background: "#fff", borderRadius: 20, boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
    border: "1px solid #f1f5f9", zIndex: 1000, overflow: "hidden",
  },
  resultsList: { padding: "8px" },
  item: {
    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
    borderRadius: 12, cursor: "pointer", transition: "0.2s",
  },
  logoWrapper: {
    width: 40, height: 40, borderRadius: 10, background: "#f8fafc",
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    border: "1px solid #f1f5f9", flexShrink: 0,
  },
  logo: { width: "100%", height: "100%", objectFit: "cover" },
  itemContent: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 },
  nameRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  itemName: { fontSize: 13, fontWeight: "700", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  typeBadge: { fontSize: "9px", fontWeight: "800", padding: "2px 6px", borderRadius: "6px", textTransform: "uppercase" },
  itemMeta: { fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 },
  empty: { padding: "30px 20px", textAlign: "center", color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
};

export default GlobalSearchBar;