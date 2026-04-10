const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const { type } = req.query; // "User" ou "Company"
    
    let recipientId;
    let recipientType;

    if (type === "Company") {
      recipientId = req.companyId;
      recipientType = "Company";
    } else if (type === "User") {
      recipientId = req.user;
      recipientType = "User";
    } else {
      // Fallback: si on a un companyId et pas de type, on assume Company, sinon User
      const isCompany = !!req.companyId;
      recipientId = isCompany ? req.companyId : req.user;
      recipientType = isCompany ? "Company" : "User";
    }
    
    if (!recipientId) return res.json([]);

    const notifications = await Notification.find({ 
      recipient_id: recipientId,
      recipient_type: recipientType
    })
    .populate("sender_id", "fullName email avatarUrl companyName logoUrl")
    .sort({ createdAt: -1 })
    .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error("[getNotifications]", error);
    res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { is_read: true });
    res.json({ message: "Notification marquée comme lue" });
  } catch (error) {
    console.error("[markAsRead]", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la notification" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { type } = req.query;
    
    let recipientId;
    let recipientType;

    if (type === "Company") {
      recipientId = req.companyId;
      recipientType = "Company";
    } else if (type === "User") {
      recipientId = req.user;
      recipientType = "User";
    } else {
      const isCompany = !!req.companyId;
      recipientId = isCompany ? req.companyId : req.user;
      recipientType = isCompany ? "Company" : "User";
    }

    await Notification.updateMany(
      { recipient_id: recipientId, recipient_type: recipientType, is_read: false },
      { is_read: true }
    );
    res.json({ message: "Toutes les notifications marquées comme lues" });
  } catch (error) {
    console.error("[markAllAsRead]", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour des notifications" });
  }
};
