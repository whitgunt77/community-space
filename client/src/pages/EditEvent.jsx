import { useParams, useNavigate } from 'react-router-dom';
import CreateEventForm from '../components/CreateEventForm';
import { useEvent } from '../hooks/useEvents';
import { useAuth } from '../context/AuthContext';

export default function EditEvent() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const { data, isLoading, error } = useEvent(id);
  const event = data?.event;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-ember font-medium">Event not found.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go back</button>
      </div>
    );
  }

  if (!user || user.id !== event.organizer_id) {
    navigate('/');
    return null;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-night">Edit Event</h1>
        <p className="text-sm text-night/50 mt-1">Update your event details below.</p>
      </div>

      <div className="card p-6">
        <CreateEventForm
          existingEvent={event}
          onSuccess={() => navigate(`/events/${id}`)}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}