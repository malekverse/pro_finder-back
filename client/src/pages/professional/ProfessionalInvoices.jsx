import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetProviderInvoicesQuery } from "../../redux/features/invoices/invoiceApiSlice";
import { 
  FileText, Download, Loader2, Calendar, 
  DollarSign, User, TrendingUp, X
} from "lucide-react";
import { generateInvoicePDF } from "../../utils/pdfGenerator";
import { useSelector } from "react-redux";

const ProfessionalInvoices = () => {
  const { data: invoices = [], isLoading } = useGetProviderInvoicesQuery();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const filterOrderId = location.state?.orderId;
  const filterReservationId = location.state?.reservationId;

  const handleDownload = (invoice) => {
    generateInvoicePDF(invoice, user);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (filterOrderId) return inv.orderId === filterOrderId;
    if (filterReservationId) return inv.reservationId === filterReservationId;
    return true;
  });

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 style={styles.title}>Ma Facturation</h1>
            <p style={styles.subtitle}>
              {filterOrderId || filterReservationId 
                ? `Résultats pour ${filterOrderId ? 'la commande' : 'la réservation'} #${(filterOrderId || filterReservationId).slice(-6).toUpperCase()}` 
                : "Gérez vos justificatifs de revenus et factures clients."
              }
            </p>
          </div>
          {(filterOrderId || filterReservationId) && (
            <button 
              onClick={() => navigate(location.pathname, { replace: true, state: {} })}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                borderRadius: '10px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer'
              }}
            >
              <X size={16} /> Effacer le filtre
            </button>
          )}
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{...styles.iconBox, background: '#f0fdf4'}}>
            <TrendingUp size={20} color="#15803d" />
          </div>
          <div>
            <div style={styles.statLabel}>Revenus Totaux</div>
            <div style={styles.statValue}>{totalRevenue.toFixed(2)} TND</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.iconBox, background: '#fffbeb'}}>
            <FileText size={20} color="#b45309" />
          </div>
          <div>
            <div style={styles.statLabel}>Documents émis</div>
            <div style={styles.statValue}>{filteredInvoices.length}</div>
          </div>
        </div>
      </div>

      <div style={styles.tableCard}>
        {isLoading ? (
          <div style={styles.loader}><Loader2 className="animate-spin" /></div>
        ) : filteredInvoices.length === 0 ? (
          <div style={styles.empty}>
            <FileText size={48} color="#cbd5e1" />
            <p>Aucune facture trouvée.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Référence</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Montant</th>
                <th style={styles.th}>État</th>
                <th style={{...styles.th, textAlign: 'right'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
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
                    <div style={styles.clientInfo}>
                      <User size={14} />
                      <div>
                        <div style={{fontWeight: '700'}}>{invoice.userId?.fullName}</div>
                        <div style={{fontSize: '11px', color: '#64748b'}}>{invoice.userId?.email}</div>
                      </div>
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
                    >
                      <Download size={16} />
                      <span>Télécharger</span>
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
    overflow: "hidden"
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
  clientInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
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
    fontWeight: "800"
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
    cursor: "pointer"
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

export default ProfessionalInvoices;
