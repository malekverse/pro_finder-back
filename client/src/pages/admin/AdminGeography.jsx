import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { profileApiSlice } from '../../redux/features/profileApiSlice';
import { selectCurrentToken } from '../../redux/features/auth/authSlice';
import { Trash2, Edit, Globe, Map, MapPin, Search, Plus, X } from 'lucide-react';
import styles from '../../styles/dashboardAdmin.module.css';

const AdminGeography = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectCurrentToken);
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  
  const [activeTab, setActiveTab] = useState('pays');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', countryId: '', regionId: '' });

  const API = "http://localhost:5000/localisation";

  useEffect(() => { 
    refreshData(); 
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    try {
      const [resC, resR, resV] = await Promise.all([
        axios.get(`${API}/getCountries`),
        axios.get(`${API}/getRegions`),
        axios.get(`${API}/getCities`)
      ]);
      setCountries(resC.data || []);
      setRegions(resR.data || []);
      setCities(resV.data || []);
    } catch (err) { console.error("Erreur chargement:", err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let url = "";
      let payload = {};

      if (activeTab === 'pays') {
        url = editItem ? `${API}/updateCountry/${editItem._id}` : `${API}/createCountry`;
        payload = { name: formData.name, code: formData.code };
      } else if (activeTab === 'regions') {
        url = editItem ? `${API}/updateRegion/${editItem._id}` : `${API}/createRegion`;
        payload = { name: formData.name, country: formData.countryId };
      } else {
        url = editItem ? `${API}/updateCity/${editItem._id}` : `${API}/createCity`;
        payload = { name: formData.name, region: formData.regionId };
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      if (editItem) {
        await axios.put(url, payload, config);
      } else {
        await axios.post(url, payload, config);
      }

      dispatch(profileApiSlice.util.invalidateTags(['Dashboard']));
      closeModal();
      refreshData();
    } catch (err) {
      console.error("Erreur save:", err);
      const msg = err.response?.data?.message || "Échec de l'enregistrement. Vérifiez vos données.";
      alert(msg);
    }
  };

const handleDelete = async (id, type) => {
  if (!window.confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
  
  try {
    // Les types dans activeTab sont 'pays', 'regions', 'villes'
    let endpoint = type === 'pays' ? "deleteCountry" : type === 'regions' ? "deleteRegion" : "deleteCity";
    
    const res = await axios.delete(`${API}/${endpoint}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (res.status === 200 || res.status === 204) {
      dispatch(profileApiSlice.util.invalidateTags(['Dashboard']));
      refreshData();
      alert("Supprimé avec succès");
    }
  } catch (err) {
    console.error("Erreur suppression:", err);
    const msg = err.response?.data?.message || "Erreur lors de la suppression. Vérifiez si l'élément est utilisé.";
    alert(msg);
  }
};

  const openModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData({ 
        name: item.name, 
        code: item.code || '', 
        countryId: item.country?._id || item.country || '', 
        regionId: item.region?._id || item.region || '' 
      });
    } else {
      setEditItem(null);
      setFormData({ name: '', code: '', countryId: '', regionId: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditItem(null); };

  const filteredData = activeTab === 'pays' 
    ? countries.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    : activeTab === 'regions' 
    ? regions.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    : cities.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className={styles.title} style={{ margin: 0 }}>Gestion de la Géographie</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>Gérez les pays, les régions et les villes disponibles sur la plateforme.</p>
        </div>
        <button className={styles.addBtnBlue} onClick={() => openModal()}>
          <Plus size={18} /> {activeTab === 'pays' ? 'Pays' : activeTab === 'regions' ? 'Région' : 'Ville'}
        </button>
      </div>

      <div className={styles.gridWrapper} style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '40px' }}>
        <div className={styles.cardStat}>
           <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#24416b' }}><Globe size={24} /></div>
           <div className={styles.statInfo}><p>Pays</p><strong>{countries.length}</strong></div>
        </div>
        <div className={styles.cardStat}>
           <div className={styles.statIcon} style={{ background: '#f5f3ff', color: '#8b5cf6' }}><Map size={24} /></div>
           <div className={styles.statInfo}><p>Régions</p><strong>{regions.length}</strong></div>
        </div>
        <div className={styles.cardStat}>
           <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#10b981' }}><MapPin size={24} /></div>
           <div className={styles.statInfo}><p>Villes</p><strong>{cities.length}</strong></div>
        </div>
      </div>

      <div className={styles.tabsBar}>
        {['pays', 'regions', 'villes'].map(tab => (
          <button key={tab} className={activeTab === tab ? styles.tabActive : styles.tab} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.actionBar}>
        <div className={styles.searchWrapper}>
          <input 
            type="text" 
            placeholder={`Rechercher ${activeTab}...`} 
            className={styles.searchInput}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>NOM</th>
              {activeTab === 'pays' && <th className={styles.th}>CODE</th>}
              {activeTab !== 'pays' && <th className={styles.th}>PARENT</th>}
              <th className={styles.th} style={{ textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item._id} className={styles.tr}>
                <td className={styles.td}>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>{item.name}</span>
                </td>
                {activeTab === 'pays' && (
                  <td className={styles.td}>
                    <span className={styles.badgeIso}>{item.code}</span>
                  </td>
                )}
                {activeTab === 'regions' && <td className={styles.td}>{item.country?.name || 'N/A'}</td>}
                {activeTab === 'villes' && <td className={styles.td}>{item.region?.name || 'N/A'}</td>}
                <td className={styles.td} style={{ textAlign: 'center' }}>
                  <div className={styles.actionsFlex} style={{ justifyContent: 'center' }}>
                    <Edit className={styles.editBtnIcon} onClick={() => openModal(item)} size={18} />
                    <Trash2 className={styles.deleteBtnIcon} onClick={() => handleDelete(item._id, activeTab)} size={18} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editItem ? "Modifier" : "Ajouter"} {activeTab.slice(0, -1)}</h3>
              <X className={styles.closeIcon} style={{ cursor: 'pointer' }} onClick={closeModal} />
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className={styles.formGroup}>
                <label>Nom</label>
                <input 
                  className={styles.modalInput} 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder={`Nom du ${activeTab.slice(0, -1)}`}
                  required 
                />
              </div>

              {activeTab === 'pays' && (
                <div className={styles.formGroup}>
                  <label>Code ISO</label>
                  <input 
                    className={styles.modalInput} 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value})} 
                    placeholder="Ex: FR, US, TN..."
                  />
                </div>
              )}

              {activeTab === 'regions' && (
                <div className={styles.formGroup}>
                  <label>Pays</label>
                  <select 
                    className={styles.modalSelect} 
                    value={formData.countryId} 
                    onChange={(e) => setFormData({...formData, countryId: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner un pays</option>
                    {countries.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {activeTab === 'villes' && (
                <div className={styles.formGroup}>
                  <label>Région</label>
                  <select 
                    className={styles.modalSelect} 
                    value={formData.regionId} 
                    onChange={(e) => setFormData({...formData, regionId: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner une région</option>
                    {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>
              )}

              <button type="submit" className={styles.submitBtn} style={{ width: '100%', marginTop: '10px' }}>
                {editItem ? "Confirmer la modification" : "Ajouter"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGeography;