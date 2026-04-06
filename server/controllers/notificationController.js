const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const isCompany = !!req.companyId;
    const recipientId = isCompany ? req.companyId : req.user;
    const recipientType = isCompany ? "Company" : "User";
    
    const notifications = await Notification.find({ 
      recipient_id: recipientId,
      recipient_type: recipientType
    })
    .populate("sender_id", "fullName email avatar")
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
    const isCompany = !!req.companyId;
    const recipientId = isCompany ? req.companyId : req.user;
    const recipientType = isCompany ? "Company" : "User";

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
