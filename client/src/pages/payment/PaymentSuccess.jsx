import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useVerifyPaymentQuery } from "../../redux/features/paymentApiSlice";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const payment_id = searchParams.get("payment_id");

  const { data, isLoading, isError, error } = useVerifyPaymentQuery(payment_id, {
    skip: !payment_id,
  });

  useEffect(() => {
    if (isError) {
      console.error("💰 [PaymentSuccess] Verification failed:", error);
    }
    if (data) {
      console.log("💰 [PaymentSuccess] Verification data:", data);
      // Optionnel : on pourrait forcer un rechargement des données utilisateur ici si besoin
    }
  }, [isError, data, error]);

  const handleGoToPurchases = () => {
    navigate("/user/purchases", { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {isLoading ? (
          <div style={styles.content}>
            <Loader2 size={64} color="#24416b" className="animate-spin" />
            <h2 style={styles.title}>Vérification du paiement...</h2>
            <p style={styles.text}>Veuillez patienter pendant que nous confirmons votre transaction.</p>
          </div>
        ) : (
          <div style={styles.content}>
            <CheckCircle2 size={64} color="#10b981" />
            <h2 style={styles.title}>Paiement Réussi !</h2>
            <p style={styles.text}>
              Merci pour votre confiance. Votre paiement a été traité avec succès.
            </p>
            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span>ID Transaction:</span>
                <span style={styles.bold}>{payment_id?.slice(0, 12)}...</span>
              </div>
            </div>
            <button onClick={handleGoToPurchases} style={styles.button}>
              Voir mes achats <ArrowRight size={18} />
            </button>
          </div>
        )}
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
  infoBox: {
    width: "100%",
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "12px",
    marginTop: "10px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#64748b",
  },
  bold: {
    fontWeight: "700",
    color: "#1e293b",
  },
  button: {
    marginTop: "10px",
    padding: "14px 28px",
    borderRadius: "12px",
    border: "none",
    background: "#24416b",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "16px",
    transition: "0.2s",
  },
};

export default PaymentSuccess;
