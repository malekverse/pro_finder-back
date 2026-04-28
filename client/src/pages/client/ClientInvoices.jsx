import React from "react";
import { useGetMyInvoicesQuery } from "../../redux/features/invoiceApiSlice";
import { 
  FileText, Download, Loader2, Calendar, 
  DollarSign, Building2, Search, Filter
} from "lucide-react";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const ClientInvoices = () => {
  const { data: invoices = [], isLoading } = useGetMyInvoicesQuery();

  const handleDownload = (invoice) => {
    const provider = invoice.companyId || invoice.professionalId;
    generateInvoicePDF(invoice, provider);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mes Factures</h1>
          <p style={styles.subtitle}>Consultez et téléchargez vos justificatifs de paiement.</p>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{...styles.iconBox, background: '#e0f2fe'}}>
            <FileText size={20} color="#0369a1" />
          </div>
          <div>
            <div style={styles.statLabel}>Total Factures</div>
            <div style={styles.statValue}>{invoices.length}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.iconBox, background: '#f0fdf4'}}>
            <DollarSign size={20} color="#15803d" />
          </div>
          <div>
            <div style={styles.statLabel}>Montant Total Payé</div>
            <div style={styles.statValue}>
              {invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)} TND
            </div>
          </div>
        </div>
      </div>

      <div style={styles.tableCard}>
        {isLoading ? (
          <div style={styles.loader}><Loader2 className="animate-spin" /></div>
        ) : invoices.length === 0 ? (
          <div style={styles.empty}>
            <FileText size={48} color="#cbd5e1" />
            <p>Aucune facture trouvée.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>N° Facture</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Prestataire</th>
                <th style={styles.th}>Montant</th>
                <th style={styles.th}>État</th>
                <th style={{...styles.th, textAlign: 'right'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice._id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.invoiceNum}>{invoice.invoiceNumber}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.dateInfo}>
                      <Calendar size={14} />
                      {new Date(invoice.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.providerInfo}>
                      <Building2 size={14} />
                      {invoice.companyId?.companyName || invoice.professionalId?.fullName || "N/A"}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.amount}>{invoice.amount.toFixed(2)} TND</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge}>Payée</span>
                  </td>
                  <td style={{...styles.td, textAlign: 'right'}}>
                    <button 
                      onClick={() => handleDownload(invoice)}
                      style={styles.downloadBtn}
                      title="Télécharger PDF"
                    >
                      <Download size={16} />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Inter', sans-serif"
  },
  header: {
    marginBottom: "32px"
  },
  title: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#1e293b",
    margin: 0
  },
  subtitle: {
    color: "#64748b",
    marginTop: "4px"
  },
  statsRow: {
    display: "flex",
    gap: "24px",
    marginBottom: "32px"
  },
  statCard: {
    background: "#fff",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flex: 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
  },
  iconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "600"
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1e293b"
  },
  tableCard: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #f1f5f9",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
  },
  th: {
    padding: "16px 24px",
    fontSize: "12px",
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    background: "#f8fafc"
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s"
  },
  td: {
    padding: "18px 24px",
    fontSize: "14px",
    color: "#334155"
  },
  invoiceNum: {
    fontWeight: "800",
    color: "#24416b"
  },
  dateInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b"
  },
  providerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600"
  },
  amount: {
    fontWeight: "800",
    color: "#1e293b"
  },
  statusBadge: {
    background: "#f0fdf4",
    color: "#166534",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase"
  },
  downloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "10px",
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  loader: {
    padding: "60px",
    display: "flex",
    justifyContent: "center"
  },
  empty: {
    padding: "60px",
    textAlign: "center",
    color: "#64748b"
  }
};

export default ClientInvoices;
