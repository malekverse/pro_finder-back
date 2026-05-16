const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Reservation = require("../models/Reservation");
const Quote = require("../models/Quote");
const Contract = require("../models/Contract");


// Helper to generate a unique invoice number
const generateInvoiceNumber = async () => {
    const totalCount = await Invoice.countDocuments({});
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `INV-${year}${month}-${(totalCount + 1).toString().padStart(4, '0')}`;
};

// Create an invoice from a payment
const createInvoiceFromPayment = async (payment) => {
    try {
        const invoiceNumber = await generateInvoiceNumber();
        
        const invoiceItems = await Promise.all(payment.items.map(async (item) => {
            let detail = "";
            let phone = "";
            
            try {
                if (item.entityType === "Order") {
                    const order = await Order.findById(item.entityId).populate("items.productId");
                    if (order?.shippingAddress?.phone) phone = order.shippingAddress.phone;
                    if (order?.items && order.items.length > 0) {
                        detail = order.items.map(i => i.productId?.name || "Produit").join(", ");
                    }
                } else if (item.entityType === "Reservation") {
                    const res = await Reservation.findById(item.entityId).populate("serviceId");
                    if (res?.clientPhone) phone = res.clientPhone;
                    if (res?.serviceId?.name) detail = res.serviceId.name;
                } else if (item.entityType === "Quote") {
                    const quote = await Quote.findById(item.entityId).populate("bookingServiceId");
                    if (quote?.reservationId) {
                        const res = await Reservation.findById(quote.reservationId);
                        if (res?.clientPhone) phone = res.clientPhone;
                    }
                    if (quote?.bookingServiceId?.name) {
                        detail = quote.bookingServiceId.name;
                    } else if (quote?.items && quote.items.length > 0) {
                        detail = quote.items.map(i => i.description).join(", ");
                    }
                } else if (item.entityType === "Contract") {
                    const contract = await Contract.findById(item.entityId).populate({
                        path: "quoteId",
                        populate: { path: "bookingServiceId" }
                    });
                    if (contract?.quoteId?.reservationId) {
                        const res = await Reservation.findById(contract.quoteId.reservationId);
                        if (res?.clientPhone) phone = res.clientPhone;
                    }
                    if (contract?.quoteId?.bookingServiceId?.name) {
                        detail = contract.quoteId.bookingServiceId.name;
                    } else if (contract?.quoteId?.items && contract.quoteId.items.length > 0) {
                        detail = contract.quoteId.items.map(i => i.description).join(", ");
                    }
                }
            } catch (err) {
                console.error("Error fetching detail/phone for invoice item:", err);
            }

            // Fallback to Entity #ID if no detail was found
            const description = detail || `${item.entityType} #${item.entityId.toString().slice(-6).toUpperCase()}`;

            return {
                description,
                quantity: 1,
                price: item.amount,
                total: item.amount,
                entityType: item.entityType,
                entityId: item.entityId,
                clientPhone: phone
            };
        }));

        const invoice = new Invoice({
            invoiceNumber,
            paymentId: payment._id,
            items: invoiceItems,
            userId: payment.userId,
            companyId: payment.companyId,
            professionalId: payment.professionalId,
            amount: payment.amount,
            status: "paid",
            date: new Date(),
            notes: `Facture générée automatiquement pour le paiement ${payment.paymentId}`
        });

        await invoice.save();
        console.log(`📄 [InvoiceService] Invoice created: ${invoiceNumber} with ${invoiceItems.length} items`);
        return invoice;
    } catch (error) {
        console.error("❌ [InvoiceService] Failed to create invoice:", error);
        throw error;
    }
};

// Get invoices for client
const getMyInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ userId: req.user })
            .populate("companyId", "companyName")
            .populate("professionalId", "fullName")
            .sort({ date: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: "Error fetching invoices" });
    }
};

// Get invoices for company/professional
const getProviderInvoices = async (req, res) => {
    try {
        const id = req.companyId || req.user;
        const isProfessional = req.roles?.includes("professional");
        const query = isProfessional ? { professionalId: id } : { companyId: id };

        const invoices = await Invoice.find(query)
            .populate("userId", "fullName email")
            .sort({ date: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: "Error fetching invoices" });
    }
};
module.exports ={generateInvoiceNumber,
    createInvoiceFromPayment,
    getMyInvoices,
    getProviderInvoices}