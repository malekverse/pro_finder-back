const Reservation = require("../models/Reservation");
const CompanyService = require("../models/CompanyService");
const Notification = require("../models/Notification");
const Company = require("../models/company");

// Client: Create a reservation
exports.createReservation = async (req, res) => {
  try {
    const { serviceId, companyId, date, timeSlot, notes } = req.body;
    const userId = req.user;

    const newReservation = new Reservation({
      userId,
      companyId,
      serviceId,
      date,
      timeSlot,
      notes,
    });

    await newReservation.save();

    // Notify Company (seulement si ce n'est pas le manager qui réserve chez lui-même)
    if (req.companyId?.toString() !== companyId.toString()) {
      const User = require("../models/User");
      const user = await User.findById(userId).select("fullName");
      await Notification.create({
        recipient_id: companyId,
        recipient_type: "Company",
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

// Client: Get my reservations
exports.getMyReservations = async (req, res) => {
  try {
    const userId = req.user;
    const reservations = await Reservation.find({ userId })
      .populate("companyId", "companyName logoUrl")
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
    const companyId = req.companyId || req.user;
    const reservations = await Reservation.find({ companyId })
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
    const { status, adminNotes } = req.body;
    const companyId = req.companyId || req.user;

    const reservation = await Reservation.findOne({ _id: reservationId, companyId });
    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    const oldStatus = reservation.status;
    reservation.status = status || reservation.status;
    reservation.adminNotes = adminNotes || reservation.adminNotes;
    await reservation.save();

    // Notify User if status changed
    if (oldStatus !== status) {
      const company = await Company.findById(companyId).select("companyName");
      let statusFr = status;
      if (status === "confirmed") statusFr = "confirmé";
      if (status === "cancelled") statusFr = "annulé";
      if (status === "completed") statusFr = "terminé";

      await Notification.create({
        recipient_id: reservation.userId,
        recipient_type: "User",
        sender_id: companyId,
        sender_type: "Company",
        type: "reservation",
        related_id: reservation._id,
        message: `Votre rendez-vous chez ${company?.companyName} a été ${statusFr}.`
      });
    }

    res.json({ message: `Réservation ${status}`, reservation });
  } catch (error) {
    console.error("Error updating reservation status:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
