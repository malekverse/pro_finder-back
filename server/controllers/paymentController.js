const Payment = require("../models/Payment");
const Reservation = require("../models/Reservation");
const Quote = require("../models/Quote");
const Order = require("../models/Order");
const Contract = require("../models/Contract");
const Notification = require("../models/Notification");
const Company = require("../models/company");
const Professional = require("../models/Professional");
const flouci = require("../utils/flouci");
const { v4: uuidv4 } = require("uuid");
const invoiceController = require("./invoiceController");

// Initialize a Flouci payment
exports.initializePayment = async (req, res) => {
  try {
    const { reservationId: bodyReservationId, quoteId, orderId, contractId, successUrl, failUrl } = req.body;
    const userId = req.user;

    let finalAmount = 0;
    let targetEntity = null;
    let resolvedReservationId = bodyReservationId;

    // Recalculer le montant depuis la DB (Zéro confiance au montant frontend)
    if (bodyReservationId) {
      targetEntity = await Reservation.findById(bodyReservationId).populate("serviceId");
      if (!targetEntity) return res.status(404).json({ message: "Réservation non trouvée" });
      if (!targetEntity.serviceId) return res.status(400).json({ message: "Service associé à la réservation introuvable" });
      finalAmount = targetEntity.serviceId.price;
      resolvedReservationId = bodyReservationId;
    } else if (quoteId) {
      targetEntity = await Quote.findById(quoteId);
      if (!targetEntity) return res.status(404).json({ message: "Devis non trouvé" });
      finalAmount = targetEntity.totalAmount;
      if (targetEntity.reservationId) resolvedReservationId = targetEntity.reservationId;
    } else if (contractId) {
      targetEntity = await Contract.findById(contractId).populate("quoteId");
      if (!targetEntity) return res.status(404).json({ message: "Contrat non trouvé" });
      finalAmount = targetEntity.totalValue;
      if (targetEntity.quoteId?.reservationId) resolvedReservationId = targetEntity.quoteId.reservationId;
    } else if (orderId) {
      targetEntity = await Order.findById(orderId).populate("items.productId");
      if (!targetEntity) return res.status(404).json({ message: "Commande non trouvée" });

      // Recalculer le prix total à partir des produits en DB
      let recalculatedTotal = 0;
      for (const item of targetEntity.items) {
        if (item.productId) {
          recalculatedTotal += item.productId.price * item.quantity;
        } else {
          // Si le produit n'est plus en DB, on garde le prix historique stocké dans l'item
          recalculatedTotal += item.price * item.quantity;
        }
      }
      finalAmount = recalculatedTotal;
    } else if (contractId) {
      targetEntity = await Contract.findById(contractId);
      if (!targetEntity) return res.status(404).json({ message: "Contrat non trouvé" });
      finalAmount = targetEntity.totalValue;
    } else {
      return res.status(400).json({ message: "Aucune entité de paiement spécifiée" });
    }

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ message: "Montant invalide ou nul après calcul" });
    }

    const developerTrackingId = uuidv4();

    // Call Flouci to generate payment with RECALCULATED amount
    const flouciResponse = await flouci.initPayment(
      finalAmount,
      successUrl || `${process.env.CLIENT_URL}/payment/success`,
      failUrl || `${process.env.CLIENT_URL}/payment/fail`,
      developerTrackingId
    );

    // Create a pending payment record in our DB
    const newPayment = new Payment({
      paymentId: uuidv4(),
      userId,
      reservationId: resolvedReservationId,
      quoteId,
      orderId,
      contractId,
      amount: finalAmount,
      flouciPaymentId: flouciResponse.result.payment_id,
      developerTrackingId,
      status: "pending",
      companyId: targetEntity.companyId,
      professionalId: targetEntity.professionalId
    });

    await newPayment.save();

    res.status(200).json({
      payment_id: flouciResponse.result.payment_id,
      result_url: flouciResponse.result.link,
    });
  } catch (error) {
    console.error("Initialize Payment Error:", error);
    res.status(500).json({ message: "Failed to initialize payment", error: error.message });
  }
};

