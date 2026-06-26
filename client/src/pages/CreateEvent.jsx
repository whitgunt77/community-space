import { useNavigate } from 'react-router-dom';
import CreateEventForm from '../components/CreateEventForm';
import { useAuth } from '../context/AuthContext';

export default function CreateEvent() {
  const navigate    = useNavigate();
  const { user }    = useAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-night">Create an Event</h1>
        <p className="text-sm text-night/50 mt-1">
          Fill in the details below. You can also click any spot on the{' '}
          <button onClick={() => navigate('/')} className="text-forest underline underline-offset-2">
            map
          </button>{' '}
          to auto-fill the coordinates.
        </p>
      </div>

      <div className="card p-6">
        <CreateEventForm
          onSuccess={(event) => navigate(`/events/${event.id}`)}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}