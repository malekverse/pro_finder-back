import { useState } from 'react';
import styles from '../../styles/Form.module.css';
import { useLoginMutation } from '../../redux/features/auth/authApiSlice';
import Cookies from 'js-cookie';
import { useNavigate, Link } from 'react-router-dom';
import servicesIllustration from '../../assets/illustrations/services.svg';

/* Composant: LoginForm
   - Authentifie l’utilisateur et redirige vers le dashboard
   - Layout split: panneau marque à gauche, formulaire à droite */
const LoginForm = () => {
  const navigate = useNavigate();
  const [userInputs, setUserInputs] = useState({ email: '', password: '' });
  const [login, { isError, isLoading, error }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({
        email: userInputs.email,
        password: userInputs.password,
      }).unwrap();

      if (response.accessToken) {
        Cookies.set('accessToken', response.accessToken);
        navigate('/dashboard');
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className={styles.splitContainer}>
      <div className={styles.leftPanel}>
        <div className={styles.brandContent}>
          {/* Bloc marque et bénéfices */}
          <h2 className={styles.logo}>🔷 Pro Finder</h2>
          <h1 className={styles.mainTitle}>Bienvenue sur Pro Finder</h1>
          <p className={styles.subtitle}>
            La plateforme globale pour trouver, comparer et collaborer avec des professionnels.
          </p>
          <ul style={{ marginTop: '16px', lineHeight: '1.6' }}>
            <li>Recherche par pays, région, ville, métier</li>
            <li>Profils vérifiés et services détaillés</li>
            <li>Paiement sécurisé, devis & contrats</li>
            <li>Outils de gestion intégrés</li>
          </ul>
          
        </div>
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          {/* Formulaire de connexion */}
          <h1 className={styles.loginTitle}>Sign In</h1>
          <p className={styles.loginSubtitle}>Welcome back! Please enter your details</p>
          <form onSubmit={handleSubmit}>
            {/* Champs principaux */}
            <div className={styles.inputGroup}>
              <label>EMAIL</label>
              <input
                type="email"
                required
                value={userInputs.email}
                onChange={(e) => setUserInputs({ ...userInputs, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>PASSWORD</label>
              <input
                type="password"
                required
                value={userInputs.password}
                onChange={(e) => setUserInputs({ ...userInputs, password: e.target.value })}
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" disabled={isLoading} className={styles.loginButton}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          {/* Messages d’erreur et lien d’inscription */}
          {isError && (
            <p className={styles.errorMessage}>
              {error?.data?.message || 'Login failed.'}
            </p>
          )}
          <p className={styles.signupLink}>
            Don't have an account? <Link to="/auth/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
