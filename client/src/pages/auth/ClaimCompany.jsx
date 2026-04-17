import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Building, Mail, Lock, Phone, Globe, MapPin, Briefcase, 
  FileText, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle,
  Camera, Image as ImageIcon, Send, ShieldCheck
} from 'lucide-react';
import Autocomplete from "../../components/auth/Autocomplete";
import './ClaimCompany.css';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const ClaimCompany = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: '',
    region: '',
    city: '',
    description: '',
    website: '',
    logoFile: null,
    coverFile: null,
    domaine: '',
    sous_domaine: '',
    selectedServices: []
  });

  // Options states
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [services, setServices] = useState([]);

  // Previews
  const [previews, setPreviews] = useState({ logo: null, cover: null });

  // Fetch Preview Data
  useEffect(() => {
    if (token) {
      fetch(`http://localhost:5000/company/claim-preview?token=${token}`)
        .then(res => {
          if (!res.ok) throw new Error("Jeton invalide ou expiré");
          return res.json();
        })
        .then(data => {
          setFormData(prev => ({
            ...prev,
            companyName: data.companyName || '',
            email: data.email || '',
            phone: data.phone || '',
            website: data.website || '',
            description: data.description || '',
            country: data.country || '',
            region: data.region || '',
            city: data.city || '',
            selectedServices: data.services || []
          }));
          
          if (data.logoUrl) setPreviews(p => ({ ...p, logo: data.logoUrl }));
          if (data.coverUrl) setPreviews(p => ({ ...p, cover: data.coverUrl }));
        })
        .catch(err => {
          setError(err.message);
        });
    }
  }, [token]);

  // Initial Fetches
  useEffect(() => {
    fetch("http://localhost:5000/localisation/getCountries")
      .then(res => res.json()).then(setCountries).catch(console.error);
    
    fetch("http://localhost:5000/categories/categories")
      .then(res => res.json()).then(setCategories).catch(console.error);
  }, []);

  // Cascading Localisation
  useEffect(() => {
    if (formData.country) {
      fetch(`http://localhost:5000/localisation/getRegionsByCountry/${formData.country}`)
        .then(res => res.json()).then(data => setRegions(data.regions || [])).catch(console.error);
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.region) {
      fetch(`http://localhost:5000/localisation/getCitiesByRegion/${formData.region}`)
        .then(res => res.json()).then(setCities).catch(console.error);
    }
  }, [formData.region]);

  // Cascading Taxonomy
  useEffect(() => {
    if (formData.domaine) {
      fetch(`http://localhost:5000/categories/subCategories/${formData.domaine}`)
        .then(res => res.json()).then(setSubCategories).catch(console.error);
    }
  }, [formData.domaine]);

  useEffect(() => {
    if (formData.sous_domaine) {
      fetch(`http://localhost:5000/categories/services/${formData.sous_domaine}`)
        .then(res => res.json()).then(setServices).catch(console.error);
    }
  }, [formData.sous_domaine]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, [type]: file }));
    setPreviews(prev => ({ ...prev, [type === 'logoFile' ? 'logo' : 'cover']: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        return setError("Les mots de passe ne correspondent pas.");
      }
      return setStep(2);
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        token,
        password: formData.password,
        phone: formData.phone,
        country: formData.country,
        region: formData.region,
        city: formData.city,
        description: formData.description,
        website: formData.website,
        services: formData.selectedServices,
        logoUrl: formData.logoFile ? await fileToBase64(formData.logoFile) : null,
        coverUrl: formData.coverFile ? await fileToBase64(formData.coverFile) : null
      };

      const response = await fetch('http://localhost:5000/company/claim-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/auth/login'), 3000);
      } else {
        setError(data.message || "Erreur lors de la revendication.");
      }
    } catch (err) {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claim-page-container">
      <div className="claim-card">
        <div className="claim-header">
          <div className="claim-logo-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h2 className="claim-title">{success ? 'Félicitations !' : 'Revendiquez votre fiche'}</h2>
          {!success && (
            <p className="claim-subtitle">
              Étape {step} sur 2 : {step === 1 ? 'Compte et Localisation' : 'Détails et Profession'}
            </p>
          )}
        </div>

        <div className="step-indicator-bar">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
          <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
        </div>

        {error && (
          <div className="claim-error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{width: '20px', height: '20px', flexShrink: 0}}>
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.401 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success ? (
          <div className="claim-success-ui">
            <div className="success-icon-container">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="success-message">Votre entreprise est maintenant officiellement la vôtre. Redirection vers la page de connexion...</p>
          </div>
        ) : (
          <form className="claim-form" onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <div className="input-group">
                  <label><Building size={14} /> Nom de l'entreprise</label>
                  <input name="companyName" type="text" value={formData.companyName} onChange={handleChange} className="claim-input" placeholder="Ex: Ma Super Entreprise" />
                </div>

                <div className="input-group">
                  <label><Mail size={14} /> Email professionnel</label>
                  <input name="email" type="email" value={formData.email} readOnly className="claim-input" style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', borderStyle: 'dashed' }} />
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={10} /> Cet email sera utilisé pour votre compte administrateur.
                  </p>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label><Lock size={14} /> Mot de passe</label>
                    <input name="password" type="password" required placeholder="••••••••" value={formData.password} onChange={handleChange} className="claim-input" />
                  </div>
                  <div className="input-group">
                    <label><Lock size={14} /> Confirmation</label>
                    <input name="confirmPassword" type="password" required placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className="claim-input" />
                  </div>
                </div>

                <div className="input-group">
                  <label><Phone size={14} /> Téléphone direct</label>
                  <input name="phone" type="tel" required placeholder="+216 -- --- ---" value={formData.phone} onChange={handleChange} className="claim-input" />
                </div>

                <Autocomplete
                  label={<><Globe size={14} /> Pays</>}
                  options={countries}
                  placeholder="Choisir pays..."
                  value={countries.find(c => c._id === formData.country)}
                  onSelect={(c) => setFormData({...formData, country: c?._id, region: '', city: ''})}
                />

                <div className="form-row">
                  <Autocomplete
                    label={<><MapPin size={14} /> Région</>}
                    options={regions}
                    placeholder="Choisir région..."
                    value={regions.find(r => r._id === formData.region)}
                    onSelect={(r) => setFormData({...formData, region: r?._id, city: ''})}
                  />
                  <Autocomplete
                    label={<><MapPin size={14} /> Ville</>}
                    options={cities}
                    placeholder="Choisir ville..."
                    value={cities.find(c => c._id === formData.city)}
                    onSelect={(c) => setFormData({...formData, city: c?._id})}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="form-row">
                  <Autocomplete
                    label={<><Briefcase size={14} /> Domaine</>}
                    options={categories}
                    value={categories.find(c => c._id === formData.domaine)}
                    onSelect={(c) => setFormData({...formData, domaine: c?._id, sous_domaine: '', selectedServices: []})}
                  />
                  <Autocomplete
                    label={<><Briefcase size={14} /> Sous-domaine</>}
                    options={subCategories}
                    value={subCategories.find(s => s._id === formData.sous_domaine)}
                    onSelect={(s) => setFormData({...formData, sous_domaine: s?._id, selectedServices: []})}
                  />
                </div>

                <Autocomplete
                   label={<><Briefcase size={14} /> Services proposés</>}
                   placeholder="Ajouter des services..."
                   options={services}
                   onSelect={(s) => {
                     if (s && !formData.selectedServices.includes(s._id)) {
                       setFormData({ ...formData, selectedServices: [...formData.selectedServices, s._id] });
                     }
                   }}
                />

                <div className="selected-tags">
                  {formData.selectedServices.map(id => {
                    const s = services.find(srv => srv._id === id);
                    return (
                      <span key={id} className="tag">
                        {s?.name}
                        <button type="button" onClick={() => setFormData({...formData, selectedServices: formData.selectedServices.filter(sid => sid !== id)})}>×</button>
                      </span>
                    );
                  })}
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label><Camera size={14} /> Logo</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logoFile')} className="claim-input" />
                    {previews.logo && <img src={previews.logo} alt="logo preview" style={{ width: '40px', height: '40px', borderRadius: '4px', marginTop: '4px', border: '1px solid #e2e8f0' }} />}
                  </div>
                  <div className="input-group">
                    <label><ImageIcon size={14} /> Couverture</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'coverFile')} className="claim-input" />
                    {previews.cover && <img src={previews.cover} alt="cover preview" style={{ width: '40px', height: '40px', borderRadius: '4px', marginTop: '4px', border: '1px solid #e2e8f0' }} />}
                  </div>
                </div>

                <div className="input-group">
                  <label><FileText size={14} /> Présentation de l'entreprise</label>
                  <textarea name="description" rows="3" className="claim-input" value={formData.description} onChange={handleChange} placeholder="Décrivez votre expertise, votre histoire..." />
                </div>
              </>
            )}

            <div className="form-actions">
              {step === 2 && (
                <button type="button" className="claim-submit-btn secondary" onClick={() => setStep(1)} disabled={loading}>
                  <ArrowLeft size={18} /> Retour
                </button>
              )}
              <button type="submit" disabled={loading || !token} className="claim-submit-btn primary">
                {loading ? (
                  <Send size={18} className="animate-spin" />
                ) : (
                  <>
                    {step === 1 ? 'Suivant' : 'Finaliser la revendication'} 
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClaimCompany;


