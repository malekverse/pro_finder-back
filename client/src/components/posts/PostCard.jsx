import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useToggleLikeMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useSharePostMutation,
  useDeletePostMutation,
  useUpdatePostMutation,
} from "../../redux/features/posts/postApiSlice";
import {
  ThumbsUp, MessageCircle, Repeat2, Trash2,
  MoreHorizontal, Send, Pencil, X, ImagePlus, Loader,
  ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── Lightbox ─────────────────────────────────────────────────────────────
const Lightbox = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const prev = (e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); };
  const next = (e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); };

  return (
    <div style={lb.overlay} onClick={onClose}>
      <button style={lb.closeBtn} onClick={onClose}><X size={22} /></button>
      {images.length > 1 && (
        <button style={{ ...lb.navBtn, left: 16 }} onClick={prev}><ChevronLeft size={24} /></button>
      )}
      <img
        src={images[idx]}
        alt=""
        style={lb.img}
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <button style={{ ...lb.navBtn, right: 16 }} onClick={next}><ChevronRight size={24} /></button>
      )}
      {images.length > 1 && (
        <div style={lb.dots}>
          {images.map((_, i) => (
            <span key={i} style={{ ...lb.dot, background: i === idx ? "#fff" : "rgba(255,255,255,0.4)" }} />
          ))}
        </div>
      )}
    </div>
  );
};

const lb = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2000, cursor: "zoom-out",
  },
  img: {
    maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain",
    borderRadius: 8, cursor: "default",
    boxShadow: "0 0 60px rgba(0,0,0,0.5)",
  },
  closeBtn: {
    position: "absolute", top: 16, right: 16,
    background: "rgba(255,255,255,0.15)", border: "none",
    color: "#fff", width: 40, height: 40, borderRadius: "50%",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  navBtn: {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.15)", border: "none",
    color: "#fff", width: 44, height: 44, borderRadius: "50%",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  dots: {
    position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
    display: "flex", gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: "50%", transition: "background 0.2s" },
};

