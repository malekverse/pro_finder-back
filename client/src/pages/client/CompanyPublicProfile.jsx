import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetPublicCompanyProfileQuery,
  useFollowCompanyMutation,
  useCheckFollowStatusQuery,
} from "../../redux/features/company/companyApiSlice";
import { useGetPostsByCompanyQuery } from "../../redux/features/posts/postApiSlice";
import PostCard from "../../components/posts/PostCard";
import {
  ArrowLeft, Building2, Globe, Mail, Phone,
  MapPin, Newspaper, Loader, UserCheck, UserPlus,
} from "lucide-react";

const SERVER_URL = "http://localhost:5000";

const toImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("data:")) return url;
  if (!url.includes("/") && !url.includes("\\") && url.length > 100)
    return `data:image/jpeg;base64,${url}`;
  const clean = url.startsWith("/") ? url.slice(1) : url;
  return `${SERVER_URL}/${clean}`;
};

const CompanyPublicProfile = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [page, setPage] = useState(1);

  // ✅ Vérifier le statut de suivi depuis le backend (polling 5s)
  const {
    data: followStatusData,
    refetch: refetchFollowStatus,
  } = useCheckFollowStatusQuery(companyId, {
    skip: !companyId,
    pollingInterval: 5000,
  });

  const isFollowed = followStatusData?.isFollowing ?? false;

  const [followCompany, { isLoading: following }] = useFollowCompanyMutation();

  const { data: company, isLoading: loadingProfile, refetch: refetchProfile } =
    useGetPublicCompanyProfileQuery(companyId, {
      skip: !companyId,
      pollingInterval: 5000,
    });

  const {
    data: postsData,
    isLoading: loadingPosts,
    isFetching,
    refetch: refetchPosts,
  } = useGetPostsByCompanyQuery(
    { companyId, page, limit: 10 },
    { skip: !companyId, pollingInterval: 5000 }
  );

  useEffect(() => {
    setPage(1);
  }, [companyId]);

  const handleFollow = async () => {
    try {
      await followCompany({ companyId, isFollowed }).unwrap();
      // Refetch immédiat après l'action
      refetchFollowStatus();
      refetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const posts = postsData?.posts ?? [];
  const totalPages = postsData?.totalPages ?? 0;

  const location = useMemo(
    () => [company?.cityName, company?.regionName, company?.countryName].filter(Boolean).join(", "),
    [company]
  );

  if (loadingProfile) {
    return (
      <div style={s.page}>
        <div style={s.loadingCard}>
          <Loader size={24} style={{ animation: "spin 1s linear infinite" }} />
          <span>Chargement du profil...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!company) {
    return (
      <div style={s.page}>
        <div style={s.card}>Profil entreprise introuvable.</div>
      </div>
    );
  }

  const logo = toImageUrl(company.logoUrl);
  const cover = toImageUrl(company.coverUrl);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button type="button" onClick={() => navigate(-1)} style={s.backBtn}>
          <ArrowLeft size={16} /> Retour
        </button>

        <div style={s.card}>
          <div style={s.cover}>
            {cover ? <img src={cover} alt="cover" style={s.coverImg} /> : null}
          </div>

          <div style={s.header}>
            {logo ? (
              <img src={logo} alt="logo company" style={s.logo} />
            ) : (
              <div style={s.logoFallback}>
                <Building2 size={36} />
              </div>
            )}

            <div style={{ flex: 1 }}>
              <h1 style={s.name}>{company.companyName || "Entreprise"}</h1>
              {location ? (
                <p style={s.meta}>
                  <MapPin size={14} /> {location}
                </p>
              ) : null}
            </div>

            {/* ✅ Bouton Follow/Unfollow avec style dynamique */}
            <button
              onClick={handleFollow}
              disabled={following}
              style={isFollowed ? s.btnFollowing : s.btnFollow}
            >
              {following ? (
                <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
              ) : isFollowed ? (
                <><UserCheck size={15} /> Déjà suivi</>
              ) : (
                <><UserPlus size={15} /> Suivre</>
              )}
            </button>
          </div>

          {company.description ? <p style={s.description}>{company.description}</p> : null}

          <div style={s.links}>
            {company.website ? (
              <a href={company.website} target="_blank" rel="noreferrer" style={s.linkChip}>
                <Globe size={14} /> Site web
              </a>
            ) : null}
            {company.email ? (
              <a href={`mailto:${company.email}`} style={s.linkChip}>
                <Mail size={14} /> {company.email}
              </a>
            ) : null}
            {company.phone ? (
              <a href={`tel:${company.phone}`} style={s.linkChip}>
                <Phone size={14} /> {company.phone}
              </a>
            ) : null}
          </div>
        </div>

        {/* Publications */}
        <section style={s.feedSection}>
          <div style={s.feedHeader}>
            <Newspaper size={22} color="#1E3A5F" />
            <h2 style={s.feedTitle}>Publications</h2>
          </div>

          {loadingPosts && page === 1 ? (
            <div style={s.loadingCard}>
              <Loader size={22} style={{ animation: "spin 1s linear infinite" }} />
              <span>Chargement des publications...</span>
            </div>
          ) : posts.length === 0 ? (
            <div style={s.emptyFeed}>Aucune publication pour le moment.</div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post._id} post={post} onDeleted={() => refetchPosts()} />
              ))}
              {totalPages > 1 && (
                <div style={s.pagination}>
                  <button
                    type="button"
                    style={{ ...s.pageBtn, opacity: page <= 1 ? 0.45 : 1 }}
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Précédent
                  </button>
                  <span style={s.pageInfo}>
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    style={{ ...s.pageBtn, opacity: page >= totalPages ? 0.45 : 1 }}
                    disabled={page >= totalPages || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const s = {
  page: {
    minHeight: "100vh",
    height: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
    background: "#f3f6fa",
    padding: "24px 12px 48px",
    boxSizing: "border-box",
  },
  container: { maxWidth: 680, margin: "0 auto" },
  backBtn: {
    border: "1px solid #dbe3ec",
    background: "#fff",
    color: "#334155",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    fontWeight: 600,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5ebf2",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    marginBottom: 20,
  },
  cover: { height: 200, background: "linear-gradient(120deg, #dbeafe, #e2e8f0)" },
  coverImg: { width: "100%", height: "100%", objectFit: "cover" },
  header: {
    display: "flex",
    alignItems: "flex-end",
    gap: 14,
    padding: "0 20px 16px",
    marginTop: -48,
    flexWrap: "wrap",
  },
  logo: {
    width: 96, height: 96, borderRadius: 14,
    border: "4px solid #fff", objectFit: "cover", background: "#fff", flexShrink: 0,
  },
  logoFallback: {
    width: 96, height: 96, borderRadius: 14,
    border: "4px solid #fff", background: "#e2e8f0", color: "#475569",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  name: { margin: "0 0 4px", color: "#0f172a", fontSize: 26, fontWeight: 800 },
  meta: { margin: 0, color: "#64748b", display: "flex", alignItems: "center", gap: 6, fontSize: 14 },

  // ✅ Bouton "Suivre" — bleu foncé
  btnFollow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "10px 20px",
    background: "#1E3A5F",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    transition: "all 0.2s",
    marginLeft: "auto",
    flexShrink: 0,
  },

  // ✅ Bouton "Déjà suivi" — vert avec bordure
  btnFollowing: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "10px 20px",
    background: "#f0fdf4",
    color: "#16a34a",
    border: "2px solid #86efac",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    transition: "all 0.2s",
    marginLeft: "auto",
    flexShrink: 0,
  },

  description: { padding: "0 20px 0", margin: "0 0 8px", lineHeight: 1.6, color: "#334155", fontSize: 15 },
  links: { display: "flex", flexWrap: "wrap", gap: 10, padding: "12px 20px 20px" },
  linkChip: {
    display: "inline-flex", alignItems: "center", gap: 7,
    textDecoration: "none", border: "1px solid #cfd8e3",
    background: "#f8fafc", color: "#1e293b",
    borderRadius: 999, padding: "8px 12px",
    fontSize: 13, fontWeight: 600,
  },
  feedSection: { marginTop: 8 },
  feedHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingLeft: 4 },
  feedTitle: { fontWeight: 800, fontSize: 20, color: "#0f172a", margin: 0 },
  loadingCard: {
    background: "#fff", border: "1px solid #e5ebf2",
    borderRadius: 14, padding: 28,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 12, color: "#64748b", fontSize: 14,
  },
  emptyFeed: {
    background: "#fff", border: "1px dashed #cbd5e1",
    borderRadius: 14, padding: 36,
    textAlign: "center", color: "#64748b", fontSize: 15,
  },
  pagination: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 16, marginTop: 20, marginBottom: 8,
  },
  pageBtn: {
    padding: "8px 18px", background: "#1E3A5F", color: "#fff",
    border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
  },
  pageInfo: { fontSize: 13, color: "#64748b", fontWeight: 600 },
};

export default CompanyPublicProfile;