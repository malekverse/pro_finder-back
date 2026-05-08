import React, { useState } from 'react';
import { 
  useGetMyBalanceQuery, 
  useRequestPayoutMutation, 
  useGetPayoutHistoryQuery 
} from "../../redux/features/company/companyApiSlice";
import { 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Download,
  History
} from 'lucide-react';
import styles from "../../styles/Gains.module.css";

const Gains = () => {
  const { data, isLoading, refetch } = useGetMyBalanceQuery();
  const { data: payoutHistory = [] } = useGetPayoutHistoryQuery();
  const [requestPayout, { isLoading: isRequesting }] = useRequestPayoutMutation();
  
  const [payoutAmount, setPayoutAmount] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePayout = async (e) => {
    e.preventDefault();
    if (!payoutAmount || payoutAmount <= 0) return;

    try {
      await requestPayout(Number(payoutAmount)).unwrap();
      setMessage({ type: 'success', text: 'Demande de retrait envoyée avec succès.' });
      setPayoutAmount('');
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.data?.message || 'Erreur lors de la demande.' });
    }
  };

  if (isLoading) return <div className={styles.loading}>Chargement...</div>;

  const balance = data?.balance || { pendingBalance: 0, availableBalance: 0, totalEarned: 0 };
  const payments = data?.recentPayments || [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Mes gains</h1>
        <p>Gérez vos revenus et vos demandes de retrait</p>
      </header>

      {/* BALANCE CARDS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
            <Wallet size={24} />
          </div>
          <div className={styles.statInfo}>
            <span>Solde disponible</span>
            <h3>{balance.availableBalance.toFixed(2)} TND</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <span>En attente</span>
            <h3>{balance.pendingBalance.toFixed(2)} TND</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <span>Total gagné</span>
            <h3>{balance.totalEarned.toFixed(2)} TND</h3>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* WITHDRAWAL SECTION */}
        <div className={styles.payoutSection}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <ArrowUpRight size={20} />
              <h3>Demander un retrait</h3>
            </div>
            <form onSubmit={handlePayout} className={styles.payoutForm}>
              <div className={styles.inputGroup}>
                <label>Montant à retirer (TND)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  max={balance.availableBalance}
                  required
                />
              </div>
              <button 
                type="submit" 
                className={styles.payoutBtn}
                disabled={isRequesting || balance.availableBalance <= 0}
              >
                {isRequesting ? 'Traitement...' : 'Confirmer le retrait'}
              </button>
              {message.text && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {message.text}
                </div>
              )}
            </form>
          </div>

          <div className={styles.card} style={{ marginTop: '20px' }}>
            <div className={styles.cardHeader}>
              <History size={20} />
              <h3>Historique des retraits</h3>
            </div>
            <div className={styles.payoutList}>
              {payoutHistory.length === 0 ? (
                <p className={styles.empty}>Aucun retrait effectué.</p>
              ) : (
                payoutHistory.map(req => (
                  <div key={req._id} className={styles.payoutItem}>
                    <div className={styles.payoutInfo}>
                      <span className={styles.payoutAmount}>{req.amount.toFixed(2)} TND</span>
                      <span className={styles.payoutDate}>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[req.status]}`}>
                      {req.status === 'pending' ? 'En cours' : req.status === 'processed' ? 'Effectué' : 'Rejeté'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className={styles.transactionsSection}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <TrendingUp size={20} />
              <h3>Transactions récentes</h3>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className={styles.empty}>Aucun paiement reçu.</td>
                    </tr>
                  ) : (
                    payments.map(pay => (
                      <tr key={pay._id}>
                        <td>
                          <div className={styles.clientCell}>
                            <span className={styles.clientName}>{pay.userId?.fullName}</span>
                            <span className={styles.clientEmail}>{pay.userId?.email}</span>
                          </div>
                        </td>
                        <td>{new Date(pay.createdAt).toLocaleDateString()}</td>
                        <td className={styles.amountCell}>{pay.amount.toFixed(2)} TND</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles.success}`}>
                            Payé
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gains;
