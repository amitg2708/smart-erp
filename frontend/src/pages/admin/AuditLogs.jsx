import { useState, useEffect } from 'react';
import { MdSecurity, MdSearch, MdRefresh } from 'react-icons/md';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const ACTION_COLORS = { CREATE: '#22c55e', UPDATE: '#3b82f6', DELETE: '#ef4444' };

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ entity: '', action: '', from: '', to: '' });

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 30, ...filters });
      const { data } = await API.get(`/auditlogs?${params}`);
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (e) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchLogs(1); };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><MdSecurity /> Audit Logs</h1>
        <p className="page-subtitle">Track all system actions and changes</p>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="filter-row">
          <input className="form-input" placeholder="Entity (Fee, User...)" value={filters.entity}
            onChange={e => setFilters(f => ({ ...f, entity: e.target.value }))} />
          <select className="form-input" value={filters.action}
            onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input type="date" className="form-input" value={filters.from}
            onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} placeholder="From" />
          <input type="date" className="form-input" value={filters.to}
            onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} placeholder="To" />
          <button type="submit" className="btn btn-primary"><MdSearch /> Search</button>
          <button type="button" className="btn btn-secondary" onClick={() => { setFilters({ entity: '', action: '', from: '', to: '' }); fetchLogs(1); }}>
            <MdRefresh /> Reset
          </button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="spinner-wrapper"><div className="spinner" /></div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Method</th>
                    <th>Path</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No audit logs found</td></tr>
                  ) : logs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{log.userId?.name || log.userEmail || 'N/A'}</td>
                      <td><span className={`role-badge role-${log.userRole}`}>{log.userRole}</span></td>
                      <td>
                        <span className="action-badge" style={{ background: ACTION_COLORS[log.action] || '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.entity}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.method}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.path}</td>
                      <td style={{ fontSize: '0.78rem', opacity: 0.7 }}>{log.ip || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-secondary" disabled={page === 1} onClick={() => fetchLogs(page - 1)}>Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => fetchLogs(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
