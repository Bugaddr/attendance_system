import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, CheckCircle2, MapPin, Shield, User, Hash } from 'lucide-react';

export default function StudentAttendance() {
  const { sessionId } = useParams();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');

  const [location, setLocation] = useState(null);
  const [photoData, setPhotoData] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const requestPermissions = async () => {
    setError('');
    setLoading(true);
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;

      setStep(3);
    } catch (err) {
      console.error(err);
      setError('You must grant both Camera and Location permissions to mark attendance.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (step === 3 && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [step]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPhotoData(dataUrl);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setStep(4);
  };

  const retakePhoto = async () => {
    setPhotoData(null);
    setStep(2);
  };

  const submitAttendance = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          name,
          studentId,
          photoData,
          studentLat: location.lat,
          studentLng: location.lng
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStep(5);
      } else {
        setError(data.error || 'Failed to submit attendance');
      }
    } catch (err) {
      console.error(err);
      setError('Network error occurred. Please try again.');
    }
    setLoading(false);
  };

  const stepDots = (
    <div className="step-indicator">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`step-dot ${step === i ? 'active' : ''} ${step > i ? 'completed' : ''}`} />
      ))}
    </div>
  );

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '1rem' }}>

      <div className="glass-panel w-full" style={{ maxWidth: '440px', padding: '2rem' }}>
        {stepDots}

        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <div style={{
                display: 'inline-flex', padding: '0.75rem',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: 'var(--radius-full)',
                marginBottom: '1rem',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}>
                <User size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <h2 style={{ marginBottom: '0.375rem' }}>Student Check-In</h2>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                Enter your details to mark attendance
              </p>
            </div>
            <form onSubmit={handleDetailsSubmit}>
              <div className="input-group">
                <User size={18} className="input-icon" />
                <input type="text" placeholder="Full Name" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <Hash size={18} className="input-icon" />
                <input type="text" placeholder="Student ID (e.g., 2026CS101)" className="input-field" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
              </div>
              <button type="submit" className="btn w-full btn-pill" style={{ padding: '0.875rem', marginTop: '0.5rem' }}>Continue</button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <div style={{
              display: 'inline-flex', padding: '0.75rem',
              background: 'var(--success-glow)',
              borderRadius: 'var(--radius-full)',
              marginBottom: '1rem',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <Shield size={28} style={{ color: 'var(--success)' }} />
            </div>
            <h2 style={{ marginBottom: '0.375rem' }}>Verify Your Presence</h2>
            <p className="text-muted mb-6" style={{ fontSize: '0.875rem' }}>
              We need camera and location access to verify you are in the classroom.
            </p>
            {error && <div className="alert-error">{error}</div>}

            <div className="flex-col gap-3 mb-4" style={{ textAlign: 'left' }}>
              <div className="flex items-center gap-3" style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <MapPin size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>GPS location to confirm classroom proximity</span>
              </div>
              <div className="flex items-center gap-3" style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <Camera size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Camera to capture a live identity photo</span>
              </div>
            </div>

            <button className="btn btn-success w-full btn-pill" onClick={requestPermissions} disabled={loading}
              style={{ padding: '0.875rem' }}>
              {loading ? 'Requesting...' : 'Grant Permissions & Continue'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h2 style={{ marginBottom: '0.375rem' }}>Capture Selfie</h2>
            <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>Take a clear photo of your face</p>
            <div style={{
              width: '100%', borderRadius: 'var(--radius-md)',
              overflow: 'hidden', backgroundColor: '#000', marginBottom: '1rem',
              border: '1px solid var(--border-default)'
            }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <button className="btn w-full btn-pill" onClick={capturePhoto} style={{ padding: '0.875rem' }}>
              <Camera size={18} /> Take Photo
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <h2 style={{ marginBottom: '0.375rem' }}>Confirm & Submit</h2>
            <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>Review your photo before submitting</p>
            <img src={photoData} alt="Captured" style={{
              width: '100px', height: '100px',
              borderRadius: 'var(--radius-full)',
              objectFit: 'cover',
              margin: '0 auto 1.25rem',
              display: 'block',
              border: '3px solid var(--primary)',
              boxShadow: '0 0 20px var(--primary-glow)'
            }} />

            {error && <div className="alert-error">{error}</div>}

            <form onSubmit={submitAttendance}>
              <div className="flex gap-3 w-full">
                <button type="button" className="btn btn-ghost btn-pill" onClick={retakePhoto} style={{ flex: 1, padding: '0.75rem' }}>
                  Retake
                </button>
                <button type="submit" className="btn btn-success btn-pill" disabled={loading} style={{ flex: 2, padding: '0.75rem' }}>
                  {loading ? 'Submitting...' : 'Submit Attendance'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 5 && (
          <div className="text-center" style={{ padding: '1rem 0' }}>
            <div style={{
              display: 'inline-flex', padding: '1rem',
              background: 'var(--success-glow)',
              borderRadius: 'var(--radius-full)',
              marginBottom: '1.25rem',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <CheckCircle2 size={40} style={{ color: 'var(--success)' }} />
            </div>
            <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Attendance Marked!</h2>
            <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
              Your attendance has been recorded successfully. You can now close this tab.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
