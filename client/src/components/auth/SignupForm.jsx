import { useRegisterMutation } from '../../redux/features/auth/authApiSlice';
import styles from '../../styles/Form.module.css';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const SignupForm = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('user');
  const [step, setStep] = useState(1);

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
  });

  const [register, { isError, error }] = useRegisterMutation();

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
          website: companyInputs.website,
          logoUrl: companyInputs.logo_url ? await fileToBase64(companyInputs.logo_url) : null,
          coverUrl: companyInputs.cover_url ? await fileToBase64(companyInputs.cover_url) : null,
          description: companyInputs.description,
          roles: ["company"],
        };
      }

      const response = await register(payload).unwrap();

      if (response?.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
        if (role === 'user') navigate("/profile");
        else navigate("/dashboard");
      }
    } catch (err) {
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
          {/* Role Selector */}
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

          {/* User Form */}
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

          {/* Company Form */}
          {role === 'company' && (
            <>
              {/* Step Indicator */}
              <div className={`${styles.stepIndicator} ${step === 2 ? styles.step2 : ''}`}>
                <div className={`${styles.step} ${step === 1 ? styles.activeStep : ''}`} onClick={() => setStep(1)}>1</div>
                <div className={`${styles.step} ${step === 2 ? styles.activeStep : ''}`} onClick={() => setStep(2)}>2</div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Step 1 */}
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
                  </div>
                )}
                {step === 1 && (
                  <button type="button" className={styles.submitButton} onClick={() => setStep(2)}>Next</button>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className={styles.stepContent}>
                    <div className={styles.mediaGrid}>
                      <div className={styles.fileCard}>
                        <label>LOGO</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCompanyInputs({ ...companyInputs, logo_url: e.target.files[0] })}
                        />
                      </div>
                      <div className={styles.fileCard}>
                        <label>COVER</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCompanyInputs({ ...companyInputs, cover_url: e.target.files[0] })}
                        />
                      </div>
                    </div>
                    <div className={styles.locationGridStyled}>
                      <div className={styles.inputGroup}>
                        <label>COUNTRY</label>
                        <input type="text" placeholder="Country" value={companyInputs.country_id} onChange={(e) => setCompanyInputs({ ...companyInputs, country_id: e.target.value })} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>REGION</label>
                        <input type="text" placeholder="Region" value={companyInputs.region_id} onChange={(e) => setCompanyInputs({ ...companyInputs, region_id: e.target.value })} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>CITY</label>
                        <input type="text" placeholder="City" value={companyInputs.city_id} onChange={(e) => setCompanyInputs({ ...companyInputs, city_id: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className={styles.buttonRow}>
                    <button type="button" className={styles.backButton} onClick={() => setStep(1)}>← Back</button>
                    <button type="submit" className={styles.submitButton}>Create Company</button>
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