// Verify a Flouci payment
exports.verifyPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;

    if (!payment_id) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const verificationData = await flouci.verifyPayment(payment_id);

    // Find our payment record
    const payment = await Payment.findOne({ flouciPaymentId: payment_id });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (verificationData.result.status === "SUCCESS") {
      // Double vérification du montant (optionnel mais recommandé)
      // On peut comparer verificationData.result.amount avec payment.amount * 1000

      payment.status = "success";
      await payment.save();

      // Generate Invoice automatically
      try {
        await invoiceController.createInvoiceFromPayment(payment);
      } catch (invErr) {
        console.error("❌ [verifyPayment] Invoice generation failed:", invErr);
      }

      // Update related entity status if needed
      if (payment.reservationId) {
        await Reservation.findByIdAndUpdate(payment.reservationId, { status: "paid" });
        console.log(`✅ [verifyPayment] Reservation ${payment.reservationId} status updated to paid`);
      }

      if (payment.quoteId) {
        const quote = await Quote.findById(payment.quoteId);
        if (quote) {
          quote.status = "accepted";
          await quote.save();
          console.log(`✅ [verifyPayment] Quote ${payment.quoteId} status updated to accepted`);

          // Sync with Reservation (Calendar)
          if (quote.reservationId) {
            await Reservation.findByIdAndUpdate(quote.reservationId, { status: "paid" });
            console.log(`✅ [verifyPayment] Linked reservation ${quote.reservationId} updated to paid`);
          }

          // GENERATE AUTOMATIC CONTRACT IF REQUIRED (similar to quoteController.js)
          if (quote.requiresContract) {
            try {
              const existingContract = await Contract.findOne({ quoteId: quote._id });
              if (!existingContract) {
                const totalCount = await Contract.countDocuments({});
                const contractNumber = `CTR-${new Date().getFullYear()}-${(totalCount + 1).toString().padStart(4, '0')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

                const itemsList = quote.items.map(item => `- ${item.description} (x${item.quantity}) : ${item.total} TND`).join('\n');

                const newContract = new Contract({
                  contractNumber,
                  companyId: quote.companyId,
                  professionalId: quote.professionalId,
                  userId: quote.userId,
                  quoteId: quote._id,
                  title: `Contrat de prestation - ${quote.quoteNumber}`,
                  content: `Ce contrat formalise l'accord pour les services suivants :\n\n${itemsList}\n\nTotal TTC : ${quote.totalAmount} TND`,
                  startDate: new Date(),
                  totalValue: quote.totalAmount,
                  status: "pending_signature",
                  terms: quote.notes || "Conditions standards de prestation de service."
                });

                await newContract.save();

                // Notify client about the new contract
                await Notification.create({
                  recipient_id: quote.userId,
                  recipient_type: "User",
                  sender_id: quote.companyId || quote.professionalId,
                  sender_type: quote.companyId ? "Company" : "Professional",
                  type: "contract",
                  related_id: newContract._id,
                  message: `Votre contrat pour le devis ${quote.quoteNumber} a été généré automatiquement après votre paiement. Veuillez le signer.`
                });
                console.log(`✅ [verifyPayment] Automatic contract generated: ${contractNumber}`);
              }
            } catch (contractErr) {
              console.error("❌ [verifyPayment] Failed to generate contract:", contractErr);
            }
          }
        }
      }
      if (payment.orderId) {
        await Order.findByIdAndUpdate(payment.orderId, { status: "paid" });
      }
      if (payment.contractId) {
        await Contract.findByIdAndUpdate(payment.contractId, { status: "active" });
      }

      res.status(200).json({ status: "success", message: "Paiement vérifié avec succès" });
    } else {
      payment.status = "failed";
      await payment.save();
      return res.status(200).json({ message: "Payment failed", status: verificationData.result.status });
    }
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ message: "Failed to verify payment", error: error.message });
  }
};

// Get payments for a user (client)
exports.getMyPayments = async (req, res) => {
  try {
    const userId = req.user;
    const payments = await Payment.find({ userId })
      .populate("companyId", "companyName")
      .populate("professionalId", "fullName")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payments" });
  }
};

// Get payments for a company or professional
exports.getProviderPayments = async (req, res) => {
  try {
    const id = req.companyId || req.user;
    const isProfessional = req.roles?.includes("professional");
    const query = isProfessional ? { professionalId: id } : { companyId: id };

    const payments = await Payment.find(query)
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching provider payments" });
  }
};
