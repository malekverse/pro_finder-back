import React, { useState } from "react";
import { useSelector } from "react-redux";
import { 
  useGetCompanyProductsQuery, 
  useCreateProductMutation, 
  useUpdateProductMutation, 
  useDeleteProductMutation 
} from "../../redux/features/products/productApiSlice";
import { 
  Plus, Edit2, Trash2, Package, Search, X, Upload, 
  DollarSign, Tag, Info, Layers, Loader2, AlertCircle, Image as ImageIcon
} from "lucide-react";

const Produits = () => {
  const user = useSelector((state) => state.auth.user);
  const companyId = user?.companyId || user?.id;

  const { data: products = [], isLoading, isError, refetch } = useGetCompanyProductsQuery(companyId, { skip: !companyId, pollingInterval: 3000 });
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    stock: "",
    images: [],
  });

  const [previewImages, setPreviewImages] = useState([]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditMode(true);
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
        stock: product.stock,
        images: [],
      });
      setPreviewImages(product.images || []);
    } else {
      setEditMode(false);
      setSelectedProduct(null);
      setFormData({
        name: "",
        category: "",
        price: "",
        description: "",
        stock: "",
        images: [],
      });
      setPreviewImages([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setSelectedProduct(null);
    setFormData({ name: "", category: "", price: "", description: "", stock: "", images: [] });
    setPreviewImages([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, images: [...formData.images, ...files] });
    
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages([...previewImages, ...previews]);
  };

  const handleRemoveImage = (index) => {
    const newPreviews = [...previewImages];
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
    
    // Si c'était un fichier nouvellement ajouté
    const newFiles = [...formData.images];

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const form = new FormData();
    form.append("name", formData.name);
    form.append("category", formData.category);
    form.append("price", formData.price);
    form.append("description", formData.description);
    form.append("stock", formData.stock);
    
    formData.images.forEach(img => {
      form.append("images", img);
    });

    if (editMode && selectedProduct) {
        const remainingExisting = previewImages.filter(url => typeof url === 'string' && url.startsWith('http'));
        form.append("existingImages", JSON.stringify(remainingExisting));
    }

    try {
      if (editMode) {
        await updateProduct({ id: selectedProduct._id, formData: form }).unwrap();
      } else {
        await createProduct(form).unwrap();
      }
      handleCloseModal();
      refetch();
    } catch (err) {
      console.error("Failed to save product:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce produit ?")) {
      try {
        await deleteProduct(id).unwrap();
        refetch();
      } catch (err) {
        console.error("Failed to delete product:", err);
      }
    }
  };

  const filteredProducts = Array.isArray(products) ? products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div style={{ padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
            Gestion du Catalogue
          </h1>
          <p style={{ color: "#64748b", marginTop: "5px" }}>Gérez vos produits et services en temps réel.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            backgroundColor: '#24416b', color: 'white', padding: '12px 24px', 
            borderRadius: '12px', border: 'none', fontWeight: '600', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(36, 65, 107, 0.2)'
          }}
        >
          <Plus size={20} /> Nouveau Produit
        </button>
      </div>

      {/* Stats Quick Look */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: '#eff6ff', color: '#24416b', padding: '12px', borderRadius: '12px' }}><Package size={24} /></div>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Total Produits</p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>{filteredProducts.length}</h3>
            </div>
          </div>
      </div>

      {/* Search and Filters */}
      <div style={{ marginBottom: '30px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
        <input 
          type="text" 
          placeholder="Rechercher un produit ou une catégorie..." 
          style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '16px', backgroundColor: 'white' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          <Loader2 className="animate-spin" size={48} color="#24416b" />
        </div>
      ) : isError ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fef2f2', borderRadius: '20px' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px', marginLeft: 'auto', marginRight: 'auto' }} />
          <h3 style={{ color: '#991b1b' }}>Erreur lors du chargement</h3>
          <p style={{ color: '#b91c1c' }}>Une erreur est survenue lors de la récupération de vos produits.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
          <Package size={64} color="#cbd5e1" style={{ marginBottom: '20px', marginLeft: 'auto', marginRight: 'auto' }} />
          <h3 style={{ color: '#64748b' }}>Aucun produit trouvé</h3>
          <p style={{ color: '#94a3b8' }}>{searchQuery ? "Aucun résultat pour votre recherche." : "Commencez par ajouter votre premier produit."}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {filteredProducts.map(product => (
            <div key={product._id} style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ height: '200px', backgroundColor: '#f8fafc', position: 'relative' }}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Package size={48} color="#e2e8f0" />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleOpenModal(product)} style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#24416b' }}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(product._id)} style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#ef4444' }}><Trash2 size={16} /></button>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{product.name}</h3>
                  <span style={{ backgroundColor: '#eff6ff', color: '#24416b', padding: '4px 10px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}>{product.price} TND</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px', height: '40px', overflow: 'hidden' }}>{product.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={14} /> {product.category}</span>
                  <span style={{ fontSize: '13px', color: product.stock > 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>{product.stock > 0 ? `Stock: ${product.stock}` : "Rupture de stock"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{editMode ? "Modifier le produit" : "Ajouter un produit"}</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Nom du produit *</label>
                  <input 
                    required 
                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Catégorie *</label>
                  <input 
                    required 
                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Ex: Électronique, Services..."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Prix (TND) *</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
                    <input 
                      type="number" 
                      required 
                      style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Stock</label>
                  <input 
                    type="number" 
                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Description</label>
                <textarea 
                  rows="3" 
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', resize: 'none' }} 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Images du produit</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {previewImages.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => handleRemoveImage(idx)} style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}><X size={12} /></button>
                    </div>
                  ))}
                  <label style={{ width: '80px', height: '80px', border: '2px dashed #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                    <Upload size={24} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={handleCloseModal} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                <button 
                  type="submit" 
                  disabled={isCreating || isUpdating}
                  style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#24416b', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {(isCreating || isUpdating) ? <Loader2 className="animate-spin" size={20} /> : (editMode ? "Mettre à jour" : "Enregistrer le produit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produits;
