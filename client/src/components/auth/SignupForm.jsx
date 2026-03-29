import { useRegisterMutation } from '../../redux/features/auth/authApiSlice';
import styles from '../../styles/Form.module.css';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/features/auth/authSlice'; 
import Cookies from 'js-cookie';
// On utilise './' pour dire "dans le même dossier"
import Autocomplete from "./Autocomplete";
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const SignupForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // AJOUTÉ
  const [role, setRole] = useState('user');
  const [step, setStep] = useState(1);
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  const [userInputs, setUserInputs] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    avatarUrl: null,
  });

  const [companyInputs, setCompanyInputs] = useState({
    name: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    logo_url: null,
    cover_url: null,
    country_id: '',
    region_id: '',
    city_id: '',
    domaine: '',        // Nouveau
    sous_domaine: [],    // Nouveau
  type_societe: [],
  });
const [categories, setCategories] = useState([]);
const [subCategories, setSubCategories] = useState([]);
const [services, setServices] = useState([]);
useEffect(() => {
  fetch("http://localhost:5000/categories/categories")
    .then(res => res.json())
    .then(data => setCategories(data))
    .catch(err => console.log(err));
}, []);
useEffect(() => {
  if (companyInputs.domaine) {
    fetch(`http://localhost:5000/categories/subCategories/${companyInputs.domaine}`)
      .then(res => res.json())
      .then(data => setSubCategories(data))
      .catch(err => console.log(err));
  }
}, [companyInputs.domaine]);
useEffect(() => {
  if (companyInputs.sous_domaine) {
    fetch(`http://localhost:5000/categories/services/${companyInputs.sous_domaine}`)
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(err => console.log(err));
  }
}, [companyInputs.sous_domaine]);
  const [register, { isError, error }] = useRegisterMutation();

  useEffect(() => {
    fetch("http://localhost:5000/localisation/getCountries")
      .then(res => res.json())
      .then(data => setCountries(data))
      .catch(err => console.log(err));
  }, []);

