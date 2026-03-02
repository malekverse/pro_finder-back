import React, { useState } from 'react';

const SignUp = () => {
  const [userType, setUserType] = useState('client'); // 'client' ou 'fournisseur'
  
  // États pour client
  const [clientData, setClientData] = useState({
    nom: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // États pour fournisseur
  const [fournisseurData, setFournisseurData] = useState({
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
    tel: '',
    pays: '',
    categorie: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userType === 'client') {
      console.log('Inscription Client:', clientData);
    } else {
      console.log('Inscription Fournisseur:', fournisseurData);
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      
      {/* Sélection du type de compte */}
      <div>
        <label>
          <input 
            type="radio" 
            value="client" 
            checked={userType === 'client'} 
            onChange={() => setUserType('client')} 
          />
          Client
        </label>
        <label>
          <input 
            type="radio" 
            value="fournisseur" 
            checked={userType === 'fournisseur'} 
            onChange={() => setUserType('fournisseur')} 
          />
          Fournisseur
        </label>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Formulaire Client */}
        {userType === 'client' && (
          <div>
            <h3>Inscription Client</h3>
            <div>
              <label>Nom complet:</label>
              <input
                type="text"
                value={clientData.nom}
                onChange={(e) => setClientData({...clientData, nom: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={clientData.email}
                onChange={(e) => setClientData({...clientData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Mot de passe:</label>
              <input
                type="password"
                value={clientData.password}
                onChange={(e) => setClientData({...clientData, password: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Confirmer mot de passe:</label>
              <input
                type="password"
                value={clientData.confirmPassword}
                onChange={(e) => setClientData({...clientData, confirmPassword: e.target.value})}
                required
              />
            </div>
          </div>
        )}

        {/* Formulaire Fournisseur */}
        {userType === 'fournisseur' && (
          <div>
            <h3>Inscription Fournisseur</h3>
            <div>
              <label>Nom complet / Entreprise:</label>
              <input
                type="text"
                value={fournisseurData.nom}
                onChange={(e) => setFournisseurData({...fournisseurData, nom: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={fournisseurData.email}
                onChange={(e) => setFournisseurData({...fournisseurData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Téléphone:</label>
              <input
                type="tel"
                value={fournisseurData.tel}
                onChange={(e) => setFournisseurData({...fournisseurData, tel: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Pays:</label>
              <input
                type="text"
                value={fournisseurData.pays}
                onChange={(e) => setFournisseurData({...fournisseurData, pays: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Catégorie:</label>
              <select 
                value={fournisseurData.categorie}
                onChange={(e) => setFournisseurData({...fournisseurData, categorie: e.target.value})}
                required
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="sante">Santé & Bien-être</option>
                <option value="maison">Maison & Dépannage</option>
                <option value="auto">Automobile & Transport</option>
                <option value="business">Business & Juridique</option>
                <option value="tech">Technologie & Digital</option>
                <option value="education">Éducation & Formation</option>
                <option value="creatif">Créatif & Médias</option>
                <option value="beaute">Services personnels</option>
              </select>
            </div>
            <div>
              <label>Mot de passe:</label>
              <input
                type="password"
                value={fournisseurData.password}
                onChange={(e) => setFournisseurData({...fournisseurData, password: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Confirmer mot de passe:</label>
              <input
                type="password"
                value={fournisseurData.confirmPassword}
                onChange={(e) => setFournisseurData({...fournisseurData, confirmPassword: e.target.value})}
                required
              />
            </div>
          </div>
        )}

        <button type="submit">S'inscrire</button>
      </form>
      
      <p>Déjà un compte? <a href="/login">Login</a></p>
    </div>
  );
};

export default SignUp;