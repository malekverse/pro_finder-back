const Reservation = require("../models/Reservation");
const CompanyService = require("../models/CompanyService");
const Notification = require("../models/Notification");
const Company = require("../models/company");

// Client: Create a reservation
exports.createReservation = async (req, res) => {
  try {
    const { serviceId, companyId, date, timeSlot, notes } = req.body;
    const userId = req.user;

    let actualCompanyId = companyId;
    let actualProfessionalId = req.body.professionalId;
    let isToProfessional = !!actualProfessionalId;

    // Sécurité: si professionalId est manquant mais que companyId est présent, 
    // on vérifie si l'ID appartient à un professionnel
    if (!isToProfessional && actualCompanyId) {
      const Professional = require("../models/Professional");
      const isProAccount = await Professional.exists({ _id: actualCompanyId });
      if (isProAccount) {
        actualProfessionalId = actualCompanyId;
        actualCompanyId = null;
        isToProfessional = true;
      }
    }

    const providerId = actualCompanyId || actualProfessionalId;

    const newReservation = new Reservation({
      userId,
      companyId: actualCompanyId,
      professionalId: actualProfessionalId,
      serviceId,
      date,
      timeSlot,
      notes,
    });

    await newReservation.save();

    // Notify Company (seulement si ce n'est pas le manager qui réserve chez lui-même)
    const isSelfBooking = req.roles?.includes("professional") 
      ? (req.user?.toString() === providerId?.toString()) 
      : (req.companyId?.toString() === providerId?.toString());

    if (!isSelfBooking) {
      const User = require("../models/User");
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
    }

    res.status(201).json({ message: "Réservation effectuée avec succès", reservation: newReservation });
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Company: Create manual blocks (unavailable slots)
exports.createManualBlock = async (req, res) => {
  try {
    const { date, timeSlots, serviceId } = req.body;
    const isProfessional = req.roles?.includes("professional");
    const providerId = isProfessional ? req.user : req.companyId;

    if (!date || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ message: "Date et créneaux sont requis" });
    }

    const [year, month, day] = date.split('-').map(Number);
    const blockDate = new Date(year, month - 1, day, 12, 0, 0, 0);

    const blocks = timeSlots.map(slot => ({
      companyId: isProfessional ? null : providerId,
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
    const isProfessional = req.roles?.includes("professional");
    const providerId = isProfessional ? req.user : req.companyId;
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
    const id = req.companyId || req.user;
    const isProfessional = req.roles?.includes("professional");
    const query = isProfessional ? { professionalId: id } : { companyId: id };

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
    const isProfessional = req.roles?.includes("professional");
    const ownerId = req.companyId || req.user;
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

    // Generate fixed slots from 08:00 to 19:00
    const allSlots = [
      "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
      "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
    ];

    // Define date range for the requested day safely
    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
    
    console.log(`[getAvailableSlots] Searching between: ${startOfDay.toISOString()} AND ${endOfDay.toISOString()}`);

    // Fetch existing reservations or blocks that are NOT pending or cancelled
    // A slot is only occupied if it's confirmed, completed, or a manual block
    const existingReservations = await Reservation.find({
      $or: [
        { serviceId: serviceId },
        { serviceId: null }
      ],
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["confirmed", "completed", "blocked"] }
    });

    console.log(`[getAvailableSlots] Found ${existingReservations.length} reservations`);

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
