import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader, X, MapPin, Building2 } from "lucide-react";
import { useSearchCompaniesQuery } from "../../../redux/features/company/companyApiSlice";
import { toImageUrl } from "../../../utils/imageUtils";

const CompanySearchBar = () => {
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
    }, 350);
  };

  const { data: results = [], isFetching } = useSearchCompaniesQuery({ q: debouncedQ }, {
    skip: !debouncedQ,
    pollingInterval: 10000
  });

  const clear = () => { setQuery(""); setDebouncedQ(""); setOpen(false); };
  const goTo = (id) => { navigate(`/user/company/${id}`); clear(); };

  return (
    <div ref={wrapRef} style={sr.wrap}>
      <div style={sr.inputRow}>
        <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
        <input
          style={sr.input}
          type="text"
          placeholder="Rechercher une entreprise..."
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {isFetching && (
          <Loader size={15} color="#94a3b8" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
        )}
        {query && !isFetching && (
          <button style={sr.clearBtn} onClick={clear}><X size={14} /></button>
        )}
      </div>

      {open && (
        <div style={sr.dropdown}>
          {results.length > 0 ? results.map((c) => {
            const logo = toImageUrl(c.logoUrl);
            return (
              <div
                key={c._id}
                style={sr.item}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                onMouseDown={() => goTo(c._id)}
              >
                {logo
                  ? <img src={logo} alt={c.companyName} style={sr.logo} />
                  : <div style={sr.logoFallback}><Building2 size={14} color="#94a3b8" /></div>}
                <div style={sr.itemInfo}>
                  <span style={sr.itemName}>{c.companyName}</span>
                  {c.city && <span style={sr.itemCity}><MapPin size={10} /> {c.city}</span>}
                </div>
              </div>
            );
          }) : (
            <div style={sr.noResult}>
              {isFetching ? "Recherche..." : `Aucun résultat pour « ${debouncedQ} »`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const sr = {
  wrap: { position: "relative" },
  inputRow: {
    display: "flex", alignItems: "center", gap: 10,
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, padding: "10px 14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  input: {
    flex: 1, border: "none", outline: "none",
    fontSize: 14, color: "#0f172a", background: "transparent",
  },
  clearBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#94a3b8", display: "flex", alignItems: "center", padding: 0, flexShrink: 0,
  },
  dropdown: {
    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
    zIndex: 50, overflow: "hidden",
  },
  item: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", cursor: "pointer", background: "transparent",
  },
  logo: { width: 36, height: 36, borderRadius: 8, objectFit: "cover", border: "1px solid #e9eef5", flexShrink: 0 },
  logoFallback: {
    width: 36, height: 36, borderRadius: 8,
    background: "#f1f5f9", border: "1px solid #e9eef5",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  itemInfo: { display: "flex", flexDirection: "column", gap: 1, flex: 1, minWidth: 0 },
  itemName: { fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  itemCity: { fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 },
  noResult: { padding: "14px 16px", fontSize: 13, color: "#94a3b8", textAlign: "center" },
};

export default CompanySearchBar;