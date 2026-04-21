const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      refPath: 'recipient_type'
    },
    recipient_type: { 
      type: String, 
      required: true, 
      enum: ["User", "Company", "Professional"] 
    },
    sender_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'sender_type'
    },
    sender_type: {
      type: String,
      required: true,
      enum: ["User", "Company", "Professional"],
      default: "User"
    },
    type: { 
      type: String, 
      required: true, 
      enum: ["follow", "review", "comment", "order", "reservation", "quote", "contract", "stock_alert"] 
    },
    related_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    is_read: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
