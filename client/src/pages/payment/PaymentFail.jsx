import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

const PaymentFail = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.content}>
          <XCircle size={64} color="#ef4444" />
          <h2 style={styles.title}>Échec du paiement</h2>
          <p style={styles.text}>
            Désolé, une erreur est survenue lors du traitement de votre paiement. 
            Aucun montant n'a été débité de votre compte.
          </p>
          
          <div style={styles.actions}>
            <button onClick={() => navigate("/user/purchases")} style={styles.buttonSecondary}>
              <ArrowLeft size={18} /> Retour aux achats
            </button>
            <button onClick={() => window.history.back()} style={styles.buttonPrimary}>
              <RefreshCw size={18} /> Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f4f8",
    padding: "20px",
  },
  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#1e293b",
    margin: "0",
  },
  text: {
    color: "#64748b",
    fontSize: "16px",
    lineHeight: "1.5",
    margin: "0",
  },
  actions: {
    display: "flex",
    gap: "12px",
    width: "100%",
    marginTop: "10px",
  },
  buttonPrimary: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "#24416b",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
  },
  buttonSecondary: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
  },
};

export default PaymentFail;
