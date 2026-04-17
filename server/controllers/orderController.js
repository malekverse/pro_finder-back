const Order = require("../models/Order");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const Company = require("../models/company");
const User = require("../models/User");

// Client: Create an order
const createOrder = async (req, res) => {
  try {
    const { companyId, items, totalPrice, shippingAddress, notes } = req.body;
    const userId = req.user;

    const newOrder = new Order({
      userId,
      companyId,
      items,
      totalPrice,
      shippingAddress,
      notes,
    });

    await newOrder.save();

    // Update stock and notify if out of stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock = Math.max(0, (product.stock || 0) - item.quantity);
        await product.save();

        if (product.stock === 0) {
          // Notify Company about stock rupture
          await Notification.create({
            recipient_id: companyId,
            recipient_type: "Company",
            sender_id: userId,
            sender_type: "User",
            type: "stock_alert",
            related_id: product._id,
            message: `Alerte : Le produit "${product.name}" est désormais en rupture de stock.`
          });
        }
      }
    }

    // Notify Company (seulement si ce n'est pas le manager qui commande chez lui-même)
    if (req.companyId?.toString() !== companyId.toString()) {
      const user = await User.findById(userId).select("fullName");
      await Notification.create({
        recipient_id: companyId,
        recipient_type: "Company",
        sender_id: userId,
        sender_type: "User",
        type: "order",
        related_id: newOrder._id,
        message: `${user?.fullName || "Un client"} a passé une nouvelle commande.`
      });
    }

    res.status(201).json({ message: "Commande effectuée avec succès", order: newOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Client: Get my orders
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user;
    const orders = await Order.find({ userId })
      .populate("companyId", "companyName logoUrl")
      .populate("items.productId", "name price images")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching my orders:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Company: Get company orders
const getCompanyOrders = async (req, res) => {
  try {
    const companyId = req.companyId || req.user;
    const orders = await Order.find({ companyId })
      .populate("userId", "fullName email avatarUrl phone")
      .populate("items.productId", "name price images")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching company orders:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Company: Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, adminNotes } = req.body;
    const companyId = req.companyId || req.user;

    const order = await Order.findOne({ _id: orderId, companyId });
    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée" });
    }

    const oldStatus = order.status;
    order.status = status || order.status;
    order.adminNotes = adminNotes || order.adminNotes;
    await order.save();

    // Notify User if status changed
    if (oldStatus !== status) {
      const company = await Company.findById(companyId).select("companyName");
      let statusFr = status;
      if (status === "confirmed") statusFr = "confirmée";
      if (status === "shipped") statusFr = "expédiée";
      if (status === "delivered") statusFr = "livrée";
      if (status === "cancelled") statusFr = "annulée";

      await Notification.create({
        recipient_id: order.userId,
        recipient_type: "User",
        sender_id: companyId, // The company that updated it
        sender_type: "Company",
        type: "order",
        related_id: order._id,
        message: `Votre commande chez ${company?.companyName} a été ${statusFr}.`
      });
    }

    res.json({ message: `Commande ${status}`, order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
module.exports = { 
  createOrder,
  getMyOrders,  
  getCompanyOrders,
  updateOrderStatus 
};