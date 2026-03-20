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
      <div className={styles.leftPanel}>
        <div className={styles.brandContent}>
          <h2 className={styles.logo}>🔷 Pro Finder</h2>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <div className={styles.roleSelector}>
            <button
              type="button"
              className={`${styles.roleButton} ${role === 'user' ? styles.activeRole : ''}`}
              onClick={() => { setRole('user'); setStep(1); }}
            >
              👤 User
            </button>
            <button
              type="button"
              className={`${styles.roleButton} ${role === 'company' ? styles.activeRole : ''}`}
              onClick={() => { setRole('company'); setStep(1); }}
            >
              🏢 Company
            </button>
          </div>

          {role === 'user' && (
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label>FULL NAME</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={userInputs.fullName}
                  onChange={(e) => setUserInputs({ ...userInputs, fullName: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>EMAIL</label>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={userInputs.email}
                  onChange={(e) => setUserInputs({ ...userInputs, email: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>PASSWORD</label>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={userInputs.password}
                  onChange={(e) => setUserInputs({ ...userInputs, password: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>CONFIRM PASSWORD</label>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  required
                  value={userInputs.confirmPassword}
                  onChange={(e) => setUserInputs({ ...userInputs, confirmPassword: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>PHONE</label>
                <input
                  type="tel"
                  placeholder="Phone"
                  value={userInputs.phone}
                  onChange={(e) => setUserInputs({ ...userInputs, phone: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>AVATAR</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUserInputs({ ...userInputs, avatarUrl: e.target.files[0] })}
                />
              </div>
              <button type="submit" className={styles.submitButton}>Create Account</button>
            </form>
          )}

          {role === 'company' && (
            <>
              <div className={`${styles.stepIndicator} ${step === 2 ? styles.step2 : ''}`}>
                <div className={`${styles.step} ${step === 1 ? styles.activeStep : ''}`} onClick={() => setStep(1)}>1</div>
                <div className={`${styles.step} ${step === 2 ? styles.activeStep : ''}`} onClick={() => setStep(2)}>2</div>
              </div>

              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className={styles.stepContent}>
                    <div className={styles.inputGroup}>
                      <label>COMPANY NAME</label>
                      <input
                        type="text"
                        placeholder="Company Name"
                        required
                        value={companyInputs.name}
                        onChange={(e) => setCompanyInputs({ ...companyInputs, name: e.target.value })}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>DESCRIPTION</label>
                      <textarea
                        placeholder="Description"
                        rows="3"
                        value={companyInputs.description}
                        onChange={(e) => setCompanyInputs({ ...companyInputs, description: e.target.value })}
                      />
                    </div>
                    <div className={styles.gridRow}>
                      <div className={styles.inputGroup}>
                        <label>WEBSITE</label>
                        <input
                          type="text"
                          placeholder="Website"
                          value={companyInputs.website}
                          onChange={(e) => setCompanyInputs({ ...companyInputs, website: e.target.value })}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>COMPANY EMAIL</label>
                        <input
                          type="email"
                          placeholder="Company Email"
                          value={companyInputs.email}
                          onChange={(e) => setCompanyInputs({ ...companyInputs, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>PHONE</label>
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={companyInputs.phone}
                        onChange={(e) => setCompanyInputs({ ...companyInputs, phone: e.target.value })}
                      />
                    </div>
                    <div className={styles.gridRow}>
                      <div className={styles.inputGroup}>
                        <label>PASSWORD</label>
                        <input
                          type="password"
                          placeholder="Password"
                          required
                          value={companyInputs.password}
                          onChange={(e) => setCompanyInputs({ ...companyInputs, password: e.target.value })}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>CONFIRM PASSWORD</label>
                        <input
                          type="password"
                          placeholder="Confirm Password"
                          required
                          value={companyInputs.confirm_password}
                          onChange={(e) => setCompanyInputs({ ...companyInputs, confirm_password: e.target.value })}
                        />
                      </div>
                    </div>
                    <button type="button" className={styles.submitButton} onClick={() => setStep(2)}>Next</button>
                  </div>
                )}
{step === 2 && (
                <div className={styles.stepContent}>
                  <div className={styles.mediaGrid}>
                    <div className={styles.fileCard}>
                      <label>LOGO</label>
                      <input type="file" accept="image/*" onChange={(e) => setCompanyInputs({ ...companyInputs, logo_url: e.target.files[0] })} />
                    </div>
                    <div className={styles.fileCard}>
                      <label>COVER</label>
                      <input type="file" accept="image/*" onChange={(e) => setCompanyInputs({ ...companyInputs, cover_url: e.target.files[0] })} />
                    </div>
                  </div>

                  <div className={styles.formColumnsGrid}>

                    {/* COLONNE GAUCHE */}
                    <div className={styles.formColumn}>

                     {/* DOMAINE */}
<Autocomplete
  label="DOMAINE"
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

{/* SOUS-DOMAINE */}
<Autocomplete
  label="SOUS-DOMAINE"
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

{/* TYPE SOCIETE / SERVICE (multi-selection) */}
<div className={styles.inputGroup}>
  <label>TYPE DE SOCIÉTÉ / SERVICE</label>
  
  <Autocomplete
    placeholder="Choisir service..."
    options={services}
    getOptionLabel={(option) => option.name}
    value={[]} // vide car on gère via tableau
    onSelect={(selected) => {
      if (selected && !companyInputs.type_societe.includes(selected._id)) {
        setCompanyInputs(prev => ({
          ...prev,
          type_societe: [...prev.type_societe, selected._id]
        }));
      }
    }}
  />

  {/* Afficher les services sélectionnés avec bouton pour supprimer */}
  <div className={styles.selectedItems}>
    {companyInputs.type_societe.map(id => {
      const service = services.find(s => s._id === id);
      return (
        <span key={id} className={styles.selectedItem}>
          {service?.name} 
          <button type="button" onClick={() => {
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

                    {/* COLONNE DROITE : Localisation */}
                    <div className={styles.formColumn}>
                      <Autocomplete
                        label="COUNTRY"
                        placeholder="Country"
                        options={countries}
                        getOptionLabel={(option) => option.name}
                        value={companyInputs.country_id ? countries.find(c => c._id === companyInputs.country_id) : null}
                        onSelect={(country) => setCompanyInputs(prev => ({ ...prev, country_id: country._id, region_id: '', city_id: '' }))}
                      />

                      <Autocomplete
                        label="REGION"
                        placeholder="Region"
                        options={regions}
                        getOptionLabel={(option) => option.name}
                        value={companyInputs.region_id ? regions.find(r => r._id === companyInputs.region_id) : null}
                        onSelect={(region) => setCompanyInputs(prev => ({ ...prev, region_id: region?._id, city_id: '' }))}
                      />

                      <Autocomplete
                        label="CITY"
                        placeholder="City"
                        options={cities}
                        getOptionLabel={(option) => option.name}
                        value={companyInputs.city_id ? cities.find(c => c._id === companyInputs.city_id) : null}
                        onSelect={(city) => setCompanyInputs(prev => ({ ...prev, city_id: city?._id }))}
                      />
                    </div>
                  </div>

                  <div className={styles.buttonRow}>
                    <button type="button" className={styles.backButton} onClick={() => setStep(1)}>← Back</button>
                    <button type="submit" className={styles.submitButton}>Create Company</button>
                  </div>
                </div>
              )}
            </form>
          </>
        )}

        {isError && <p className={styles.errorMsg}>{error?.data?.message || 'Registration failed'}</p>}

        <p className={styles.linkText}>
          Already have an account? <Link to="/auth/login">Login</Link>
        </p>
      </div>
    </div>
  </div>
);
};

export default SignupForm;
