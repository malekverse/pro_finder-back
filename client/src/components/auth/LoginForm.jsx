import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../../redux/features/auth/authApiSlice'; 
// ✅ Vérifie bien que ce chemin mène au fichier apiSlice.js depuis LoginForm.jsx
import { apiSlice } from "../../redux/app/api/apiSlice";
import styles from '../../styles/Form.module.css';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/features/auth/authSlice';
import Cookies from 'js-cookie';
import { Eye, EyeOff } from 'lucide-react';

const LoginForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [login, { isLoading, isError, error }] = useLoginMutation();
    const errorMsg = isError ? (error?.data?.message || 'Identifiants invalides') : null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await login({ email, password }).unwrap();

            const token = response.accessToken;
            localStorage.setItem("accessToken", token);
            Cookies.set('accessToken', token, { expires: 7 });

            // 🔥 C'est ici que la magie opère :
            // apiSlice est l'objet parent qui contient la gestion du cache
            dispatch(apiSlice.util.resetApiState());

           dispatch(
  setCredentials({
    accessToken: token,
    account: response.account,
  })
);

            const roles = response.account?.roles || [];

            if (roles.includes("admin")) {
                navigate("/admin/dashboard");
            } else if (roles.includes("company")) {
                navigate("/company/stats");
            } else if (roles.includes("professional")) {
                navigate("/professional/stats");
            } else {
                // Les users et les owners vont sur leur profil par défaut
                navigate("/user/dashboard");
            }
            
        } catch (err) {
            console.error("Erreur de connexion :", err);
        }
    };

    return (
    <div className={styles.splitContainer}>
      <div className={styles.rightPanel}>
        <div className={styles.loginCard}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#1E3A5F', fontSize: '32px', fontWeight: '800', marginBottom: '10px' }}>ProFinder</h1>
            <h2 className={styles.loginTitle}>Bon retour !</h2>
            <p className={styles.loginSubtitle}>Connectez-vous pour accéder à votre espace</p>
          </div>

          <form onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label>Adresse Email</label>
                            <input
                                type="email"
                                placeholder="nom@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Mot de passe</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.eyeButton}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isLoading}
                        >
                            {isLoading ? "Connexion..." : "Se connecter"}
                        </button>

                        {errorMsg && <p className={styles.errorText} style={{ color: '#e74c3c', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>{errorMsg}</p>}

                        <p className={styles.footerText} style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
                            Pas encore de compte ?{' '}
                            <Link to="/auth/signup" className={styles.footerLink} style={{ color: '#1E3A5F', fontWeight: 'bold' }}>
                                S'inscrire gratuitement
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;