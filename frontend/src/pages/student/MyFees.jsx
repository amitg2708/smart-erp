import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { MdAttachMoney, MdHistory, MdExpandMore, MdExpandLess, MdWarning } from 'react-icons/md';

const statusColor = { paid: '#22c55e', partial: '#f59e0b', pending: '#6b7280', overdue: '#ef4444' };

export default function MyFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    API.get('/fee').then(({ data }) => setFees(data.data || data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalFees = fees.reduce((s, f) => s + f.totalFees + (f.lateFee || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalPending = fees.reduce((s, f) => s + f.pendingAmount, 0);
  const pct = (f) => {
    const total = f.totalFees + (f.lateFee || 0);
    return total > 0 ? Math.round((f.paidAmount / total) * 100) : 0;
  };

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Fee Status</h1>
        <p className="page-subtitle">View your fee records, installments, and payment history</p>
      </div>

      {fees.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Fees', val: `₹${totalFees.toLocaleString()}`, color: 'blue' },
            { label: 'Amount Paid', val: `₹${totalPaid.toLocaleString()}`, color: 'green' },
            { label: 'Amount Pending', val: `₹${totalPending.toLocaleString()}`, color: 'red' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.color}`}><MdAttachMoney /></div>
              <div className="stat-info"><h3>{s.val}</h3><p>{s.label}</p></div>
            </div>
          ))}
        </div>
      )}

      {loading ? <div className="spinner-wrapper"><div className="spinner" /></div> :
        fees.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon">💰</div><h3>No fee records</h3><p>Your fee records will appear here once added by admin</p></div></div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {fees.map(f => (
              <div className="card" key={f._id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Semester {f.semester}</h3>
                    {f.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{f.description}</p>}
                    {f.dueDate && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>Due: {new Date(f.dueDate).toLocaleDateString()}</p>}
                  </div>
                  <span className="badge" style={{ background: statusColor[f.status] + '20', color: statusColor[f.status], fontSize: '0.85rem', padding: '6px 14px', border: `1px solid ${statusColor[f.status]}40` }}>
                    {f.status === 'overdue' && <MdWarning style={{ verticalAlign: 'middle', marginRight: 4 }} />} {f.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Total Fees', val: `₹${f.totalFees.toLocaleString()}`, color: 'var(--text-primary)' },
                    { label: 'Late Fee', val: `₹${(f.lateFee || 0).toLocaleString()}`, color: f.lateFee > 0 ? '#ef4444' : 'var(--text-muted)' },
                    { label: 'Paid', val: `₹${f.paidAmount.toLocaleString()}`, color: '#22c55e' },
                    { label: 'Pending', val: `₹${f.pendingAmount.toLocaleString()}`, color: f.pendingAmount > 0 ? '#ef4444' : '#22c55e' },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{item.label}</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: item.color }}>{item.val}</div>
                    </div>
                  ))}
                </div>

                <div className="progress-bar-wrap" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Payment Progress</span>
                    <span style={{ color: statusColor[f.status] }}>{pct(f)}%</span>
                  </div>
                  <div className="progress-bar-track" style={{ height: 10 }}>
                    <div className={`progress-bar-fill ${f.status === 'paid' ? 'green' : f.status === 'overdue' ? 'red' : 'amber'}`} style={{ width: `${pct(f)}%` }} />
                  </div>
                </div>

                {/* Installments */}
                {f.installments?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <button className="expand-btn" onClick={() => toggleExpand(`inst-${f._id}`)}>
                      {expanded[`inst-${f._id}`] ? <MdExpandLess /> : <MdExpandMore />} Installment Plan ({f.installments.length})
                    </button>
                    {expanded[`inst-${f._id}`] && (
                      <div className="installment-list">
                        {f.installments.map((inst, i) => (
                          <div key={i} className="installment-row">
                            <span>Installment {i + 1}</span>
                            <span>₹{inst.amount.toLocaleString()}</span>
                            <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>Due: {new Date(inst.dueDate).toLocaleDateString()}</span>
                            <span className="badge" style={{ fontSize: '0.75rem', background: statusColor[inst.status] + '20', color: statusColor[inst.status] }}>{inst.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment History */}
                {f.paymentHistory?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <button className="expand-btn" onClick={() => toggleExpand(`hist-${f._id}`)}>
                      <MdHistory /> {expanded[`hist-${f._id}`] ? <MdExpandLess /> : <MdExpandMore />} Payment History ({f.paymentHistory.length})
                    </button>
                    {expanded[`hist-${f._id}`] && (
                      <div className="payment-history-list">
                        {f.paymentHistory.map((p, i) => (
                          <div key={i} className="payment-history-row">
                            <span style={{ fontWeight: 600, color: '#22c55e' }}>+₹{p.amount.toLocaleString()}</span>
                            <span>{p.method}</span>
                            <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>{new Date(p.paidDate).toLocaleDateString()}</span>
                            {p.note && <span style={{ opacity: 0.6, fontSize: '0.78rem', fontStyle: 'italic' }}>{p.note}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
