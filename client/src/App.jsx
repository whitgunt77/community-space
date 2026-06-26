import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar       from './components/Navbar';
import Home         from './pages/Home';
import EventsPage   from './pages/Events';
import EventDetail  from './pages/EventDetail';
import CreateEvent  from './pages/CreateEvent';
import EditEvent    from './pages/EditEvent';
import Profile      from './pages/Profile';
import Login        from './pages/Login';
import Register     from './pages/Register';

/** Redirect to /login if not authenticated */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen grain">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/events"         element={<EventsPage />} />
          <Route path="/events/new"     element={<PrivateRoute><CreateEvent /></PrivateRoute>} />
          <Route path="/events/:id"     element={<EventDetail />} />
          <Route path="/events/:id/edit" element={<PrivateRoute><EditEvent /></PrivateRoute>} />
          <Route path="/profile"        element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}