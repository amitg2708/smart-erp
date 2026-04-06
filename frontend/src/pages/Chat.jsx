import { useState, useEffect, useRef } from 'react';
import { MdChatBubble, MdSend, MdSearch } from 'react-icons/md';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const roleColor = { admin: '#8b5cf6', faculty: '#3b82f6', student: '#10b981' };

export default function Chat() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    API.get('/messages/contacts').then(({ data }) => setContacts(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    const fetch = () => API.get(`/messages/thread/${selected._id}`).then(({ data }) => setThread(data)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selected) return;
    setSending(true);
    try {
      const { data } = await API.post('/messages', { recipientId: selected._id, content: message.trim() });
      setThread(t => [...t, data]);
      setMessage('');
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));
  const initials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="page-container" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header"><h1 className="page-title"><MdChatBubble /> Messages</h1></div>

      <div className="chat-layout card" style={{ flex: 1, overflow: 'hidden', padding: 0, display: 'flex' }}>
        {/* Contacts sidebar */}
        <div className="chat-sidebar">
          <div className="chat-search">
            <MdSearch />
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="contacts-list">
            {filteredContacts.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem', fontSize: '0.9rem' }}>No users found</div>
            ) : filteredContacts.map(c => (
              <div key={c._id} className={`contact-item ${selected?._id === c._id ? 'active' : ''}`} onClick={() => setSelected(c)}>
                <div className="contact-avatar" style={{ background: roleColor[c.role] }}>{initials(c.name)}</div>
                <div className="contact-info">
                  <p className="contact-name">{c.name}</p>
                  <p className="contact-role">{c.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thread area */}
        <div className="chat-thread">
          {!selected ? (
            <div className="chat-placeholder">
              <MdChatBubble size={64} />
              <h3>Select a conversation</h3>
              <p>Choose a contact from the left to start chatting</p>
            </div>
          ) : (
            <>
              <div className="thread-header">
                <div className="contact-avatar" style={{ background: roleColor[selected.role], width: 36, height: 36 }}>{initials(selected.name)}</div>
                <div>
                  <p style={{ fontWeight: 700, margin: 0 }}>{selected.name}</p>
                  <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem' }}>{selected.role} · {selected.email}</p>
                </div>
              </div>

              <div className="messages-list">
                {thread.length === 0 && (
                  <div className="chat-placeholder" style={{ padding: '2rem' }}>
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                )}
                {thread.map(msg => {
                  const isOwn = msg.senderId === user._id || msg.senderId?._id === user._id;
                  return (
                    <div key={msg._id} className={`message-bubble-wrap ${isOwn ? 'own' : 'other'}`}>
                      <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                        <p>{msg.content}</p>
                        <time>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="message-input-row">
                <input
                  className="message-input"
                  placeholder={`Message ${selected.name}...`}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
                />
                <button type="submit" className="send-btn" disabled={sending || !message.trim()}>
                  <MdSend />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
