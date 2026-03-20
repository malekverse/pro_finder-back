import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../../redux/features/auth/authApiSlice'; 
// ✅ Vérifie bien que ce chemin mène au fichier apiSlice.js depuis LoginForm.jsx
import { apiSlice } from "../../redux/app/api/apiSlice";
import styles from '../../styles/Form.module.css';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/features/auth/authSlice';
import Cookies from 'js-cookie';

const LoginForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [login, { isLoading, isError, error }] = useLoginMutation();

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
} 
else if (roles.includes("company")) {
  navigate("/company/stats");
} 
else {
  navigate("/profile");
}
            
        } catch (err) {
            console.error("Erreur de connexion :", err);
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
                <div className={styles.loginCard}>
                    <h2 className={styles.loginTitle}>Login</h2>
                    <p className={styles.loginSubtitle}>Entrez vos identifiants ci-dessous</p>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label>EMAIL</label>
                            <input
                                type="email"
                                placeholder="votre@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>PASSWORD</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className={styles.submitButton}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>

                    {isError && (
                        <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
                            {error?.data?.message || 'Identifiants invalides'}
                        </p>
                    )}

                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
                        Pas encore de compte ? <Link to="/auth/signup" style={{ color: '#1E3A5F', fontWeight: 'bold' }}>S'inscrire</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;