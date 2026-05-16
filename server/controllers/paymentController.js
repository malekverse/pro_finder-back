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
const initializePayment = async (req, res) => {
  try {
    console.log("📥 [initializePayment] Raw Body:", req.body);
    
    // Support both { items: [...] } and { items: { items: [...] } } just in case
    let bodyItems = req.body.items;
    
    // Si items est un objet contenant une propriété items (erreur de double imbrication côté front possible)
    if (bodyItems && !Array.isArray(bodyItems) && bodyItems.items) {
      bodyItems = bodyItems.items;
    }

    const successUrl = req.body.successUrl;
    const failUrl = req.body.failUrl;

    if (!bodyItems && (req.body.reservationId || req.body.orderId || req.body.quoteId || req.body.contractId)) {
      // Fallback for old single item format if needed (legacy support)
      bodyItems = [];
      if (req.body.reservationId) bodyItems.push({ entityId: req.body.reservationId, entityType: "Reservation" });
      if (req.body.orderId) bodyItems.push({ entityId: req.body.orderId, entityType: "Order" });
      if (req.body.quoteId) bodyItems.push({ entityId: req.body.quoteId, entityType: "Quote" });
      if (req.body.contractId) bodyItems.push({ entityId: req.body.contractId, entityType: "Contract" });
    }

    if (!bodyItems || !Array.isArray(bodyItems) || bodyItems.length === 0) {
       console.error("❌ [initializePayment] No items found in body:", req.body);
       
       // Si on est vraiment bloqué, on essaie de voir si l'objet lui-même est l'item (cas extrême)
       if (req.body.entityId && req.body.entityType) {
         bodyItems = [req.body];
       } else {
         return res.status(400).json({ 
           message: "Aucun article de paiement spécifié",
           receivedBody: req.body 
         });
       }
     }

     const userId = req.user;
     let totalAmount = 0;
    const resolvedItems = [];
    let companyId = null;
    let professionalId = null;

    for (const item of bodyItems) {
      let finalAmount = 0;
      let targetEntity = null;
      const { entityId, entityType } = item;

      if (entityType === "Reservation") {
        targetEntity = await Reservation.findById(entityId).populate("serviceId");
        if (!targetEntity) throw new Error(`Réservation ${entityId} non trouvée`);
        finalAmount = targetEntity.serviceId.price;
      } else if (entityType === "Quote") {
        targetEntity = await Quote.findById(entityId);
        if (!targetEntity) throw new Error(`Devis ${entityId} non trouvé`);
        finalAmount = targetEntity.totalAmount;
      } else if (entityType === "Contract") {
        targetEntity = await Contract.findById(entityId);
        if (!targetEntity) throw new Error(`Contrat ${entityId} non trouvé`);
        finalAmount = targetEntity.totalValue;
      } else if (entityType === "Order") {
        targetEntity = await Order.findById(entityId).populate("items.productId");
        if (!targetEntity) throw new Error(`Commande ${entityId} non trouvée`);
        
        let recalculatedTotal = 0;
        for (const orderItem of targetEntity.items) {
          recalculatedTotal += (orderItem.productId?.price || orderItem.price) * orderItem.quantity;
        }
        finalAmount = recalculatedTotal;
      } else {
        throw new Error(`Type d'entité ${entityType} non supporté`);
      }

      if (!finalAmount || finalAmount <= 0) {
        throw new Error(`Montant invalide pour ${entityType} ${entityId}`);
      }

      totalAmount += finalAmount;
      resolvedItems.push({
        entityType,
        entityId,
        amount: finalAmount
      });

      // On récupère le provider du premier article (on assume qu'ils appartiennent tous au même)
      if (!companyId && !professionalId) {
        companyId = targetEntity.companyId;
        professionalId = targetEntity.professionalId;
      }
    }

    console.log(`💳 [initializePayment] Total Amount: ${totalAmount}, Items Count: ${resolvedItems.length}`);

    const developerTrackingId = uuidv4();

    // Call Flouci to generate payment with RECALCULATED total amount
    const flouciResponse = await flouci.initPayment(
      totalAmount,
      successUrl || `${process.env.CLIENT_URL}/payment/success`,
      failUrl || `${process.env.CLIENT_URL}/payment/fail`,
      developerTrackingId
    );

    if (!flouciResponse || !flouciResponse.result || !flouciResponse.result.payment_id) {
      console.error("❌ [initializePayment] Invalid Flouci response:", flouciResponse);
      throw new Error("Invalid response from Flouci");
    }

    // Create a pending payment record in our DB
    const newPayment = new Payment({
      paymentId: uuidv4(),
      userId,
      items: resolvedItems,
      amount: totalAmount,
      flouciPaymentId: flouciResponse.result.payment_id,
      developerTrackingId,
      status: "pending",
      companyId: companyId || null,
      professionalId: professionalId || null
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
const verifyPayment = async (req, res) => {
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

      payment.status = "success";
      await payment.save();

      // Mettre à jour la balance du fournisseur
      const ProviderBalance = require("../models/ProviderBalance");
      const balanceQuery = payment.companyId 
        ? { companyId: payment.companyId } 
        : { professionalId: payment.professionalId };

      let balance = await ProviderBalance.findOne(balanceQuery);
      if (!balance) {
        balance = new ProviderBalance(balanceQuery);
      }
      
      balance.pendingBalance += payment.amount;
      balance.totalEarned += payment.amount;
      // Pour cet exemple simple, on considère que l'argent est immédiatement disponible
      // (Normalement on attendrait quelques jours avant de passer de pending à available)
      balance.availableBalance += payment.amount; 
      
      await balance.save();
      console.log(`💳 [verifyPayment] Provider balance updated (+${payment.amount})`);


      // Update related entities status FIRST
      for (const item of payment.items) {
        if (item.entityType === "Reservation") {
          await Reservation.findByIdAndUpdate(item.entityId, { status: "paid" });
        } else if (item.entityType === "Quote") {
          const quote = await Quote.findById(item.entityId);
          if (quote) {
            quote.status = "accepted";
            quote.isPaid = true;
            await quote.save();
            if (quote.reservationId) {
              await Reservation.findByIdAndUpdate(quote.reservationId, { status: "paid" });
            }
          }
        } else if (item.entityType === "Order") {
          await Order.findByIdAndUpdate(item.entityId, { status: "paid" });
        } else if (item.entityType === "Contract") {
          const contract = await Contract.findByIdAndUpdate(item.entityId, { status: "active", isPaid: true });
          if (contract && contract.quoteId) {
            // Update the related quote and reservation as paid
            const quote = await Quote.findByIdAndUpdate(contract.quoteId, { status: "accepted", isPaid: true });
            if (quote && quote.reservationId) {
              await Reservation.findByIdAndUpdate(quote.reservationId, { status: "paid" });
            }
          }
        }
      }

      // Generate Invoice automatically AFTER status updates
      try {
        const invoice = await invoiceController.createInvoiceFromPayment(payment);
      } catch (invErr) {
        console.error("Invoice generation failed:", invErr);
      }

      res.status(200).json({ status: "success", message: "Payment verified successfully" });
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
const getMyPayments = async (req, res) => {
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
const getProviderPayments = async (req, res) => {
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
module.exports = {
  initializePayment,
  verifyPayment,
  getMyPayments,
  getProviderPayments
};
