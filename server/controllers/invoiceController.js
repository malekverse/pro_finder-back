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
exports.createInvoiceFromPayment = async (payment) => {
    try {
        const invoiceNumber = await generateInvoiceNumber();
        
        const invoice = new Invoice({
            invoiceNumber,
            paymentId: payment._id,
            orderId: payment.orderId,
            reservationId: payment.reservationId,
            quoteId: payment.quoteId,
            contractId: payment.contractId,
            userId: payment.userId,
            companyId: payment.companyId,
            professionalId: payment.professionalId,
            amount: payment.amount,
            status: "paid",
            date: new Date(),
            notes: `Facture générée automatiquement pour le paiement ${payment.paymentId}`
        });

        await invoice.save();
        console.log(`📄 [InvoiceService] Invoice created: ${invoiceNumber}`);
        return invoice;
    } catch (error) {
        console.error("❌ [InvoiceService] Failed to create invoice:", error);
        throw error;
    }
};

// Get invoices for client
exports.getMyInvoices = async (req, res) => {
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
exports.getProviderInvoices = async (req, res) => {
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
