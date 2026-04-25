import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  CreditCard, ShieldCheck, Lock, ChevronRight, 
  AlertCircle, CheckCircle2, Loader2, ArrowLeft,
  Smartphone, Wallet
} from "lucide-react";

const PaymentCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const payment_id = searchParams.get("payment_id");
  const amount = searchParams.get("amount");
  const success_url = searchParams.get("success_url");

  const [step, setStep] = useState(1); // 1: Card Input, 2: OTP/Processing, 3: Success
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "4000 1234 5678 9010",
    expiry: "12/28",
    cvv: "123",
    name: "MALEK VERSE"
  });

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(2);
      setTimeout(() => {
        setStep(3);
        setTimeout(() => {
          // Rediriger vers l'URL de succès fournie par Flouci
          window.location.href = `${success_url}?payment_id=${payment_id}`;
        }, 2000);
      }, 3000);
    }, 1500);
  };

  return (
    <div style={styles.container}>
      {/* Background Decor */}
      <div style={styles.bgDecor1} />
      <div style={styles.bgDecor2} />

      <div style={styles.checkoutCard}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.brand}>
             <div style={styles.logoCircle}>
                <Wallet size={20} color="#fff" />
             </div>
             <span style={styles.brandName}>PRO FINDER <span style={styles.payText}>PAY</span></span>
          </div>
          <div style={styles.amountBadge}>
             {amount} TND
          </div>
        </div>

        {step === 1 && (
          <div style={styles.content}>
            <div style={styles.secureHeader}>
               <ShieldCheck size={16} color="#10b981" />
               <span>Environnement de test sécurisé</span>
            </div>

            <h2 style={styles.title}>Mode de paiement</h2>
            
            <div style={styles.methods}>
               <div style={{...styles.method, ...styles.methodActive}}>
                  <CreditCard size={20} />
                  <span>Carte Bancaire</span>
               </div>
               <div style={styles.method}>
                  <Smartphone size={20} />
                  <span>Flouci Wallet</span>
               </div>
            </div>

            <div style={styles.form}>
               <div style={styles.formGroup}>
                  <label style={styles.label}>Numéro de carte</label>
                  <input 
                    style={styles.input} 
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                  />
               </div>
               <div style={styles.row}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Expiration</label>
                    <input 
                        style={styles.input} 
                        value={formData.expiry}
                        onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>CVV</label>
                    <input 
                        style={styles.input} 
                        type="password"
                        autoComplete="off"
                        value={formData.cvv}
                        onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                    />
                  </div>
               </div>
               <div style={styles.formGroup}>
                  <label style={styles.label}>Titulaire de la carte</label>
                  <input 
                    style={styles.input} 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
               </div>
            </div>

            <button 
              onClick={handlePay} 
              disabled={isProcessing}
              style={styles.payBtn}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Confirmer le paiement <ChevronRight size={18} /></>
              )}
            </button>

            <div style={styles.footer}>
               <Lock size={12} />
               <span>Vos données sont chiffrées en AES-256</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={styles.processingContent}>
             <div style={styles.loaderCircle}>
                <Loader2 size={48} color="#24416b" className="animate-spin" />
             </div>
             <h2 style={styles.title}>Traitement en cours</h2>
             <p style={styles.subText}>Nous vérifions vos informations auprès de votre banque...</p>
             <div style={styles.progressTrack}>
                <div style={styles.progressBar} />
             </div>
          </div>
        )}

        {step === 3 && (
          <div style={styles.successContent}>
             <div style={styles.successIcon}>
                <CheckCircle2 size={64} color="#10b981" />
             </div>
             <h2 style={styles.title}>Paiement autorisé</h2>
             <p style={styles.subText}>Redirection vers le site marchand...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    overflow: "hidden"
  },
  bgDecor1: {
    position: "absolute",
    top: "-100px",
    right: "-100px",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "rgba(36, 65, 107, 0.05)",
    zIndex: 0
  },
  bgDecor2: {
    position: "absolute",
    bottom: "-50px",
    left: "-50px",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "rgba(36, 65, 107, 0.03)",
    zIndex: 0
  },
  checkoutCard: {
    width: "100%",
    maxWidth: "450px",
    background: "#fff",
    borderRadius: "28px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
    padding: "32px",
    zIndex: 1,
    border: "1px solid #f1f5f9"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  logoCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#24416b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  brandName: {
    fontSize: "16px",
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: "-0.5px"
  },
  payText: {
    color: "#24416b"
  },
  amountBadge: {
    background: "#f1f5f9",
    padding: "8px 16px",
    borderRadius: "12px",
    fontWeight: "800",
    color: "#1e293b",
    fontSize: "15px"
  },
  secureHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "600",
    marginBottom: "24px",
    background: "#f0fdf4",
    padding: "6px 12px",
    borderRadius: "8px",
    width: "fit-content"
  },
  title: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: "20px"
  },
  methods: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "24px"
  },
  method: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    cursor: "pointer"
  },
  methodActive: {
    borderColor: "#24416b",
    background: "#f8fafc",
    color: "#24416b"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1
  },
  row: {
    display: "flex",
    gap: "16px"
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase"
  },
  input: {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "15px",
    outline: "none",
    background: "#fff",
    transition: "0.2s"
  },
  payBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    background: "#24416b",
    color: "#fff",
    border: "none",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "0.2s"
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "20px"
  },
  processingContent: {
    padding: "40px 0",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px"
  },
  loaderCircle: {
    width: "80px",
    height: "80px",
    background: "#f8fafc",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  subText: {
    color: "#64748b",
    fontSize: "14px",
    margin: 0
  },
  progressTrack: {
    width: "100%",
    height: "6px",
    background: "#f1f5f9",
    borderRadius: "10px",
    overflow: "hidden",
    marginTop: "10px"
  },
  progressBar: {
    height: "100%",
    width: "60%",
    background: "#24416b",
    borderRadius: "10px",
    animation: "progressAnim 2s infinite ease-in-out"
  },
  successContent: {
    padding: "40px 0",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px"
  },
  successIcon: {
    animation: "scaleUp 0.5s ease-out"
  }
};

export default PaymentCheckout;