useEffect(() => {
 
  if (companyInputs.country_id) {
    fetch(`http://localhost:5000/localisation/getRegionsByCountry/${companyInputs.country_id}`)
      .then(res => res.json())
      .then(data => {
        setRegions(data.regions || []);
      })
      .catch(err => console.log(err));
  }
}, [companyInputs.country_id]);

  useEffect(() => {
  if (companyInputs.region_id) {
    fetch(`http://localhost:5000/localisation/getCitiesByRegion/${companyInputs.region_id}`)
      .then(res => res.json())
      .then(data => setCities(data))
      .catch(err => console.log(err));
  } 
}, [companyInputs.region_id, companyInputs.country_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let payload = {};

      if (role === 'user') {
        if (userInputs.password !== userInputs.confirmPassword) {
          alert("Passwords do not match");
          return;
        }

        payload = {
          fullName: userInputs.fullName,
          email: userInputs.email,
          password: userInputs.password,
          phone: userInputs.phone,
          avatarUrl: userInputs.avatarUrl ? await fileToBase64(userInputs.avatarUrl) : null,
          roles: ["user"],
        };
      } else if (role === 'company') {
        if (companyInputs.password !== companyInputs.confirm_password) {
          alert("Passwords do not match");
          return;
        }

        payload = {
          companyName: companyInputs.name,
          email: companyInputs.email,
          password: companyInputs.password,
          phone: companyInputs.phone,
          website: companyInputs.website || '',
          description: companyInputs.description || '',
          logoUrl: companyInputs.logo_url ? await fileToBase64(companyInputs.logo_url) : null,
          coverUrl: companyInputs.cover_url ? await fileToBase64(companyInputs.cover_url) : null,
          country: companyInputs.country_id,
          region: companyInputs.region_id,
          city: companyInputs.city_id,
          services: companyInputs.type_societe,
          roles: ["company"],
        };
      }

      const response = await register(payload).unwrap();

      if (response?.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
        Cookies.set('accessToken', response.accessToken, { expires: 7 }); 

        dispatch(setCredentials({ 
          accessToken: response.accessToken, 
          account: response.account 
        }));

        // Redirection
        const userRoles = response.account?.roles || [];
        if (userRoles.includes("company")) {
          navigate("/company/stats");
        } else {
          navigate("/profile");
        }
      } else if (response?.message) {
        // Cas du compte en attente (Company)
        alert(response.message);
        navigate("/auth/login");
      }
    } catch (err) {
      if (err.status === 413) {
        alert("Images trop lourdes ! Réduisez la taille ou continuez sans image.");
      }
      console.error("Registration error:", err);
    }
  };

  return (
    <div className={styles.splitContainer}>
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ color: '#1E3A5F', fontSize: '32px', fontWeight: '800', marginBottom: '10px' }}>ProFinder</h1>
            <h2 className={styles.mainTitle}>Créer un compte</h2>
            <p className={styles.subtitle}>Choisissez votre type de compte pour commencer</p>
          </div>

          <div className={styles.roleSelector}>
            <button
              type="button"
              className={`${styles.roleButton} ${role === 'user' ? styles.activeRole : ''}`}
              onClick={() => { setRole('user'); setStep(1); }}
            >
              Particulier
            </button>
            <button
              type="button"
              className={`${styles.roleButton} ${role === 'company' ? styles.activeRole : ''}`}
              onClick={() => { setRole('company'); setStep(1); }}
            >
              Entreprise
            </button>
          </div>

          {role === 'user' && (
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label>Nom Complet</label>
                <input
                  type="text"
                  placeholder="Ex: Ahmed Ben Salem"
                  required
                  value={userInputs.fullName}
                  onChange={(e) => setUserInputs({ ...userInputs, fullName: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Adresse Email</label>
                <input
                  type="email"
                  placeholder="nom@exemple.com"
                  required
                  value={userInputs.email}
                  onChange={(e) => setUserInputs({ ...userInputs, email: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label>Mot de passe</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    value={userInputs.password}
                    onChange={(e) => setUserInputs({ ...userInputs, password: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label>Confirmation</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    value={userInputs.confirmPassword}
                    onChange={(e) => setUserInputs({ ...userInputs, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Téléphone</label>
                <input
                  type="tel"
                  placeholder="+216 -- --- ---"
                  value={userInputs.phone}
                  onChange={(e) => setUserInputs({ ...userInputs, phone: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Photo de profil</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUserInputs({ ...userInputs, avatarUrl: e.target.files[0] })}
                />
              </div>
              <button type="submit" className={styles.submitButton}>S'inscrire</button>
            </form>
          )}

          {role === 'company' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
                <div style={{ width: '40px', height: '6px', borderRadius: '3px', background: step === 1 ? '#1E3A5F' : '#e2e8f0' }} />
                <div style={{ width: '40px', height: '6px', borderRadius: '3px', background: step === 2 ? '#1E3A5F' : '#e2e8f0' }} />
              </div>

              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className={styles.stepContent}>
                    <div className={styles.inputGroup}>
                      <label>Nom de l'entreprise</label>
                      <input
                        type="text"
                        placeholder="Ex: Pro Services S.A.R.L"
                        required
                        value={companyInputs.name}
                        onChange={(e) => setCompanyInputs({ ...companyInputs, name: e.target.value })}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Description</label>
                      <textarea
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '15px' }}
                        placeholder="Parlez-nous de vos services..."
                        rows="3"
                        value={companyInputs.description}
                        onChange={(e) => setCompanyInputs({ ...companyInputs, description: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label>Site Web</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={companyInputs.website}
                          onChange={(e) => setCompanyInputs({ ...companyInputs, website: e.target.value })}
                        />
                      </div>
                      <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label>Email Professionnel</label>
                        <input
                          type="email"
                          placeholder="contact@entreprise.com"
                          value={companyInputs.email}
                          onChange={(e) => setCompanyInputs({ ...companyInputs, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label>Mot de passe</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          required
                          value={companyInputs.password}
                          onChange={(e) => setCompanyInputs({ ...companyInputs, password: e.target.value })}
                        />
                      </div>
                      <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label>Confirmation</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          required
                          value={companyInputs.confirm_password}
                          onChange={(e) => setCompanyInputs({ ...companyInputs, confirm_password: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Téléphone</label>
                      <input
                        type="tel"
                        placeholder="+216 -- --- ---"
                        required
                        value={companyInputs.phone}
                        onChange={(e) => setCompanyInputs({ ...companyInputs, phone: e.target.value })}
                      />
                    </div>
                    <button type="button" className={styles.submitButton} onClick={() => setStep(2)}>Étape suivante</button>
                  </div>
                )}
                {step === 2 && (
                  <div className={styles.stepContent}>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                      <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label>Logo</label>
                        <input type="file" accept="image/*" onChange={(e) => setCompanyInputs({ ...companyInputs, logo_url: e.target.files[0] })} />
                      </div>
                      <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label>Photo de couverture</label>
                        <input type="file" accept="image/*" onChange={(e) => setCompanyInputs({ ...companyInputs, cover_url: e.target.files[0] })} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <Autocomplete
                          label="Domaine d'activité"
                          placeholder="Choisir domaine..."
                          options={categories}
                          getOptionLabel={(option) => option.name}
                          value={companyInputs.domaine ? categories.find(c => c._id === companyInputs.domaine) : null}
                          onSelect={(selected) => {
                            setCompanyInputs(prev => ({
                              ...prev,
                              domaine: selected?._id || "",
                              sous_domaine: "",
                              type_societe: []
                            }));
                          }}
                        />

                        <Autocomplete
                          label="Sous-Domaine"
                          placeholder="Choisir sous domaine..."
                          options={subCategories}
                          getOptionLabel={(option) => option.name}
                          value={companyInputs.sous_domaine ? subCategories.find(s => s._id === companyInputs.sous_domaine) : null}
                          onSelect={(selected) => {
                            setCompanyInputs(prev => ({
                              ...prev,
                              sous_domaine: selected?._id || "",
                              type_societe: []
                            }));
                          }}
                        />

                        <div className={styles.inputGroup}>
                          <label>Services proposés</label>
                          <Autocomplete
                            placeholder="Choisir service..."
                            options={services}
                            getOptionLabel={(option) => option.name}
                            value={[]}
                            onSelect={(selected) => {
                              if (selected && !companyInputs.type_societe.includes(selected._id)) {
                                setCompanyInputs(prev => ({
                                  ...prev,
                                  type_societe: [...prev.type_societe, selected._id]
                                }));
                              }
                            }}
                          />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                            {companyInputs.type_societe.map(id => {
                              const service = services.find(s => s._id === id);
                              return (
                                <span key={id} style={{ background: '#e0e7ff', padding: '4px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                                  {service?.name} 
                                  <button type="button" style={{ background: 'none', border: 'none', marginLeft: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#ef4444' }} onClick={() => {
                                    setCompanyInputs(prev => ({
                                      ...prev,
                                      type_societe: prev.type_societe.filter(sid => sid !== id)
                                    }));
                                  }}>×</button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <Autocomplete
                          label="Pays"
                          placeholder="Tunisie"
                          options={countries}
                          getOptionLabel={(option) => option.name}
                          value={companyInputs.country_id ? countries.find(c => c._id === companyInputs.country_id) : null}
                          onSelect={(country) => setCompanyInputs(prev => ({ ...prev, country_id: country._id, region_id: '', city_id: '' }))}
                        />

                        <Autocomplete
                          label="Région"
                          placeholder="Choisir région..."
                          options={regions}
                          getOptionLabel={(option) => option.name}
                          value={companyInputs.region_id ? regions.find(r => r._id === companyInputs.region_id) : null}
                          onSelect={(region) => setCompanyInputs(prev => ({ ...prev, region_id: region?._id, city_id: '' }))}
                        />

                        <Autocomplete
                          label="Ville"
                          placeholder="Choisir ville..."
                          options={cities}
                          getOptionLabel={(option) => option.name}
                          value={companyInputs.city_id ? cities.find(c => c._id === companyInputs.city_id) : null}
                          onSelect={(city) => setCompanyInputs(prev => ({ ...prev, city_id: city?._id }))}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                      <button type="button" className={styles.submitButton} style={{ background: '#f1f5f9', color: '#64748b', flex: 1 }} onClick={() => setStep(1)}>Retour</button>
                      <button type="submit" className={styles.submitButton} style={{ flex: 2 }}>Finaliser l'inscription</button>
                    </div>
                  </div>
                )}
              </form>
            </>
          )}

          {isError && <p className={styles.errorText}>{error?.data?.message || 'Erreur lors de l\'inscription'}</p>}

          <p className={styles.footerText}>
            Déjà inscrit ? 
            <Link to="/auth/login" className={styles.footerLink}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
