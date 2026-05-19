import React, { useState, useEffect } from 'react';
import styles from '../styles/dashboardAdmin.module.css';

const AiScraperTool = () => {
  const [activeMode, setActiveMode] = useState('mass'); // 'mass' ou 'single'

  // States Mode Masse
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // States Mode Unitaire
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // States Communs
  const [error, setError] = useState(null);
  const [taxonomyNodes, setTaxonomyNodes] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('http://localhost:5000/categories/services');
        const data = await response.json();
        if (Array.isArray(data)) {
          setTaxonomyNodes(data);
        }
      } catch (err) {
        console.error("Erreur de chargement des services:", err);
      }
    };
    fetchServices();
  }, []);

  // ================= RECHERCHE DE MASSE =================
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    setSearchLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await fetch('http://localhost:5001/api/search-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results.map(r => ({ ...r, status: 'idle', generateResult: null })));
      } else {
        setError(data.error || 'Erreur lors de la recherche.');
      }
    } catch (err) {
      setError("Impossible de contacter le Robot. Le port 5001 est-il ouvert ?");
    } finally {
      setSearchLoading(false);
    }
  };

  const processMassItem = async (index) => {
    const newResults = [...searchResults];
    const item = newResults[index];

    item.status = 'scraping';
    setSearchResults([...newResults]);

    try {
      // 1. Scraping Gemini
      const scrapeResp = await fetch('http://localhost:5001/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.url, taxonomyOptions: taxonomyNodes.map(s => s.name) }),
      });
      const scrapeData = await scrapeResp.json();
      if (!scrapeData.success) throw new Error("Echec du Scraping IA.");

      const genResult = scrapeData.data;
      if (!genResult["Email de contact"]) {
        item.status = 'failed_no_email';
        setSearchResults([...newResults]);
        return;
      }

      // 2. Sauvegarde BDD et Envoi E-mail
      const categoryName = genResult["Catégorie suggérée"] || genResult.category;
      const matchedNode = taxonomyNodes.find(s => s.name.trim().toLowerCase() === String(categoryName).trim().toLowerCase());

      const saveResp = await fetch('http://localhost:5000/company/ai-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: genResult["Nom de l'entreprise"] || genResult.name,
          description: genResult["Description courte"] || genResult.description,
          suggestedCategory: categoryName,
          serviceId: matchedNode ? matchedNode._id : null,
          website: item.url,
          email: genResult["Email de contact"]
        }),
      });

      if (saveResp.status === 409) {
        item.status = 'already_exists';
        setSearchResults([...newResults]);
        return;
      }

      if (!saveResp.ok) throw new Error("Erreur de sauvegarde.");

      item.status = 'saved';
      item.generateResult = genResult;
      setSearchResults([...newResults]);

    } catch (err) {
      console.error(err);
      item.status = 'error';
      setSearchResults([...newResults]);
    }
  };

  const processAllItems = async () => {
    setIsProcessingAll(true);
    for (let i = 0; i < searchResults.length; i++) {
      if (searchResults[i].status === 'idle') {
        await processMassItem(i);
        // On augmente la pause à 5s pour respecter les quotas de la version gratuite de Gemini
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    setIsProcessingAll(false);
  };

  // ================= RECHERCHE UNITAIRE =================
  const handleScrapeSingle = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('http://localhost:5001/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, taxonomyOptions: taxonomyNodes.map(s => s.name) }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Erreur lors de l’analyse');
      }
    } catch (err) {
      setError("Impossible de se connecter au serveur d'IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSingle = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);

    const categoryName = result["Catégorie suggérée"] || result.category;
    const matchedNode = taxonomyNodes.find(s => s.name.trim().toLowerCase() === String(categoryName).trim().toLowerCase());

    try {
      const response = await fetch('http://localhost:5000/company/ai-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: result["Nom de l'entreprise"] || result.name,
          description: result["Description courte"] || result.description,
          suggestedCategory: categoryName,
          serviceId: matchedNode ? matchedNode._id : null,
          website: url,
          email: result["Email de contact"]
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
      } else {
        setError(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError("Impossible de contacter le serveur principal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title} style={{ marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: 'bold' }}>Tracteur IA & Crawler</h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Recherchez sur le Web et convertissez les entreprises automatiquement.</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => { setActiveMode('mass'); setError(null); }}
          style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: activeMode === 'mass' ? '#1E3A5F' : '#e2e8f0', color: activeMode === 'mass' ? 'white' : '#475569' }}
        >
          Robot de Masse
        </button>
        <button
          onClick={() => { setActiveMode('single'); setError(null); }}
          style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: activeMode === 'single' ? '#1E3A5F' : '#e2e8f0', color: activeMode === 'single' ? 'white' : '#475569' }}
        >
          Mode Unitaire
        </button>
      </div>

      <div className={styles.card}>
        {error && (
          <div style={{ padding: '15px', marginBottom: '20px', color: 'var(--danger)', backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}

        {/* MODE MASSE */}
        {activeMode === 'mass' && (
          <div>
            <h2 className={styles.cardTitle}>Robot Crawler (Google)</h2>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.9rem' }}>
              Tapez une recherche (ex: <i>"Cliniques à Sousse"</i>). Le robot cherchera des sites web correspondants. Vous pourrez ensuite valider ceux que vous voulez inviter.
            </p>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <input
                type="text"
                required
                placeholder="Ex: Agences de voyage à Djerba"
                className={styles.input}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" disabled={searchLoading} className={styles.button} style={{ opacity: searchLoading ? 0.7 : 1 }}>
                {searchLoading ? 'Recherche en cours (~10s)...' : 'Lancer le Robot'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#1e293b' }}>
                    Prospects identifiés ({searchResults.filter(item => !['already_exists', 'error'].includes(item.status)).length})
                  </h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {searchResults.some(item => item.status === 'idle') && (
                      <button
                        onClick={processAllItems}
                        disabled={isProcessingAll}
                        className={styles.addBtnBlue}
                        style={{
                          padding: '8px 16px',
                          opacity: isProcessingAll ? 0.6 : 1,
                          fontSize: '14px'
                        }}
                      >
                        {isProcessingAll ? 'Analyse profonde...' : 'Lancer le Deep Scan'}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {searchResults
                    .filter(item => !['error'].includes(item.status))
                    .map((item, index) => {
                      // On doit retrouver le vrai index dans l'original pour processMassItem
                      const originalIndex = searchResults.findIndex(r => r.url === item.url);
                      return (
                        <div key={item.url} style={{
                          padding: '20px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          animation: 'fadeIn 0.5s ease-out'
                        }}>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#0f172a' }}>{item.name}</h4>
                            <a href={item.url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.9rem', textDecoration: 'none' }}>{item.url}</a>

                            {item.generateResult && (
                              <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#475569', backgroundColor: '#e2e8f0', padding: '10px', borderRadius: '8px' }}>
                                 {item.generateResult["Email de contact"]} <br />
                                 {item.generateResult["Catégorie suggérée"] || item.generateResult.category}
                              </div>
                            )}
                          </div>

                          <div style={{ marginLeft: '20px', minWidth: '150px', textAlign: 'right' }}>
                            {item.status === 'idle' && (
                              <button onClick={() => processMassItem(originalIndex)} style={{ padding: '8px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Extraire & Ajouter
                              </button>
                            )}
                            {item.status === 'scraping' && <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Extraction IA...</span>}
                            {item.status === 'error' && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Erreur Scraping</span>}
                            {item.status === 'failed_no_email' && <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem' }}>Ignoré (Aucun Email)</span>}
                            {item.status === 'already_exists' && <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.85rem' }}>Ignoré (Existe déjà)</span>}
                            {item.status === 'saved' && <span style={{ color: '#059669', fontWeight: 'bold' }}>Sauvegardé & Invité</span>}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE UNITAIRE */}
        {activeMode === 'single' && (
          <div>
            <h2 className={styles.cardTitle} style={{ margin: '0 0 20px 0' }}>Insertion d'URL Explicite</h2>
            <form onSubmit={handleScrapeSingle} style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <input type="url" required placeholder="Ex: https://www.apple.com" className={styles.input} value={url} onChange={(e) => setUrl(e.target.value)} />
              <button type="submit" disabled={loading} className={styles.button} style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Analyse...' : 'Générer la fiche'}
              </button>
            </form>

            {result && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '25px', marginTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '15px', marginBottom: '5px' }}>
                  {result["Nom de l'entreprise"] || result.name || 'Nom non trouvé'}
                </h3>
                <div style={{ marginBottom: '15px', fontSize: '14px', color: '#475569' }}>
                  ✉️ Contact : <strong>{result["Email de contact"] || "Non trouvé"}</strong>
                </div>
                <p style={{ fontSize: '14px', color: '#6366f1', fontWeight: '600', marginBottom: '20px' }}>
                  Catégorie : {result["Catégorie suggérée"] || result.category || 'Non classé'}
                </p>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '0.95rem' }}>
                    {result["Description courte"] || result.description || 'Aucune description générée.'}
                  </p>
                </div>

                {!result["Email de contact"] ? (
                  <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                    L'IA n'a trouvé aucun e-mail, ajout bloqué.
                  </div>
                ) : !saveSuccess ? (
                  <button onClick={handleSaveSingle} disabled={saving} className={styles.button} style={{ marginTop: '25px', width: '100%', backgroundColor: 'var(--success)' }}>
                    {saving ? 'Sauvegarde...' : 'Enregistrer & Inviter'}
                  </button>
                ) : (
                  <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                    Enregistrée ! Email envoyé.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiScraperTool;
