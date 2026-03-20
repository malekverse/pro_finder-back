import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit, Globe, Map, MapPin, Search, Plus, X } from 'lucide-react';
import styles from '../../../styles/dashboardAdmin.module.css';

const AdminGeography = () => {
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  
  const [activeTab, setActiveTab] = useState('pays');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', countryId: '', regionId: '' });

  const API = "http://localhost:5000/localisation";

  useEffect(() => { refreshData(); }, []);

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

      if (editItem) {
        await axios.put(url, payload);
      } else {
        await axios.post(url, payload);
      }

      closeModal();
      refreshData();
    } catch (err) {
      console.error("Erreur save:", err);
      alert("Échec de l'enregistrement. Vérifiez vos données.");
    }
  };

const handleDelete = async (id, type) => {
  if (!window.confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
  
  try {
    // 'villes' doit correspondre au nom de votre onglet actif
    let endpoint = type === 'pays' ? "deleteCountry" : type === 'regions' ? "deleteRegion" : "deleteCity";
    
    const res = await axios.delete(`${API}/${endpoint}/${id}`);
    
    if (res.status === 200) {
      refreshData();
      alert("Supprimé avec succès");
    }
  } catch (err) {
    // C'est cette alerte que vous voyez sur l'image image_0d12ff.png
    alert("Erreur: Vérifiez que la route DELETE existe sur le serveur.");
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

  return (
    <div className={styles.container}>
      {/* STATS HEADER */}
      <div className={styles.gridWrapper}>
        <div className={styles.cardStat}>
            <div className={styles.statIcon} style={{background: '#eef2ff', color: '#6366f1'}}><Globe size={22}/></div>
            <div><p>Pays</p><strong>{countries.length}</strong></div>
        </div>
        <div className={styles.cardStat}>
            <div className={styles.statIcon} style={{background: '#f0fdf4', color: '#22c55e'}}><Map size={22}/></div>
            <div><p>Régions</p><strong>{regions.length}</strong></div>
        </div>
        <div className={styles.cardStat}>
            <div className={styles.statIcon} style={{background: '#faf5ff', color: '#a855f7'}}><MapPin size={22}/></div>
            <div><p>Villes</p><strong>{cities.length}</strong></div>
        </div>
      </div>

      <div className={styles.mainContentCard}>
        <div className={styles.tabsHeader}>
          {['pays', 'regions', 'villes'].map(tab => (
            <button key={tab} className={activeTab === tab ? styles.tabActive : styles.tab} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.actionBar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Rechercher..." className={styles.searchInput} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className={styles.addBtnBlue} onClick={() => openModal()}>
            <Plus size={18} /> Ajouter
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.theadDark}>
              <tr>
                <th className={styles.th}>NOM</th>
                {activeTab === 'pays' && <th className={styles.th}>CODE</th>}
                {activeTab !== 'pays' && <th className={styles.th}>PARENT</th>}
                <th className={styles.th}>STATUT</th>
                <th className={styles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {/* RENDU PAYS */}
              {activeTab === 'pays' && countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
                <tr key={c._id} className={styles.tr}>
                  <td className={styles.td}><strong>{c.name}</strong></td>
                  <td className={styles.td}><span className={styles.badgeIso}>{c.code}</span></td>
                  <td className={styles.td}><span className={styles.statusBadgeGreen}>Actif</span></td>
                  <td className={styles.td}>
                    <div className={styles.actionsFlex}>
                      <Edit className={styles.editBtnIcon} onClick={() => openModal(c)} size={18} />
                      <Trash2 className={styles.deleteBtnIcon} onClick={() => handleDelete(c._id, 'pays')} size={18} />
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* RENDU REGIONS */}
              {activeTab === 'regions' && regions.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map(r => (
                <tr key={r._id} className={styles.tr}>
                  <td className={styles.td}><strong>{r.name}</strong></td>
                  <td className={styles.td}>{r.country?.name || 'N/A'}</td>
                  <td className={styles.td}><span className={styles.statusBadgeGreen}>Actif</span></td>
                  <td className={styles.td}>
                    <div className={styles.actionsFlex}>
                      <Edit className={styles.editBtnIcon} onClick={() => openModal(r)} size={18} />
                      <Trash2 className={styles.deleteBtnIcon} onClick={() => handleDelete(r._id, 'regions')} size={18} />
                    </div>
                  </td>
                </tr>
              ))}

              {/* RENDU VILLES */}
              {activeTab === 'villes' && cities.filter(v => v.name.toLowerCase().includes(search.toLowerCase())).map(v => (
                <tr key={v._id} className={styles.tr}>
                  <td className={styles.td}><strong>{v.name}</strong></td>
                  <td className={styles.td}>{v.region?.name || 'N/A'}</td>
                  <td className={styles.td}><span className={styles.statusBadgeGreen}>Actif</span></td>
                  <td className={styles.td}>
                    <div className={styles.actionsFlex}>
                      <Edit className={styles.editBtnIcon} onClick={() => openModal(v)} size={18} />
                      <Trash2 className={styles.deleteBtnIcon} onClick={() => handleDelete(v._id, 'villes')} size={18} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL (PAYS / REGION / VILLE) */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editItem ? "Modifier" : "Ajouter"} {activeTab}</h3>
              <X className={styles.closeIcon} onClick={closeModal} />
            </div>
            <form onSubmit={handleSubmit} className={styles.formContainer}>
              <input 
                className={styles.modalInput} 
                placeholder="Nom" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />

              {activeTab === 'pays' && (
                <input 
                  className={styles.modalInput} 
                  placeholder="Code ISO" 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})} 
                />
              )}

              {activeTab === 'regions' && (
                <select className={styles.modalSelect} value={formData.countryId} onChange={(e) => setFormData({...formData, countryId: e.target.value})} required>
                  <option value="">Choisir un Pays</option>
                  {countries.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              )}

              {activeTab === 'villes' && (
                <select className={styles.modalSelect} value={formData.regionId} onChange={(e) => setFormData({...formData, regionId: e.target.value})} required>
                  <option value="">Choisir une Région</option>
                  {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
              )}

              <button type="submit" className={styles.submitBtn}>Confirmer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGeography;