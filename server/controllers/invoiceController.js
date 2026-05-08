const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

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
                    const order = await mongoose.model("Order").findById(item.entityId);
                    if (order?.shippingAddress?.phone) phone = order.shippingAddress.phone;
                } else if (item.entityType === "Reservation") {
                    const res = await mongoose.model("Reservation").findById(item.entityId);
                    if (res?.clientPhone) phone = res.clientPhone;
                } else if (item.entityType === "Quote") {
                    const quote = await mongoose.model("Quote").findById(item.entityId);
                    // On peut aussi chercher le numéro dans la réservation liée au devis
                    if (quote?.reservationId) {
                        const res = await mongoose.model("Reservation").findById(quote.reservationId);
                        if (res?.clientPhone) phone = res.clientPhone;
                    }
                } else if (item.entityType === "Contract") {
                    const contract = await mongoose.model("Contract").findById(item.entityId).populate("quoteId");
                    if (contract?.quoteId?.reservationId) {
                        const res = await mongoose.model("Reservation").findById(contract.quoteId.reservationId);
                        if (res?.clientPhone) phone = res.clientPhone;
                    }
                }
            } catch (err) {
                console.error("Error fetching phone for invoice item:", err);
            }

            return {
                description: `${item.entityType} #${item.entityId.toString().slice(-6).toUpperCase()}`,
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