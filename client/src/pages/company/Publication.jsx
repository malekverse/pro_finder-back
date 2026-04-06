import { useGetMyPostsQuery } from "../../redux/features/posts/postApiSlice";
import PostCreate from "../../components/Posts/PostCreate";
import PostCard   from "../../components/Posts/PostCard";
import { Loader, Newspaper } from "lucide-react";

const Publication = () => {
  const { data: posts, isLoading, refetch } = useGetMyPostsQuery(undefined, { pollingInterval: 3000 });

  const safePosts = Array.isArray(posts) ? posts : [];

  return (
    <div style={p.page}>
      {/* ── En-tête ── */}
      <div style={p.pageHeader}>
        <div style={p.titleRow}>
          <Newspaper size={22} color="#1E3A5F" />
          <h2 style={p.title}>Mes Publications</h2>
        </div>
        <p style={p.subtitle}>
          {safePosts.length > 0
            ? `${safePosts.length} publication${safePosts.length > 1 ? "s" : ""}`
            : "Partagez vos actualités avec votre réseau"}
        </p>
      </div>

      {/* ── Créer un post ── */}
      <PostCreate onSuccess={refetch} />

      {/* ── Liste ── */}
      {isLoading ? (
        <div style={p.loadingWrap}>
          <Loader size={28} color="#1E3A5F" style={{ animation: "spin 1s linear infinite" }} />
          <p style={p.loadingText}>Chargement...</p>
        </div>
      ) : safePosts.length === 0 ? (
        <div style={p.emptyWrap}>
          <div style={p.emptyIcon}>📝</div>
          <p style={p.emptyTitle}>Aucune publication pour le moment</p>
          <p style={p.emptyText}>Créez votre premier post et partagez-le avec votre réseau professionnel.</p>
        </div>
      ) : (
        <div>
          {safePosts.map((post) => (
            <PostCard key={post._id} post={post} onDeleted={refetch} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const p = {
  page: { maxWidth: 660, margin: "0 auto", padding: "8px 0 40px", width: "100%" },
  pageHeader: { marginBottom: 20 },
  titleRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  title: { fontWeight: 800, fontSize: 22, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" },
  subtitle: { fontSize: 13, color: "#94a3b8", margin: 0, paddingLeft: 32 },
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "60px 0" },
  loadingText: { color: "#94a3b8", fontSize: 14, margin: 0 },
  emptyWrap: {
    background: "#fff", border: "1px dashed #e2e8f0",
    borderRadius: 14, padding: "48px 30px",
    textAlign: "center", marginTop: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16, display: "block" },
  emptyTitle: { fontWeight: 700, fontSize: 17, color: "#1e293b", margin: "0 0 8px" },
  emptyText: { fontSize: 14, color: "#94a3b8", margin: "0 auto", lineHeight: 1.7, maxWidth: 280 },
};

export default Publication;