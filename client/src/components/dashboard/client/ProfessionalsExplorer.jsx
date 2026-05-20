import React, { useState } from "react";
import { Filter, Search, Loader2, User } from "lucide-react";
import {
  useGetCategoriesQuery,
} from "../../../redux/features/company/companyApiSlice";
import {
  useSearchProfessionalsQuery
} from "../../../redux/features/professional/professionalApiSlice";
import ProfessionalCardHorizontal from "./ProfessionalCardHorizontal";
import { useNavigate } from "react-router-dom";

const ProfessionalsExplorer = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    q: "",
    category: ""
  });

  const { data: categories = [], isLoading: loadingCats } = useGetCategoriesQuery();
  const { data: professionals = [], isLoading: loadingPros, isFetching } = useSearchProfessionalsQuery(filters);

  const handleReset = () => {
    setFilters({ q: "", category: "" });
  };

  return (
    <div style={ex.container}>
      {/* Sidebar Filters */}
      <aside style={ex.sidebar}>
        <div style={ex.sidebarHeader}>
          <div style={ex.sidebarTitle}>
            <Filter size={18} />
            <span>Filtres</span>
          </div>
          <button style={ex.resetBtn} onClick={handleReset}>
            Réinitialiser
          </button>
        </div>

        <div style={ex.filterSection}>
          <h4 style={ex.sectionTitle}>Secteur d'activité</h4>
          <div style={ex.categoryList}>
            <label style={ex.radioLabel}>
              <input
                type="radio"
                name="category"
                checked={filters.category === ""}
                onChange={() => setFilters({ ...filters, category: "" })}
                style={ex.radio}
              />
              <span>Tous les domaines</span>
            </label>
            {categories.map(cat => (
              <label key={cat._id} style={ex.radioLabel}>
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat._id}
                  onChange={() => setFilters({ ...filters, category: cat._id })}
                  style={ex.radio}
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div style={ex.main}>
        {/* Search Bar */}
        <div style={ex.searchBar}>
          <Search size={20} color="#94a3b8" />
          <input
            type="text"
            placeholder="Rechercher un professionnel par son nom..."
            style={ex.searchInput}
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          {isFetching && <Loader2 size={18} color="#3b82f6" className="animate-spin" />}
        </div>

        {/* List */}
        <div style={ex.list}>
          {loadingPros ? (
            <div style={ex.loadingState}>
              <Loader2 size={40} color="#3b82f6" className="animate-spin" />
              <p>Recherche des meilleurs experts...</p>
            </div>
          ) : professionals.length > 0 ? (
            professionals.map(pro => (
              <ProfessionalCardHorizontal
                key={pro._id}
                pro={pro}
                onClick={() => navigate(`/pro/${pro._id}`)}
              />
            ))
          ) : (
            <div style={ex.emptyState}>
              <User size={60} color="#e2e8f0" />
              <h3>Aucun professionnel trouvé</h3>
              <p>Affinez vos critères de recherche pour trouver l'expert idéal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ex = {
  container: { display: "flex", gap: "30px", marginTop: "10px", alignItems: "flex-start" },
  sidebar: {
    width: "280px", flexShrink: 0, background: "#fff", borderRadius: "20px",
    padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    position: "sticky", top: "76px", border: "1px solid #f1f5f9"
  },
  sidebarHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", paddingBottom: "15px", borderBottom: "1px solid #f1f5f9" },
  sidebarTitle: { display: "flex", alignItems: "center", gap: "10px", fontSize: "18px", fontWeight: "800", color: "#0f172a" },
  resetBtn: { background: "none", border: "none", color: "#3b82f6", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: "5px" },
  filterSection: { marginBottom: "30px" },
  sectionTitle: { fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "15px", display: "block" },
  categoryList: { display: "flex", flexDirection: "column", gap: "12px" },
  radioLabel: { display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#475569", cursor: "pointer", transition: "color 0.2s ease" },
  radio: { accentColor: "#3b82f6", width: "16px", height: "16px", cursor: "pointer" },
  main: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "20px" },
  searchBar: { background: "#fff", borderRadius: "16px", padding: "4px 20px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height: "56px" },
  searchInput: { flex: 1, border: "none", background: "none", fontSize: "15px", color: "#0f172a", fontWeight: "500", outline: "none" },
  list: { display: "flex", flexDirection: "column", gap: "16px" },
  loadingState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px", color: "#64748b", gap: "15px" },
  emptyState: { textAlign: "center", padding: "80px 40px", color: "#64748b", background: "#fff", borderRadius: "20px", border: "1px dashed #e2e8f0" }
};

export default ProfessionalsExplorer;
