import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateQuotePDF = (quote, company) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(36, 65, 107); // #24416b
  doc.text("DEVIS", 105, 20, { align: "center" });

  // Company Info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(company?.companyName || "Entreprise", 20, 40);
  doc.setFontSize(10);
  doc.text(company?.email || "", 20, 45);
  doc.text(company?.phone || "", 20, 50);

  // Quote Info
  doc.text(`N° Devis: ${quote.quoteNumber}`, 140, 40);
  doc.text(`Date: ${date}`, 140, 45);
  doc.text(`Valide jusqu'au: ${new Date(quote.validUntil).toLocaleDateString()}`, 140, 50);
  
  doc.setFontSize(9);
  doc.setTextColor(quote.requiresContract ? 154 : 21, quote.requiresContract ? 52 : 128, quote.requiresContract ? 18 : 61); // Reddish for required, Greenish for not
  doc.text(quote.requiresContract ? "* Signature d'un contrat obligatoire" : "* Aucun contrat requis", 140, 56);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // Client Info
  doc.setFontSize(12);
  doc.text("DESTINATAIRE:", 20, 70);
  doc.setFontSize(10);
  doc.text(quote.userId?.fullName || "Client", 20, 75);
  doc.text(quote.userId?.email || "", 20, 80);

  // Items Table
  const hasDuration = quote.items.some(item => item.duration);
  
  const tableHead = hasDuration 
    ? [["Description", "Durée", "Prix Unitaire", "Total"]]
    : [["Description", "Prix Unitaire", "Total"]];

  const tableRows = quote.items.map(item => {
    const row = [item.description];
    if (hasDuration) row.push(item.duration || "-");
    row.push(`${(item.unitPrice || 0).toFixed(2)} TND`);
    row.push(`${((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)} TND`);
    return row;
  });
  
  autoTable(doc, {
    startY: 90,
    head: tableHead,
    body: tableRows,
    headStyles: { fillColor: [36, 65, 107] },
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Sous-total: ${(quote.subTotal || 0).toFixed(2)} TND`, 140, finalY);
  doc.text(`TVA (${quote.taxRate || 0}%): ${(quote.taxAmount || 0).toFixed(2)} TND`, 140, finalY + 5);
  doc.setFontSize(12);
  doc.text(`TOTAL TTC: ${(quote.totalAmount || 0).toFixed(2)} TND`, 140, finalY + 12);

  // Footer
  if (quote.notes) {
    doc.setFontSize(10);
    doc.text("Notes & Conditions:", 20, finalY + 30);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(quote.notes, 20, finalY + 35, { maxWidth: 170 });
  }

  doc.save(`${quote.quoteNumber}.pdf`);
};

export const generateContractPDF = (contract, company) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(36, 65, 107);
  doc.text("CONTRAT DE PRESTATION", 105, 25, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`N° ${contract.contractNumber}`, 105, 35, { align: "center" });

  doc.text("ENTRE LES SOUSSIGNÉS:", 20, 55);
  doc.setFontSize(10);
  doc.text(`L'ENTREPRISE: ${company?.companyName || "Fournisseur"}`, 25, 65);
  doc.text(`LE CLIENT: ${contract.userId?.fullName || "Client"}`, 25, 72);

  doc.setFontSize(12);
  doc.text("ARTICLE 1 : OBJET DU CONTRAT", 20, 90);
  doc.setFontSize(10);
  doc.text(contract.title, 25, 100);
  doc.text(contract.content, 25, 110, { maxWidth: 160 });

  doc.setFontSize(12);
  doc.text("ARTICLE 2 : DURÉE ET MONTANT", 20, 160);
  doc.setFontSize(10);
  doc.text(`Date de début: ${new Date(contract.startDate).toLocaleDateString()}`, 25, 170);
  if (contract.endDate) doc.text(`Date de fin: ${new Date(contract.endDate).toLocaleDateString()}`, 25, 177);
  doc.text(`Valeur totale du contrat: ${contract.totalValue.toFixed(2)} TND`, 25, 184);

  if (contract.terms) {
    doc.setFontSize(12);
    doc.text("ARTICLE 3 : TERMES ET CONDITIONS", 20, 200);
    doc.setFontSize(10);
    doc.text(contract.terms, 25, 210, { maxWidth: 160 });
  }

  if (contract.signatureDate) {
    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52);
    doc.text(`Signé électroniquement le ${new Date(contract.signatureDate).toLocaleString()}`, 20, 260);
  }

  doc.save(`${contract.contractNumber}.pdf`);
};

export const generateInvoicePDF = (invoice, provider) => {
  const doc = new jsPDF();
  const date = new Date(invoice.date).toLocaleDateString();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(36, 65, 107);
  doc.text("FACTURE", 105, 20, { align: "center" });

  // Status Stamp
  doc.setDrawColor(16, 185, 129); // Success Green
  doc.setLineWidth(0.5);
  doc.roundedRect(150, 10, 40, 15, 2, 2);
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(14);
  doc.text("PAYÉE", 170, 20, { align: "center" });

  // Provider Info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(provider?.companyName || provider?.fullName || "Prestataire", 20, 40);
  doc.setFontSize(10);
  doc.text(provider?.email || "", 20, 45);
  doc.text(provider?.phone || "", 20, 50);

  // Invoice Info
  doc.text(`N° Facture: ${invoice.invoiceNumber}`, 140, 40);
  doc.text(`Date: ${date}`, 140, 45);
  doc.text(`Paiement: Flouci`, 140, 50);

  // Client Info
  doc.setFontSize(12);
  doc.text("FACTURÉ À:", 20, 70);
  doc.setFontSize(10);
  doc.text(invoice.userId?.fullName || "Client", 20, 75);
  doc.text(invoice.userId?.email || "", 20, 80);
  
  // Afficher le numéro de téléphone du client s'il est présent dans l'un des items
  const clientPhone = invoice.items?.find(item => item.clientPhone)?.clientPhone;
  if (clientPhone) {
    doc.text(`Tél: ${clientPhone}`, 20, 85);
  }

  // Table
  const tableHead = [["Description", "Qté", "Prix Unitaire", "Total"]];
  const tableRows = (invoice.items?.length > 0 ? invoice.items : [
    { description: "Service / Produit (Prestation globale)", quantity: 1, price: invoice.amount, total: invoice.amount }
  ]).map(item => [
    item.description,
    item.quantity || 1,
    `${(item.price || item.unitPrice || invoice.amount).toFixed(2)} TND`,
    `${(item.total || invoice.amount).toFixed(2)} TND`
  ]);

  autoTable(doc, {
    startY: 90,
    head: tableHead,
    body: tableRows,
    headStyles: { fillColor: [36, 65, 107] },
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`MONTANT PAYÉ: ${invoice.amount.toFixed(2)} TND`, 140, finalY, { align: "right" });

  // Footer
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Merci pour votre confiance !", 105, finalY + 40, { align: "center" });
  doc.text("PRO FINDER - Plateforme de mise en relation professionnelle", 105, finalY + 45, { align: "center" });

  doc.save(`${invoice.invoiceNumber}.pdf`);
};
