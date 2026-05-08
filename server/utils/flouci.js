const axios = require("axios");
const FLOUCI_API_BASE = "https://developers.flouci.com/api";

const initPayment = async (amount, successUrl, failUrl, developerTrackingId) => {
  // Mode Test - Plus robuste (ignore les espaces, les guillemets et la casse)
  const paymentMode = (process.env.PAYMENT_MODE || '').trim().replace(/['"]/g, '').toLowerCase();
  
  if (paymentMode === 'test') {
    console.log("💳 [FLOUCI] Mode Test activé - Redirection Directe vers Success");
    const mockPaymentId = `TEST_PAY_${Math.random().toString(36).substring(7).toUpperCase()}`;
    // On redirige directement vers l'URL de succès pour bypasser l'étape de simulation
    return {
      result: {
        payment_id: mockPaymentId,
        link: `${successUrl}?payment_id=${mockPaymentId}`,
      }
    };
  }

  const url = `${FLOUCI_API_BASE}/generate_payment`;
  
  const payload = {
    app_token: process.env.FLOUCI_APP_TOKEN,
    app_public: process.env.FLOUCI_APP_PUBLIC,
    accept_card: "true",
    amount: amount * 1000,
    success_url: successUrl,
    fail_url: failUrl,
    developer_tracking_id: developerTrackingId,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data; // Should contain payment_id and result_url
  } catch (error) {
    console.error("Flouci Init Payment Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to initialize Flouci payment");
  }
};

const verifyPayment = async (paymentId) => {
  // Mode Test - Plus robuste
  const paymentMode = (process.env.PAYMENT_MODE || '').trim().replace(/['"]/g, '').toLowerCase();

  if (paymentMode === 'test' || (paymentId && paymentId.startsWith('TEST_PAY_'))) {
    console.log(`🔍 [FLOUCI] Mode Test activé - Simulation de vérification pour ${paymentId}`);
    return {
      result: {
        status: "SUCCESS",
        amount: 0,
        developer_tracking_id: "test-tracking-id",
      }
    };
  }

  const url = `${FLOUCI_API_BASE}/verify_payment/${paymentId}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "apppublic": process.env.FLOUCI_APP_PUBLIC,
        "apptoken": process.env.FLOUCI_APP_TOKEN,
      },
    });

    return response.data; // Should contain result.status ("SUCCESS", "FAILURE", etc.)
  } catch (error) {
    console.error("Flouci Verify Payment Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to verify Flouci payment");
  }
};

module.exports = {
  initPayment,
  verifyPayment,
};
