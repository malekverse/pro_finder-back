import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash, FaEdit } from "react-icons/fa";
import { Search, Plus, X, Layers, Wrench, Tag } from "lucide-react";
import styles from "../../../styles/dashboardAdmin.module.css";

export default function AdminTaxonomy() {
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

  useEffect(() => { loadData(); }, []);

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
      await axios.put(endpoint, { statut: newStatus });
      
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

      editItem ? await axios.put(url, payload) : await axios.post(url, payload);
      loadData();
      setIsModalOpen(false);
    } catch (err) { alert("Erreur d'enregistrement"); }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Supprimer définitivement ?")) return;
    try {
      const endpoint = type === "cat" ? "deleteCategory" : type === "sub" ? "deleteSubCategory" : "deleteService";
      await axios.delete(`${API}/${endpoint}/${id}`);
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
      {/* STATS CARDS */}
      <div className={styles.gridWrapper}>
        <div className={styles.cardStat}>
          <div className={styles.statIcon} style={{ background: "#eef2ff", color: "#6366f1" }}><Tag size={22} /></div>
          <div><p>Catégories</p><strong>{categories.length}</strong></div>
        </div>
        <div className={styles.cardStat}>
          <div className={styles.statIcon} style={{ background: "#f0fdf4", color: "#22c55e" }}><Layers size={22} /></div>
          <div><p>Sous-Catégories</p><strong>{subCategories.length}</strong></div>
        </div>
        <div className={styles.cardStat}>
          <div className={styles.statIcon} style={{ background: "#faf5ff", color: "#a855f7" }}><Wrench size={22} /></div>
          <div><p>Services</p><strong>{services.length}</strong></div>
        </div>
      </div>

      <div className={styles.mainContentCard}>
        {/* ACTION BAR */}
        <div className={styles.actionBar}>
          <div className={styles.searchBox} style={{ maxWidth: "250px" }}>
            <Search size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Rechercher..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={styles.addBtnBlue} onClick={() => openModal("categories")}><Plus size={16}/> Catégorie</button>
            <button className={styles.addBtnBlue} onClick={() => openModal("subcategories")}><Plus size={16}/> Sous-Catégorie</button>
            <button className={styles.addBtnBlue} onClick={() => openModal("services")}><Plus size={16}/> Service</button>
          </div>
        </div>

        {/* TABLEAU IMBRIQUÉ */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.theadDark}>
              <tr>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>SubCategory</th>
                <th className={styles.th}>Service</th>
                <th className={styles.th}>Statut</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => {
                const subs = subCategories.filter(s => s.category_id === cat._id);
                return (
                  <React.Fragment key={cat._id}>
                    <tr style={{backgroundColor: '#f8fafc'}}>
                      <td className={styles.td} colSpan="3"><strong>{cat.name}</strong></td>
                      <td className={styles.td}>
                        <span 
                          className={cat.statut === "Inactif" ? styles.statusBadgeGray : styles.statusBadgeGreen}
                          onClick={() => toggleStatus(cat, "cat")}
                          style={{ cursor: 'pointer' }}
                        >
                          {cat.statut || "Actif"}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actionsFlex}>
                          <FaEdit className={styles.editBtnIcon} onClick={() => openModal("categories", cat)} />
                          <FaTrash className={styles.deleteBtnIcon} onClick={() => handleDelete(cat._id, "cat")} />
                        </div>
                      </td>
                    </tr>
                    {subs.map((sub) => {
                      const servs = services.filter(s => s.subcategory_id === sub._id);
                      return (
                        <React.Fragment key={sub._id}>
                          <tr>
                            <td className={styles.td}></td>
                            <td className={styles.td} colSpan="2">{sub.name}</td>
                            <td className={styles.td}>
                              <span 
                                className={sub.statut === "Inactif" ? styles.statusBadgeGray : styles.statusBadgeGreen}
                                onClick={() => toggleStatus(sub, "sub")}
                                style={{ cursor: 'pointer' }}
                              >
                                {sub.statut || "Actif"}
                              </span>
                            </td>
                            <td className={styles.td}>
                              <div className={styles.actionsFlex}>
                                <FaEdit className={styles.editBtnIcon} onClick={() => openModal("subcategories", sub)} />
                                <FaTrash className={styles.deleteBtnIcon} onClick={() => handleDelete(sub._id, "sub")} />
                              </div>
                            </td>
                          </tr>
                          {servs.map((serv) => (
                            <tr key={serv._id}>
                              <td className={styles.td}></td>
                              <td className={styles.td}></td>
                              <td className={styles.td}>{serv.name}</td>
                              <td className={styles.td}>
                                <span 
                                  className={serv.statut === "Inactif" ? styles.statusBadgeGray : styles.statusBadgeGreen}
                                  onClick={() => toggleStatus(serv, "serv")}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {serv.statut || "Actif"}
                                </span>
                              </td>
                              <td className={styles.td}>
                                <div className={styles.actionsFlex}>
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
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editItem ? "Modifier" : "Ajouter"} {activeTab}</h3>
              <X className={styles.closeIcon} onClick={() => setIsModalOpen(false)} />
            </div>
            <form onSubmit={handleSubmit} className={styles.formContainer}>
              <input className={styles.modalInput} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="Nom" />
              {activeTab === "subcategories" && (
                <select className={styles.modalSelect} value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} required>
                  <option value="">Choisir Catégorie</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              )}
              {activeTab === "services" && (
                <select className={styles.modalSelect} value={formData.subCategoryId} onChange={(e) => setFormData({...formData, subCategoryId: e.target.value})} required>
                  <option value="">Choisir Sous-Catégorie</option>
                  {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              )}
              <button type="submit" className={styles.submitBtn}>{editItem ? "Confirmer" : "Ajouter"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}