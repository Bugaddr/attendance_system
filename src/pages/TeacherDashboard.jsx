import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, QrCode, Users, CheckCircle2, Copy, LogOut, Clock, Download, Plus, ArrowLeft, Eye, Trash2, Navigation } from 'lucide-react';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({ click(e) { setPosition(e.latlng); } });
  useEffect(() => {
    if (position) map.flyTo(position, 16);
  }, [position, map]);
  return position === null ? null : <Marker position={position}></Marker>;
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth();

  const [history, setHistory] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const [position, setPosition] = useState(null);
  const [session, setSession] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pastSession, setPastSession] = useState(null);
  const [pastAttendances, setPastAttendances] = useState([]);

  const [time, setTime] = useState(new Date());
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) setHistory(await res.json());
    } catch (err) { console.error(err); }
  };

  const stopSession = async (id) => {
    if (!confirm("End this session? Students will no longer be able to check in.")) return;
    try {
      await fetch('/api/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id })
      });
      fetchHistory();
    } catch (err) { console.error(err); alert("Failed to stop session"); }
  };

  useEffect(() => { fetchHistory(); }, []);

  const useCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        console.error(err);
        alert("Failed to get current location. Please ensure location permissions are granted.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const startSession = async () => {
    if (!position) return alert("Please select a location on the map first.");
    setLoading(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: position.lat, lng: position.lng })
      });
      const data = await res.json();
      if (res.ok) { setSession(data); setIsCreating(false); }
      else alert(data.error);
    } catch (err) { console.error(err); alert("Failed to start session."); }
    setLoading(false);
  };

  const endSession = async () => {
    if (!confirm("End this session? Students will no longer be able to join.")) return;
    setLoading(true);
    try {
      const res = await fetch('/api/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id })
      });
      if (!res.ok) {
        throw new Error('Failed to end session server-side');
      }
      setSession(null); setAttendances([]); setPosition(null);
      fetchHistory();
    } catch (err) { console.error(err); alert("Failed to end session."); }
    setLoading(false);
  };

  const viewPastSession = async (sessionData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?sessionId=${sessionData.id}`);
      if (res.ok) { setPastAttendances(await res.json()); setPastSession(sessionData); }
    } catch (err) { console.error(err); alert("Failed to load session details."); }
    setLoading(false);
  };

  const deleteSession = async (sessionId) => {
    if (!confirm("Are you sure you want to permanently delete this session and all its attendance records?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/session?sessionId=${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setPastSession(null);
        fetchHistory();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete session.");
      }
    } catch (err) { console.error(err); alert("Failed to delete session."); }
    setLoading(false);
  };

  const fetchAttendances = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/attendance?sessionId=${session.id}`);
      if (res.ok) setAttendances(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (session) {
      fetchAttendances();
      const interval = setInterval(fetchAttendances, 3000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const joinUrl = session ? `${window.location.origin}/attend/${session.id}` : '';

  /* ──────────── PAST SESSION VIEW ──────────── */
  if (pastSession) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="page-header">
          <div>
            <h1>Session Details</h1>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              {new Date(pastSession.createdAt).toLocaleString()} · <span style={{ fontFamily: 'monospace' }}>{pastSession.id}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-danger" onClick={() => deleteSession(pastSession.id)}>
              <Trash2 size={16} /> Delete Session
            </button>
            <button className="btn btn-ghost" onClick={() => setPastSession(null)}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="flex items-center gap-2" style={{ marginBottom: '1.25rem' }}>
            <Users size={20} /> Attendees ({pastAttendances.length})
          </h2>

          {pastAttendances.length === 0 ? (
            <div className="empty-state">
              <p>No students attended this session.</p>
            </div>
          ) : (
            <div>
              {pastAttendances.map(record => (
                <div key={record.id} className="attendee-row">
                  <div className="flex items-center gap-3">
                    {record.photoData && <img src={record.photoData} alt="" className="attendee-avatar" />}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{record.studentName}</div>
                      <div className="text-muted" style={{ fontSize: '0.8125rem' }}>ID: {record.studentId}</div>
                    </div>
                  </div>
                  <span className="badge badge-success">
                    <CheckCircle2 size={12} /> {Math.round(record.distanceMeters)}m
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ──────────── ADMIN HUB ──────────── */
  if (!session && !isCreating) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="page-header">
          <div>
            <h1>Admin Hub</h1>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-success" onClick={() => setIsCreating(true)}>
              <Plus size={16} /> New Session
            </button>
            <button className="btn btn-ghost" onClick={logout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="flex items-center gap-2" style={{ marginBottom: '1.25rem' }}>
            <Clock size={20} /> Session History
          </h2>
          {history.length === 0 ? (
            <div className="empty-state">
              <p>No sessions yet. Create one to get started!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Attendees</th>
                    <th>Code</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(s => (
                    <tr key={s.id}>
                      <td>{new Date(s.createdAt).toLocaleDateString()} <span className="text-muted" style={{ fontSize: '0.8125rem' }}>{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                      <td>
                        {s.endedAt ? (
                          <span className="badge badge-muted">Completed</span>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <span className="badge badge-success">Active</span>
                            <button className="btn btn-danger" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }} onClick={() => stopSession(s.id)}>
                              Stop
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.attendeeCount}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.id}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex gap-2 justify-end">
                          <button className="btn btn-ghost" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }} onClick={() => viewPastSession(s)}>
                            <Eye size={14} /> View
                          </button>
                          <button className="btn btn-ghost" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', color: 'var(--danger)' }} onClick={() => deleteSession(s.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ──────────── MAP SELECTION ──────────── */
  if (isCreating) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <div className="glass-panel w-full" style={{ maxWidth: '720px' }}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div style={{
                display: 'inline-flex', padding: '0.5rem',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}>
                <MapPin size={22} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>Select Classroom Location</h2>
                <p className="text-muted" style={{ fontSize: '0.8125rem', margin: 0 }}>Click on the map or use GPS</p>
              </div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: '0.8125rem' }} onClick={useCurrentLocation} disabled={loading}>
              <Navigation size={14} /> Use My Location
            </button>
          </div>
          <div style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.25rem' }}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>
          <div className="flex justify-between items-center">
            <button className="btn btn-ghost" onClick={() => setIsCreating(false)}>
              <ArrowLeft size={16} /> Cancel
            </button>
            <div className="flex gap-3 items-center">
              {position && <span className="badge badge-success"><MapPin size={12} /> Location set</span>}
              <button className="btn btn-success btn-pill" onClick={startSession} disabled={!position || loading}
                style={{ padding: '0.625rem 1.5rem' }}>
                {loading ? 'Starting...' : 'Start Session'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────── ACTIVE SESSION (Split Layout) ──────────── */
  return (
    <div className="meet-container">
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: QR Code Panel */}
        <div style={{
          width: '380px', minWidth: '320px', flexShrink: 0,
          borderRight: '1px solid var(--border-default)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', background: 'var(--bg-surface)'
        }}>
          <div style={{
            display: 'inline-flex', padding: '0.625rem',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: 'var(--radius-full)',
            marginBottom: '1rem',
            border: '1px solid rgba(99, 102, 241, 0.15)'
          }}>
            <QrCode size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 className="text-center" style={{ marginBottom: '0.25rem', fontSize: '1.25rem' }}>Session QR Code</h2>
          <p className="text-muted text-center mb-6" style={{ fontSize: '0.8125rem' }}>
            Display this to your class
          </p>
          <div style={{
            background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)',
            display: 'inline-block', marginBottom: '1.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <QRCodeSVG value={joinUrl} size={220} />
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 800,
            letterSpacing: '0.1em', color: 'var(--primary)', marginBottom: '0.5rem'
          }}>
            {session.id}
          </div>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>Session Code</p>
        </div>

        {/* RIGHT: Live Attendance */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--bg-surface)'
          }}>
            <h2 className="flex items-center gap-2" style={{ margin: 0, fontSize: '1.125rem' }}>
              <Users size={18} /> Live Attendance
              <span className="badge badge-success" style={{ marginLeft: '0.25rem' }}>{attendances.length}</span>
            </h2>
            <button className="btn btn-danger btn-pill" onClick={endSession} disabled={loading}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              <LogOut size={14} /> End Session
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
            {attendances.length === 0 ? (
              <div className="empty-state" style={{ padding: '4rem 1rem' }}>
                <div style={{
                  display: 'inline-flex', padding: '1rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-full)',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-default)'
                }}>
                  <Users size={32} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Waiting for students...
                </p>
                <p style={{ fontSize: '0.8125rem' }}>Students will appear here as they scan the QR code</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {attendances.map(record => (
                  <div key={record.id} className="attendee-card">
                    {record.photoData && <img src={record.photoData} alt="" className="attendee-card-photo" />}
                    <div style={{ padding: '0.625rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.studentName}</div>
                      <div className="text-muted" style={{ fontSize: '0.6875rem', marginBottom: '0.375rem' }}>
                        {record.studentId}
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem' }}>
                        <CheckCircle2 size={10} /> {Math.round(record.distanceMeters)}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="meet-bottom-bar">
        <div className="meet-info flex items-center gap-4">
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span style={{ color: 'var(--border-default)' }}>|</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)' }}>{session.id}</span>
          <span style={{ color: 'var(--border-default)' }}>|</span>
          <span className="text-muted flex items-center gap-1"><Users size={14} /> {attendances.length} joined</span>
        </div>

        <div className="flex gap-2 items-center" style={{ flex: 1, maxWidth: '500px', margin: '0 1.5rem' }}>
          <input type="text" readOnly value={joinUrl} className="input-field"
            style={{ marginBottom: 0, fontSize: '0.8125rem', fontFamily: 'monospace' }} />
          <button className="btn btn-icon" onClick={() => navigator.clipboard.writeText(joinUrl)} title="Copy Link">
            <Copy size={16} />
          </button>
        </div>

        <div className="flex gap-3">
          <button className="btn btn-danger btn-pill" onClick={endSession} disabled={loading}
            style={{ padding: '0.625rem 1.25rem' }}>
            <LogOut size={16} /> End Session
          </button>
        </div>
      </div>
    </div>
  );
}

