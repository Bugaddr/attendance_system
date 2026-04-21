import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentAttendance from './pages/StudentAttendance';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teacher" element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          <Route path="/attend/:sessionId" element={<StudentAttendance />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
