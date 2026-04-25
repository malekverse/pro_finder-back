const Reservation = require("../models/Reservation");
const CompanyService = require("../models/CompanyService");
const Notification = require("../models/Notification");
const Company = require("../models/company");
const Professional = require("../models/Professional");
const User = require("../models/User");

// Client: Create a reservation
exports.createReservation = async (req, res) => {
  try {
    const { serviceId, companyId, date, timeSlot, notes } = req.body;
    const userId = req.user;

    console.log("🚀 [createReservation] Data received:", { serviceId, companyId, date, timeSlot, userId });

    if (!userId) {
      return res.status(401).json({ message: "Vous devez être connecté pour réserver" });
    }

    if (!serviceId || !date || !timeSlot) {
      return res.status(400).json({ message: "serviceId, date et timeSlot sont requis" });
    }

    // Uniformiser la date en UTC (midi pour éviter les décalages de fuseau horaire)
    let year, month, day;
    if (date.includes('T')) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        console.error("❌ [createReservation] Date ISO invalide reçue:", date);
        return res.status(400).json({ message: "Format de date ISO invalide" });
      }
      year = d.getUTCFullYear();
      month = d.getUTCMonth();
      day = d.getUTCDate();
    } else {
      const parts = date.split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) {
        console.error("❌ [createReservation] Format YYYY-MM-DD invalide:", date);
        return res.status(400).json({ message: "Format de date YYYY-MM-DD invalide" });
      }
      year = parts[0];
      month = parts[1] - 1;
      day = parts[2];
    }

    const normalizedDate = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));

    if (isNaN(normalizedDate.getTime())) {
      console.error("❌ [createReservation] normalizedDate est Invalid Date pour:", { year, month, day });
      return res.status(400).json({ message: "Calcul de date impossible" });
    }

    let actualCompanyId = companyId;
    let actualProfessionalId = req.body.professionalId;
    
    // Si professionalId n'est pas fourni, on récupère les infos du service
    if (!actualCompanyId && !actualProfessionalId) {
      const service = await CompanyService.findById(serviceId);
      if (!service) {
        console.error("❌ [createReservation] Service non trouvé:", serviceId);
        return res.status(404).json({ message: "Service non trouvé" });
      }
      actualCompanyId = service.companyId;
      actualProfessionalId = service.professionalId;
    }

    let isToProfessional = !!actualProfessionalId;

    // Sécurité: si professionalId est manquant mais que companyId est présent, 
    // on vérifie si l'ID appartient à un professionnel
    if (!isToProfessional && actualCompanyId) {
      const isProAccount = await Professional.exists({ _id: actualCompanyId });
      if (isProAccount) {
        actualProfessionalId = actualCompanyId;
        actualCompanyId = null;
        isToProfessional = true;
      }
    }

    const providerId = actualCompanyId || actualProfessionalId;
    
    if (!providerId) {
      console.error("❌ [createReservation] Aucun prestataire trouvé pour ce service");
      return res.status(400).json({ message: "Impossible d'identifier le prestataire du service" });
    }

    // VERIFICATION DE DISPONIBILITE (Anti-double réservation)
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    const providerQuery = [];
    if (actualCompanyId) providerQuery.push({ companyId: actualCompanyId });
    if (actualProfessionalId) providerQuery.push({ professionalId: actualProfessionalId });

    if (providerQuery.length > 0) {
      const existingReservation = await Reservation.findOne({
        $or: providerQuery,
        date: { $gte: startOfDay, $lte: endOfDay },
        timeSlot: timeSlot,
        status: { $in: ["confirmed", "paid", "completed", "blocked"] }
      });

      if (existingReservation) {
        return res.status(400).json({ message: "Ce créneau est déjà réservé ou indisponible" });
      }
    }

    const newReservation = new Reservation({
      userId,
      companyId: actualCompanyId,
      professionalId: actualProfessionalId,
      serviceId,
      date: normalizedDate,
      timeSlot,
      notes,
    });

    await newReservation.save();
    console.log("✅ [createReservation] Reservation saved:", newReservation._id);

    // Notify Company (seulement si ce n'est pas le manager qui réserve chez lui-même)
    const isSelfBooking = req.roles?.includes("professional") 
      ? (req.user?.toString() === providerId?.toString()) 
      : (req.companyId?.toString() === providerId?.toString());

    if (!isSelfBooking) {
      try {
        const user = await User.findById(userId).select("fullName");
        await Notification.create({
          recipient_id: providerId,
          recipient_type: isToProfessional ? "Professional" : "Company",
          sender_id: userId,
          sender_type: "User",
          type: "reservation",
          related_id: newReservation._id,
          message: `${user?.fullName || "Un client"} a pris un nouveau rendez-vous.`
        });
      } catch (notifErr) {
        console.error("⚠️ [createReservation] Erreur lors de la notification:", notifErr);
        // On ne bloque pas la réponse si seule la notification échoue
      }
    }

    res.status(201).json({ message: "Réservation effectuée avec succès", reservation: newReservation });
  } catch (error) {
    console.error("🔥 [createReservation] Critical Error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Company: Create manual blocks (unavailable slots)
exports.createManualBlock = async (req, res) => {
  try {
    const { date, timeSlots, serviceId } = req.body;
    const hasCompany = !!req.companyId;
    const isProfessional = !hasCompany && req.roles?.includes("professional");
    const providerId = hasCompany ? req.companyId : req.user;

    if (!date || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ message: "Date et créneaux sont requis" });
    }

    const [year, month, day] = date.split('-').map(Number);
    const blockDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0)); 

    const blocks = timeSlots.map(slot => ({
      companyId: hasCompany ? providerId : null,
      professionalId: isProfessional ? providerId : null,
      date: blockDate,
      timeSlot: slot,
      serviceId: serviceId || null,
      status: "blocked",
      isManualBlock: true
    }));

    await Reservation.insertMany(blocks);
    res.status(201).json({ message: "Disponibilités mises à jour" });
  } catch (error) {
    console.error("Error creating manual block:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Company: Delete manual block
exports.deleteManualBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const hasCompany = !!req.companyId;
    const isProfessional = !hasCompany && req.roles?.includes("professional");
    const providerId = hasCompany ? req.companyId : req.user;
    
    const query = isProfessional ? { _id: id, professionalId: providerId, isManualBlock: true } : { _id: id, companyId: providerId, isManualBlock: true };

    const block = await Reservation.findOneAndDelete(query);
    
    if (!block) {
      return res.status(404).json({ message: "Blocage non trouvé" });
    }

    res.json({ message: "Créneau débloqué" });
  } catch (error) {
    console.error("Error deleting manual block:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Client: Get my reservations
exports.getMyReservations = async (req, res) => {
  try {
    const userId = req.user;
    const reservations = await Reservation.find({ userId })
      .populate("companyId", "companyName logoUrl")
      .populate("professionalId", "fullName photoProfessional")
      .populate("serviceId", "name price duration")
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance and to modify the object

    // Fetch quotes for these reservations
    const Quote = require("../models/Quote");
    const reservationIds = reservations.map(r => r._id);
    const quotes = await Quote.find({ reservationId: { $in: reservationIds } });

    // Attach quotes to reservations
    const reservationsWithQuotes = reservations.map(res => {
      const quote = quotes.find(q => q.reservationId?.toString() === res._id.toString());
      return { ...res, quote };
    });

    res.json(reservationsWithQuotes);
  } catch (error) {
    console.error("Error fetching my reservations:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Company: Get company reservations
exports.getCompanyReservations = async (req, res) => {
  try {
    const hasCompany = !!req.companyId;
    const isProfessional = !hasCompany && req.roles?.includes("professional");
    const id = hasCompany ? req.companyId : req.user;
    
    const query = isProfessional ? { professionalId: id } : { companyId: id };
    
    console.log(`🔍 [getCompanyReservations] Fetching for ${isProfessional ? 'Pro' : 'Company'}: ${id}`);

    const reservations = await Reservation.find(query)
      .populate("userId", "fullName email avatarUrl phone")
      .populate("serviceId", "name price duration")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch quotes for these reservations
    const Quote = require("../models/Quote");
    const reservationIds = reservations.map(r => r._id);
    const quotes = await Quote.find({ reservationId: { $in: reservationIds } });

    // Attach quotes to reservations
    const reservationsWithQuotes = reservations.map(res => {
      const quote = quotes.find(q => q.reservationId?.toString() === res._id.toString());
      return { ...res, quote };
    });

    res.json(reservationsWithQuotes);
  } catch (error) {
    console.error("Error fetching company reservations:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Company: Update reservation status
exports.updateReservationStatus = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const hasCompany = !!req.companyId;
    const isProfessional = !hasCompany && req.roles?.includes("professional");
    const ownerId = hasCompany ? req.companyId : req.user;
    
    const query = isProfessional ? { _id: reservationId, professionalId: ownerId } : { _id: reservationId, companyId: ownerId };

    const reservation = await Reservation.findOne(query);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    const { status, adminNotes } = req.body;
    const oldStatus = reservation.status;
    reservation.status = status || reservation.status;
    reservation.adminNotes = adminNotes || reservation.adminNotes;
    await reservation.save();

    // Notify User if status changed
    if (oldStatus !== status) {
      const providerId = reservation.companyId || reservation.professionalId;
      const isFromPro = !!reservation.professionalId;
      
      let senderName = "Prestataire";
      if (isFromPro) {
        const Professional = require("../models/Professional");
        const pro = await Professional.findById(providerId).select("fullName");
        senderName = pro?.fullName || "Votre prestataire";
      } else {
        const company = await Company.findById(providerId).select("companyName");
        senderName = company?.companyName || "Votre boutique";
      }

      let statusFr = status;
      if (status === "confirmed") statusFr = "confirmé";
      if (status === "cancelled") statusFr = "annulé";
      if (status === "completed") statusFr = "terminé";

      await Notification.create({
        recipient_id: reservation.userId,
        recipient_type: "User",
        sender_id: providerId,
        sender_type: isFromPro ? "Professional" : "Company",
        type: "reservation",
        related_id: reservation._id,
        message: `Votre rendez-vous chez ${senderName} a été ${statusFr}.`
      });
    }

    res.json({ message: `Réservation ${status}`, reservation });
  } catch (error) {
    console.error("Error updating reservation status:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Common: Get available slots for a specific service and date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { serviceId, date } = req.query; // date string (YYYY-MM-DD)
    console.log(`[getAvailableSlots] Req for Service: ${serviceId}, Date: ${date}`);
    
    if (!serviceId || !date) {
      return res.status(400).json({ message: "serviceId and date are required" });
    }

    // Récupérer le prestataire associé au service
    const service = await CompanyService.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service non trouvé" });

    const companyId = service.companyId;
    const professionalId = service.professionalId;

    // Generate fixed slots from 08:00 to 19:00
    const allSlots = [
      "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
      "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
    ];

    // Define date range for the requested day safely in UTC
    let year, month, day;
    if (date.includes('T')) {
      const d = new Date(date);
      if (isNaN(d.getTime())) return res.status(400).json({ message: "Format de date ISO invalide" });
      year = d.getUTCFullYear();
      month = d.getUTCMonth();
      day = d.getUTCDate();
    } else {
      const parts = date.split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return res.status(400).json({ message: "Format de date YYYY-MM-DD invalide" });
      year = parts[0];
      month = parts[1] - 1;
      day = parts[2];
    }

    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    if (isNaN(startOfDay.getTime())) {
      return res.status(400).json({ message: "Format de date invalide" });
    }
    
    console.log(`[getAvailableSlots] Searching for Provider between: ${startOfDay.toISOString()} AND ${endOfDay.toISOString()}`);

    // Fetch existing reservations or blocks for the PROVIDER (not just the service)
    // Include pending, confirmed, paid, completed, and blocked
    const providerQuery = [];
    if (companyId) providerQuery.push({ companyId });
    if (professionalId) providerQuery.push({ professionalId });

    let existingReservations = [];
    if (providerQuery.length > 0) {
      existingReservations = await Reservation.find({
        $or: providerQuery,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["confirmed", "paid", "completed", "blocked"] }
      });
    }

    console.log(`[getAvailableSlots] Found ${existingReservations.length} occupied slots for provider`);

    const bookedSlots = existingReservations.map(r => r.timeSlot);

    // Map all potential slots to availability status
    const availableSlots = allSlots.map(slot => ({
      time: slot,
      isAvailable: !bookedSlots.includes(slot)
    }));

    res.json(availableSlots);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
