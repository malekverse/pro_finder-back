import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { profileApiSlice } from "../../../redux/features/profileApiSlice";
import { selectCurrentToken } from "../../../redux/features/auth/authSlice";
import { FaTrash, FaEdit } from "react-icons/fa";
import { Search, Plus, X, Layers, Wrench, Tag } from "lucide-react";
import styles from "../../../styles/dashboardAdmin.module.css";

export default function AdminTaxonomy() {
  const dispatch = useDispatch();
  const token = useSelector(selectCurrentToken);
  const API = "http://localhost:5000/categories";

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeTab, setActiveTab] = useState("categories");
  const [formData, setFormData] = useState({ name: "", categoryId: "", subCategoryId: "" });

  const loadData = async () => {
    try {
      const [catRes, subRes, servRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/subcategories`),
        axios.get(`${API}/services`),
      ]);
      setCategories(catRes.data || []);
      setSubCategories(subRes.data || []);
      setServices(servRes.data || []);
    } catch (err) { console.error("Erreur de chargement", err); }
  };

  useEffect(() => { 
    loadData(); 
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  // CETTE FONCTION COMMUNIQUE AVEC TON BACKEND
  const toggleStatus = async (item, type) => {
    try {
      // On définit l'état inverse (si indéfini, on considère qu'il était actif)
      const newStatus = item.statut === "Inactif" ? "Actif" : "Inactif";
      
      let endpoint = "";
      if (type === "cat") endpoint = `${API}/updateCategory/${item._id}`;
      else if (type === "sub") endpoint = `${API}/updateSubCategory/${item._id}`;
      else endpoint = `${API}/updateService/${item._id}`;

      // Envoi de la mise à jour au serveur
      await axios.put(endpoint, { statut: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // On recharge les données pour confirmer le changement
      loadData();
    } catch (err) {
      alert("Erreur : Impossible de mettre à jour le statut sur le serveur.");
    }
  };

  const openModal = (type, item = null) => {
    setActiveTab(type);
    if (item) {
      setEditItem(item);
      setFormData({
        name: item.name,
        categoryId: item.category_id?._id || item.category_id || "",
        subCategoryId: item.subcategory_id?._id || item.subcategory_id || "",
      });
    } else {
      setEditItem(null);
      setFormData({ name: "", categoryId: "", subCategoryId: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let url = "";
      const payload = { name: formData.name };
      if (activeTab === "categories") url = editItem ? `${API}/updateCategory/${editItem._id}` : `${API}/createCategory`;
      else if (activeTab === "subcategories") {
        url = editItem ? `${API}/updateSubCategory/${editItem._id}` : `${API}/createSubCategory`;
        payload.category_id = formData.categoryId;
      } else {
        url = editItem ? `${API}/updateService/${editItem._id}` : `${API}/createService`;
        payload.subcategory_id = formData.subCategoryId;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      editItem ? await axios.put(url, payload, config) : await axios.post(url, payload, config);
      dispatch(profileApiSlice.util.invalidateTags(['Dashboard']));
      loadData();
      setIsModalOpen(false);
    } catch (err) { 
      const msg = err.response?.data?.message || "Erreur d'enregistrement";
      alert(msg); 
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Supprimer définitivement ?")) return;
    try {
      const endpoint = type === "cat" ? "deleteCategory" : type === "sub" ? "deleteSubCategory" : "deleteService";
      await axios.delete(`${API}/${endpoint}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(profileApiSlice.util.invalidateTags(['Dashboard']));
      loadData();
    } catch (err) { alert("Échec de la suppression"); }
  };

  const filteredCategories = categories.filter((cat) => {
    const subCats = subCategories.filter(s => s.category_id === cat._id);
    const servicesInCat = subCats.flatMap(sub => services.filter(s => s.subcategory_id === sub._id));
    const match = (val) => val?.toLowerCase().includes(search.toLowerCase());
    return match(cat.name) || subCats.some(s => match(s.name)) || servicesInCat.some(s => match(s.name));
  });

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className={styles.title} style={{ margin: 0 }}>Gestion de la Taxonomie</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>Organisez les catégories, sous-catégories et services de la plateforme.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.addBtnBlue} onClick={() => openModal("categories")}>
            <Plus size={18} /> Catégorie
          </button>
          <button className={styles.addBtnBlue} onClick={() => openModal("subcategories")}>
            <Plus size={18} /> Sous-Catégorie
          </button>
          <button className={styles.addBtnBlue} onClick={() => openModal("services")}>
            <Plus size={18} /> Service
          </button>
        </div>
      </div>

      <div className={styles.gridWrapper} style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '40px' }}>
        <div className={styles.cardStat}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#24416b' }}><Tag size={24} /></div>
          <div className={styles.statInfo}><p>Catégories</p><strong>{categories.length}</strong></div>
        </div>
        <div className={styles.cardStat}>
          <div className={styles.statIcon} style={{ background: '#f5f3ff', color: '#8b5cf6' }}><Layers size={24} /></div>
          <div className={styles.statInfo}><p>Sous-Catégories</p><strong>{subCategories.length}</strong></div>
        </div>
        <div className={styles.cardStat}>
          <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#10b981' }}><Wrench size={24} /></div>
          <div className={styles.statInfo}><p>Services</p><strong>{services.length}</strong></div>
        </div>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.searchBox} style={{ maxWidth: "400px" }}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Rechercher une catégorie, sous-catégorie ou service..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.theadDark}>
            <tr>
              <th className={styles.th}>Catégorie</th>
              <th className={styles.th}>Sous-Catégorie</th>
              <th className={styles.th}>Service</th>
              <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((cat) => {
              const subs = subCategories.filter(s => s.category_id === cat._id);
              return (
                <React.Fragment key={cat._id}>
                  <tr className={styles.categoryRow}>
                    <td className={styles.td} colSpan="3">
                      <span style={{ fontWeight: '800' }}>{cat.name}</span>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'center' }}>
                      <div className={styles.actionsFlex} style={{ justifyContent: 'center' }}>
                        <FaEdit className={styles.editBtnIcon} onClick={() => openModal("categories", cat)} />
                        <FaTrash className={styles.deleteBtnIcon} onClick={() => handleDelete(cat._id, "cat")} />
                      </div>
                    </td>
                  </tr>
                  {subs.map((sub) => {
                    const servs = services.filter(s => s.subcategory_id === sub._id);
                    return (
                      <React.Fragment key={sub._id}>
                        <tr className={styles.subCategoryRow}>
                          <td className={styles.td}></td>
                          <td className={styles.td} colSpan="2">
                            <span style={{ fontWeight: '600', color: '#24416b' }}>{sub.name}</span>
                          </td>
                          <td className={styles.td} style={{ textAlign: 'center' }}>
                            <div className={styles.actionsFlex} style={{ justifyContent: 'center' }}>
                              <FaEdit className={styles.editBtnIcon} onClick={() => openModal("subcategories", sub)} />
                              <FaTrash className={styles.deleteBtnIcon} onClick={() => handleDelete(sub._id, "sub")} />
                            </div>
                          </td>
                        </tr>
                        {servs.map((serv) => (
                          <tr key={serv._id} className={styles.serviceRow}>
                            <td className={styles.td}></td>
                            <td className={styles.td}></td>
                            <td className={styles.td}>
                              <span style={{ color: '#64748b' }}>{serv.name}</span>
                            </td>
                            <td className={styles.td} style={{ textAlign: 'center' }}>
                              <div className={styles.actionsFlex} style={{ justifyContent: 'center' }}>
                                <FaEdit className={styles.editBtnIcon} onClick={() => openModal("services", serv)} />
                                <FaTrash className={styles.deleteBtnIcon} onClick={() => handleDelete(serv._id, "serv")} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editItem ? "Modifier" : "Ajouter"} {activeTab === 'categories' ? 'une catégorie' : activeTab === 'subcategories' ? 'une sous-catégorie' : 'un service'}</h3>
              <X className={styles.closeIcon} onClick={() => setIsModalOpen(false)} />
            </div>
            <form onSubmit={handleSubmit} className={styles.formContainer}>
              <div className={styles.formGroup}>
                <label>Nom</label>
                <input className={styles.modalInput} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="Ex: Santé, Plomberie..." />
              </div>
              {activeTab === "subcategories" && (
                <div className={styles.formGroup}>
                  <label>Catégorie parente</label>
                  <select className={styles.modalSelect} value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} required>
                    <option value="">Choisir Catégorie</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {activeTab === "services" && (
                <div className={styles.formGroup}>
                  <label>Sous-catégorie parente</label>
                  <select className={styles.modalSelect} value={formData.subCategoryId} onChange={(e) => setFormData({...formData, subCategoryId: e.target.value})} required>
                    <option value="">Choisir Sous-Catégorie</option>
                    {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" className={styles.submitBtn} style={{ width: '100%', marginTop: '10px' }}>{editItem ? "Confirmer la modification" : "Ajouter"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}