// ─── Modal d'édition ──────────────────────────────────────────────────────
const EditModal = ({ post, onClose, onSaved }) => {
  const [updatePost, { isLoading }] = useUpdatePostMutation();
  const [content, setContent]         = useState(post.content || "");
  const [existingImages, setExisting] = useState(post.images || []);
  const [newPreviews, setNewPreviews] = useState([]);
  const [imagesToDelete, setToDelete] = useState([]);
  const [error, setError]             = useState("");
  const fileRef = useRef();

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);
    setNewPreviews((prev) => [...prev, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    e.target.value = "";
  };

  const handleRemoveExisting = (imgUrl) => {
    const relativePath = imgUrl.replace(/^https?:\/\/[^/]+\//, "");
    setToDelete((prev) => [...prev, relativePath]);
    setExisting((prev) => prev.filter((u) => u !== imgUrl));
  };

  const handleRemoveNew = (index) => {
    URL.revokeObjectURL(newPreviews[index].url);
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!content.trim() && existingImages.length === 0 && newPreviews.length === 0) {
      setError("Le post doit contenir du texte ou une image.");
      return;
    }
    const formData = new FormData();
    formData.append("content", content);
    if (imagesToDelete.length > 0) formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    newPreviews.forEach(({ file }) => formData.append("images", file));
    try {
      await updatePost({ id: post._id, formData }).unwrap();
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la modification.");
    }
  };

  return (
    <div style={ms.overlay} onClick={onClose}>
      <div style={ms.modal} onClick={(e) => e.stopPropagation()}>
        <div style={ms.header}>
          <h3 style={ms.title}>Modifier la publication</h3>
          <button onClick={onClose} style={ms.closeBtn}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea style={ms.textarea} value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Modifiez votre publication..." />
          {existingImages.length > 0 && (
            <div>
              <p style={ms.label}>Images actuelles</p>
              <div style={ms.imageGrid}>
                {existingImages.map((img, i) => (
                  <div key={i} style={ms.imageItem}>
                    <img src={img} alt="" style={ms.image} />
                    <button type="button" onClick={() => handleRemoveExisting(img)} style={ms.removeBtn}><X size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {newPreviews.length > 0 && (
            <div>
              <p style={ms.label}>Nouvelles images</p>
              <div style={ms.imageGrid}>
                {newPreviews.map((p, i) => (
                  <div key={i} style={ms.imageItem}>
                    <img src={p.url} alt="" style={ms.image} />
                    <button type="button" onClick={() => handleRemoveNew(i)} style={ms.removeBtn}><X size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && <p style={ms.error}>{error}</p>}
          <div style={ms.footer}>
            <button type="button" onClick={() => fileRef.current.click()} style={ms.addImgBtn}>
              <ImagePlus size={16} /> Ajouter des photos
            </button>
            <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={handleAddImages} style={{ display: "none" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose} style={ms.cancelBtn}>Annuler</button>
              <button type="submit" disabled={isLoading} style={ms.saveBtn}>
                {isLoading ? <Loader size={15} /> : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── PostCard ─────────────────────────────────────────────────────────────
const PostCard = ({ post, onDeleted }) => {
  const navigate = useNavigate();
  // Récupérer l'ID depuis state.auth.user (pas account)
  // Le serveur stocke { id: account._id } dans account retourné au login
  const authUser = useSelector((state) => state.auth.user);
  
  // L'auteur peut être la company (companyId) ou l'user (id)
  // On compare les deux pour couvrir tous les cas
  const currentId      = authUser?.id || authUser?._id || "";
  const currentCompany = authUser?.companyId || "";

  const [toggleLike]    = useToggleLikeMutation();
  const [addComment]    = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [sharePost]     = useSharePostMutation();
  const [deletePost]    = useDeletePostMutation();

  const [showComments,  setShowComments]  = useState(false);
  const [commentText,   setCommentText]   = useState("");
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [showEdit,      setShowEdit]      = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [lightboxIdx,   setLightboxIdx]   = useState(null); // null = fermé

  // Comparaison robuste : toString() sur les deux côtés
  const postAuthorId = post.author_id?.toString() || "";
  const isAuthor = postAuthorId !== "" && (
    postAuthorId === currentId.toString() ||
    postAuthorId === currentCompany.toString()
  );

  const isLiked = post.likes?.map(id => id?.toString()).includes(currentId.toString());

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  };

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const clean = url.startsWith("/") ? url.slice(1) : url;
    return `http://localhost:5000/${clean}`;
  };

  const authorId = post.author_id?.toString?.() || "";
  const authorName = post.author?.name || "Utilisateur";
  const authorImage =
    resolveImageUrl(post.author?.avatarUrl) ||
    resolveImageUrl(post.author?.logoUrl) ||
    resolveImageUrl(post.author?.companyLogo);

  const openCompanyProfile = () => {
    if (!authorId) return;
    navigate(`/user/company/${authorId}`);
  };

  const handleLike = async () => {
    try { await toggleLike(post._id).unwrap(); } catch (err) { console.error(err); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment({ id: post._id, text: commentText }).unwrap();
      setCommentText("");
      onDeleted?.(); // refetch pour avoir commentAuthor populé
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (commentId) => {
    try { await deleteComment({ postId: post._id, commentId }).unwrap(); } catch (err) { console.error(err); }
  };

  const handleShare = async () => {
    try { await sharePost(post._id).unwrap(); } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    setDeleteConfirm(false);
    try {
      await deletePost(post._id).unwrap();
      onDeleted?.();
    } catch (err) { console.error(err); }
  };

  // Grille d'images selon le nombre
  const imgs = post.images || [];
  const gridStyle = () => {
    if (imgs.length === 1) return { gridTemplateColumns: "1fr", gridTemplateRows: "auto" };
    if (imgs.length === 2) return { gridTemplateColumns: "1fr 1fr" };
    if (imgs.length === 3) return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "200px 200px" };
    return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "200px 200px" };
  };

  return (
    <>
      <div style={s.card}>
        {/* ── Header ── */}
        <div style={s.header}>
          {authorImage ? (
            <img
              src={authorImage}
              alt="avatar"
              style={{ ...s.avatar, cursor: "pointer" }}
              onClick={openCompanyProfile}
              title="Voir le profil de l'entreprise"
            />
          ) : (
            <div
              style={{ ...s.avatarFallback, cursor: "pointer" }}
              onClick={openCompanyProfile}
              title="Voir le profil de l'entreprise"
            >
              {getInitials(authorName)}
            </div>
          )}
          <div
            style={{ ...s.authorBlock, flex: 1 }}
            role="button"
            tabIndex={0}
            onClick={openCompanyProfile}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openCompanyProfile();
              }
            }}
            title="Voir le profil de l'entreprise"
          >
            <p style={s.authorName}>{authorName}</p>
            <p style={s.date}>{formatDate(post.createdAt)}</p>
          </div>

          {/* Menu ⋯ — visible uniquement si isAuthor */}
          {isAuthor && (
            <div style={{ position: "relative" }}>
              <button onClick={() => { setMenuOpen(!menuOpen); setDeleteConfirm(false); }} style={s.menuBtn}>
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <>
                  <div style={s.menuOverlay} onClick={() => { setMenuOpen(false); setDeleteConfirm(false); }} />
                  <div style={s.dropdown}>
                    <button
                      onClick={() => { setMenuOpen(false); setShowEdit(true); }}
                      style={s.dropItem}
                    >
                      <Pencil size={14} /> Modifier
                    </button>
                    {!deleteConfirm ? (
                      <button onClick={() => setDeleteConfirm(true)} style={{ ...s.dropItem, color: "#dc2626" }}>
                        <Trash2 size={14} /> Supprimer
                      </button>
                    ) : (
                      <div style={s.confirmBox}>
                        <p style={s.confirmText}>Confirmer la suppression ?</p>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={handleDelete} style={s.confirmYes}>Oui, supprimer</button>
                          <button onClick={() => setDeleteConfirm(false)} style={s.confirmNo}>Non</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Contenu texte ── */}
        {post.content && <p style={s.content}>{post.content}</p>}

        {/* ── Grille images cliquables ── */}
        {imgs.length > 0 && (
          <div style={{ ...s.imgGrid, ...gridStyle() }}>
            {imgs.slice(0, 4).map((img, i) => (
              <div
                key={i}
                style={{
                  ...s.imgCell,
                  gridColumn: imgs.length === 3 && i === 0 ? "1 / 2" : undefined,
                  gridRow:    imgs.length === 3 && i === 0 ? "1 / 3" : undefined,
                  cursor: "pointer",
                }}
                onClick={() => setLightboxIdx(i)}
              >
                <img src={img} alt="" style={s.postImg} />
                {i === 3 && imgs.length > 4 && (
                  <div style={s.moreOverlay}>+{imgs.length - 4}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Stats ── */}
        <div style={s.stats}>
          {post.likesCount > 0 && (
            <span style={s.statItem}>❤️ {post.likesCount}</span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
            {post.commentsCount > 0 && (
              <button style={s.statBtn} onClick={() => setShowComments(!showComments)}>
                {post.commentsCount} commentaire{post.commentsCount > 1 ? "s" : ""}
              </button>
            )}
            {post.sharesCount > 0 && (
              <span style={s.statBtn}>{post.sharesCount} partage{post.sharesCount > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        <div style={s.divider} />

        {/* ── Boutons actions ── */}
        <div style={s.actions}>
          <button onClick={handleLike} style={{ ...s.actionBtn, color: isLiked ? "#1E3A5F" : "#64748b", fontWeight: isLiked ? 700 : 500 }}>
            <ThumbsUp size={17} fill={isLiked ? "#1E3A5F" : "none"} strokeWidth={isLiked ? 2.5 : 1.8} />
            J'aime
          </button>
          <button onClick={() => setShowComments(!showComments)} style={s.actionBtn}>
            <MessageCircle size={17} strokeWidth={1.8} />
            Commenter
          </button>
          <button onClick={handleShare} style={s.actionBtn}>
            <Repeat2 size={17} strokeWidth={1.8} />
            Partager
          </button>
        </div>

        {/* ── Commentaires ── */}
        {showComments && (
          <div style={s.commentsWrap}>
            {post.comments?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                {post.comments.map((c) => {
                  const cAuthor = c.commentAuthor;
                  const cName   = cAuthor?.name || "Utilisateur";
                  const cAvatar = cAuthor?.avatarUrl || null;
                  const isMe    = c.author_id?.toString() === currentId ||
                                  c.author_id?.toString() === currentCompany ||
                                  isAuthor; // owner/auteur du post peut supprimer tous les commentaires
                  return (
                    <div key={c._id} style={s.comment}>
                      {cAvatar ? (
                        <img src={cAvatar} alt="" style={s.commentAvatarImg} />
                      ) : (
                        <div style={s.commentAvatar}>{getInitials(cName)}</div>
                      )}
                      <div style={s.commentBubble}>
                        <span style={s.commentAuthor}>{cName}</span>
                        <span style={s.commentText}> {c.text}</span>
                      </div>
                      {isMe && (
                        <button onClick={() => handleDeleteComment(c._id)} style={s.delCommentBtn}><X size={11} /></button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <form onSubmit={handleComment} style={s.commentForm}>
              <input
                type="text"
                placeholder="Écrire un commentaire..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={s.commentInput}
              />
              <button type="submit" style={s.sendBtn}><Send size={15} /></button>
            </form>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox images={imgs} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {/* Modal édition */}
      {showEdit && (
        <EditModal post={post} onClose={() => setShowEdit(false)} onSaved={() => onDeleted?.()} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────
const s = {
  card: { background: "#fff", borderRadius: 14, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e9eef5", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", gap: 12, padding: "16px 18px 0" },
  avatar: { width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0 },
  avatarFallback: { width: 42, height: 42, borderRadius: 10, background: "#1E3A5F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  authorBlock: { cursor: "pointer" },
  authorName: { fontWeight: 700, fontSize: 14, margin: 0, color: "#0f172a" },
  date: { fontSize: 12, color: "#94a3b8", margin: "2px 0 0" },
  menuBtn: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 6, borderRadius: 8, display: "flex", alignItems: "center" },
  menuOverlay: { position: "fixed", inset: 0, zIndex: 9 },
  dropdown: { position: "absolute", right: 0, top: 36, background: "#fff", border: "1px solid #e9eef5", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 10, minWidth: 170, overflow: "hidden" },
  dropItem: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", width: "100%", background: "none", border: "none", cursor: "pointer", color: "#334155", fontSize: 13, fontWeight: 500 },
  confirmBox: { padding: "10px 14px", borderTop: "1px solid #f1f5f9" },
  confirmText: { fontSize: 12, color: "#64748b", margin: "0 0 8px" },
  confirmYes: { padding: "5px 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, marginRight: 6 },
  confirmNo: { padding: "5px 10px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  content: { fontSize: 14.5, lineHeight: 1.65, color: "#1e293b", padding: "12px 18px", margin: 0 },
  imgGrid: { display: "grid", gap: 2, overflow: "hidden", margin: "4px 0 0" },
  imgCell: { position: "relative", overflow: "hidden" },
  postImg: { width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: 180, transition: "transform 0.2s" },
  moreOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 },
  stats: { display: "flex", alignItems: "center", padding: "10px 18px 0", fontSize: 13, color: "#64748b" },
  statItem: { display: "flex", alignItems: "center", gap: 4 },
  statBtn: { background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13, padding: 0, textDecoration: "underline", textUnderlineOffset: 2 },
  divider: { height: 1, background: "#f1f5f9", margin: "10px 18px 0" },
  actions: { display: "flex", padding: "4px 6px 4px" },
  actionBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13, fontWeight: 500, padding: "10px 6px", borderRadius: 8 },
  commentsWrap: { background: "#f8fafc", borderTop: "1px solid #f1f5f9", padding: "14px 18px" },
  comment: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  commentAvatar: { width: 30, height: 30, borderRadius: 8, background: "#e2e8f0", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  commentAvatarImg: { width: 30, height: 30, borderRadius: 8, objectFit: "cover", flexShrink: 0 },
  commentBubble: { flex: 1, background: "#fff", borderRadius: "4px 10px 10px 10px", padding: "8px 12px", border: "1px solid #e9eef5", fontSize: 13 },
  commentAuthor: { fontWeight: 600, color: "#1e293b" },
  commentText: { color: "#475569" },
  delCommentBtn: { background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: 4, marginTop: 4, display: "flex", alignItems: "center" },
  commentForm: { display: "flex", gap: 8, marginTop: 4 },
  commentInput: { flex: 1, border: "1px solid #e2e8f0", borderRadius: 24, padding: "9px 16px", fontSize: 13, outline: "none", background: "#fff", color: "#1e293b" },
  sendBtn: { width: 36, height: 36, borderRadius: "50%", border: "none", background: "#1E3A5F", color: "#fff", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
};

const ms = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  title: { fontWeight: 700, fontSize: 17, margin: 0, color: "#0f172a" },
  closeBtn: { background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" },
  textarea: { width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", minHeight: 110, lineHeight: 1.6, color: "#1e293b" },
  label: { fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: "14px 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" },
  imageGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  imageItem: { position: "relative", width: 88, height: 88 },
  image: { width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, display: "block" },
  removeBtn: { position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  error: { color: "#dc2626", fontSize: 13, marginTop: 10 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, gap: 10 },
  addImgBtn: { display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "#475569", fontSize: 13, fontWeight: 500 },
  cancelBtn: { padding: "9px 18px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#475569" },
  saveBtn: { padding: "9px 22px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 },
};

export default PostCard;