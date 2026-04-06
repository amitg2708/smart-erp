import { useState, useEffect } from 'react';
import { MdUploadFile, MdDelete, MdDownload, MdCloudUpload, MdDescription } from 'react-icons/md';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const categoryColors = { identity: '#3b82f6', academic: '#8b5cf6', financial: '#f59e0b', medical: '#ef4444', other: '#6b7280' };
const categoryIcons = { identity: '🪪', academic: '🎓', financial: '💳', medical: '🏥', other: '📄' };

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'other' });
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try { const { data } = await API.get('/documents/my'); setDocs(data); }
    catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    if (!form.title) return toast.error('Please add a title');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', form.title);
      fd.append('category', form.category);
      await API.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded!');
      setFile(null);
      setForm({ title: '', category: 'other' });
      fetchDocs();
    } catch (e) { toast.error(e.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try { await API.delete(`/documents/${id}`); toast.success('Deleted'); setDocs(d => d.filter(doc => doc._id !== id)); }
    catch { toast.error('Failed to delete'); }
  };

  const formatSize = (bytes) => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><MdUploadFile /> My Documents</h1>
        <p className="page-subtitle">Upload and manage your academic documents</p>
      </div>

      <div className="card">
        <h3 className="card-title">Upload New Document</h3>
        <form onSubmit={handleUpload}>
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
            onClick={() => document.getElementById('doc-file-input').click()}
          >
            <input id="doc-file-input" type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.txt"
              onChange={e => setFile(e.target.files[0])} />
            {file ? (
              <div className="file-selected">
                <MdDescription size={32} />
                <p><strong>{file.name}</strong></p>
                <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>{formatSize(file.size)}</p>
              </div>
            ) : (
              <div className="drop-placeholder">
                <MdCloudUpload size={40} />
                <p><strong>Drop file here</strong> or click to browse</p>
                <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>PDF, DOC, DOCX, JPG, PNG, XLS (max 5MB)</p>
              </div>
            )}
          </div>

          <div className="form-grid-2" style={{ marginTop: '1rem' }}>
            <div>
              <label className="form-label">Document Title *</label>
              <input className="form-input" placeholder="e.g. Marksheet Semester 3" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {Object.entries(categoryIcons).map(([k, icon]) => (
                  <option key={k} value={k}>{icon} {k.charAt(0).toUpperCase() + k.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading} style={{ marginTop: '1rem' }}>
            <MdCloudUpload /> {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="card-title">My Documents ({docs.length})</h3>
        {loading ? <div className="spinner-wrapper"><div className="spinner" /></div> :
          docs.length === 0 ? (
            <div className="empty-state"><MdUploadFile size={48} /><p>No documents uploaded yet</p></div>
          ) : (
            <div className="docs-grid">
              {docs.map(doc => (
                <div key={doc._id} className="doc-card">
                  <div className="doc-icon" style={{ background: categoryColors[doc.category] + '20', color: categoryColors[doc.category] }}>
                    {categoryIcons[doc.category]} 
                  </div>
                  <div className="doc-info">
                    <h4 className="doc-title">{doc.title}</h4>
                    <p className="doc-meta">
                      <span style={{ background: categoryColors[doc.category] + '20', color: categoryColors[doc.category], padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                        {doc.category}
                      </span>
                      {doc.fileSize && <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>{formatSize(doc.fileSize)}</span>}
                    </p>
                    <p style={{ opacity: 0.5, fontSize: '0.78rem', margin: 0 }}>{new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="doc-actions">
                    <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="icon-btn" title="Download">
                      <MdDownload />
                    </a>
                    <button className="icon-btn danger" onClick={() => handleDelete(doc._id)} title="Delete"><MdDelete /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
