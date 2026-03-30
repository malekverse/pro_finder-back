const Reservation = require("../models/Reservation");
const CompanyService = require("../models/CompanyService");

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
      .sort({ createdAt: -1 });

    res.json(reservations);
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
      .sort({ createdAt: -1 });

    res.json(reservations);
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

    reservation.status = status || reservation.status;
    reservation.adminNotes = adminNotes || reservation.adminNotes;
    await reservation.save();

    res.json({ message: `Réservation ${status}`, reservation });
  } catch (error) {
    console.error("Error updating reservation status:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
