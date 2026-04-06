import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useCreatePostMutation } from "../../redux/features/posts/postApiSlice";
import { ImagePlus, X, Send, Loader, Image } from "lucide-react";
import { useGetCompanyProfileQuery } from "../../redux/features/company/companyApiSlice";
import { toImageUrl } from "../../utils/imageUtils";

const PostCreate = ({ onSuccess }) => {
  const [createPost, { isLoading }] = useCreatePostMutation();
  const account = useSelector((state) => state.auth.user);
  const companyId = account?.companyId || account?.id;
  const { data: company } = useGetCompanyProfileQuery(companyId, { skip: !companyId, pollingInterval: 3000 });

  const [content,  setContent]  = useState("");
  const [previews, setPreviews] = useState([]);
  const [error,    setError]    = useState("");
  const [focused,  setFocused]  = useState(false);
  const fileRef = useRef();

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index].url);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!content.trim() && previews.length === 0) {
      setError("Ajoutez du texte ou une image");
      return;
    }
    const formData = new FormData();
    formData.append("content", content);
    previews.forEach(({ file }) => formData.append("imagesPost", file));
    try {
      await createPost(formData).unwrap();
      setContent("");
      setPreviews([]);
      setFocused(false);
      onSuccess?.();
    } catch (err) {
      setError("Erreur lors de la publication");
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  };

  const authorName = company?.companyName || account?.fullName || "";
  const avatarUrl  = toImageUrl(company?.logoUrl);

  return (
    <div style={cs.card}>
      <style>{`textarea { resize: none !important; } textarea::-webkit-resizer { display: none !important; }`}</style>
      <div style={cs.top}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" style={cs.avatar} />
        ) : (
          <div style={cs.avatarFallback}>{getInitials(authorName)}</div>
        )}
        <textarea
          style={{ ...cs.textarea, borderColor: focused ? "#1E3A5F" : "#e2e8f0" }}
          placeholder="Quoi de neuf ? Partagez une publication..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          rows={focused || content ? 3 : 2}
        />
      </div>

      {previews.length > 0 && (
        <div style={cs.previewGrid}>
          {previews.map((p, i) => (
            <div key={i} style={cs.previewItem}>
              <img src={p.url} alt="" style={cs.previewImg} />
              <button type="button" onClick={() => removeImage(i)} style={cs.removeBtn}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p style={cs.error}>{error}</p>}

      {(focused || content || previews.length > 0) && (
        <div style={cs.footer}>
          <button type="button" onClick={() => fileRef.current.click()} style={cs.mediaBtn}>
            <Image size={18} />
            <span>Photo</span>
          </button>
          <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={handleImages} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(content || previews.length > 0) && (
              <button
                type="button"
                onClick={() => { setContent(""); setPreviews([]); setFocused(false); }}
                style={cs.cancelBtn}
              >
                Annuler
              </button>
            )}
            <button onClick={handleSubmit} disabled={isLoading} style={cs.publishBtn}>
              {isLoading ? (
                <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Send size={15} />
              )}
              {isLoading ? "Publication..." : "Publier"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const cs = {
  card: {
    background: "#fff",
    borderRadius: 14,
    marginBottom: 16,
    border: "1px solid #e9eef5",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    padding: "16px 18px",
    width: "100%",
    boxSizing: "border-box",
  },
  top: { display: "flex", gap: 12, alignItems: "flex-start" },
  avatar: { width: 40, height: 40, borderRadius: 10, objectFit: "cover", flexShrink: 0 },
  avatarFallback: {
    width: 40, height: 40, borderRadius: 10, background: "#1E3A5F",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 13, flexShrink: 0,
  },
  textarea: {
    flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 24,
    padding: "10px 16px", fontSize: 14, resize: "none",
    outline: "none", fontFamily: "inherit", lineHeight: 1.5,
    color: "#1e293b", background: "#f8fafc",
    transition: "border-color 0.2s, background 0.2s",
    width: "100%", boxSizing: "border-box", overflow: "auto",
  },
  previewGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, paddingLeft: 52 },
  previewItem: { position: "relative", width: 80, height: 80 },
  previewImg: { width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, display: "block" },
  removeBtn: {
    position: "absolute", top: 3, right: 3,
    background: "rgba(0,0,0,0.6)", color: "#fff", border: "none",
    borderRadius: "50%", width: 20, height: 20, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  error: { color: "#dc2626", fontSize: 12, marginTop: 8, paddingLeft: 52 },
  footer: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: 14, paddingTop: 12, borderTop: "1px solid #f1f5f9",
  },
  mediaBtn: {
    display: "flex", alignItems: "center", gap: 7,
    background: "none", border: "none", cursor: "pointer",
    color: "#64748b", fontSize: 13, fontWeight: 500, padding: "6px 10px",
    borderRadius: 8, transition: "all 0.15s",
  },
  cancelBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#94a3b8", fontSize: 13, fontWeight: 500, padding: "6px 12px",
  },
  publishBtn: {
    display: "flex", alignItems: "center", gap: 7,
    background: "#1E3A5F", color: "#fff", border: "none",
    borderRadius: 8, padding: "9px 20px", cursor: "pointer",
    fontSize: 13, fontWeight: 700, transition: "background 0.15s",
  },
};

export default PostCreate;