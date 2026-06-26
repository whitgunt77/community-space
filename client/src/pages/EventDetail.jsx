import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEvent, useMyRsvp, useRsvpEvent, useCancelRsvp, useDeleteEvent } from '../hooks/useEvents';
import { useAuth } from '../context/AuthContext';
import Map from '../components/Map';

const RSVP_OPTIONS = [
  { status: 'going',      label: 'Going',      emoji: '✓' },
  { status: 'interested', label: 'Interested',  emoji: '👀' },
];

export default function EventDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const { data, isLoading, error } = useEvent(id);
  const { data: myRsvp }           = useMyRsvp(user ? id : null);
  const rsvpMutation               = useRsvpEvent();
  const cancelMutation             = useCancelRsvp();
  const deleteMutation             = useDeleteEvent();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data?.event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-ember font-medium mb-3">Event not found.</p>
        <Link to="/events" className="btn-secondary">Back to Events</Link>
      </div>
    );
  }

  const { event, attendees = [] } = data;
  const date       = new Date(event.date_time);
  const isOrganiser = user?.id === event.organizer_id;
  const isFull     = event.max_attendees && event.rsvp_count >= event.max_attendees;
  const going      = attendees.filter(a => a.status === 'going');

  const handleRsvp = (status) => {
    if (!user) { navigate('/login'); return; }
    if (myRsvp?.status === status) {
      cancelMutation.mutate(id);
    } else {
      rsvpMutation.mutate({ eventId: id, status });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    await deleteMutation.mutateAsync(id);
    navigate('/events');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-up">

      {/* Back */}
      <Link to="/events" className="inline-flex items-center gap-1 text-sm text-night/50 hover:text-night mb-6 transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        All Events
      </Link>

      {/* Header */}
      <div className="mb-6">
        <span className="badge-category mb-3">{event.category}</span>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-night leading-tight text-balance mb-4">
          {event.title}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 text-sm text-night/60">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-forest" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="12" rx="2"/><path d="M5 1v2M11 1v2M2 7h12" strokeLinecap="round"/>
            </svg>
            {date.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-forest" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2" strokeLinecap="round"/>
            </svg>
            {date.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' })}
          </span>
          {event.address && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-forest" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2C5.24 2 3 4.24 3 7c0 4.25 5 9 5 9s5-4.75 5-9c0-2.76-2.24-5-5-5z"/><circle cx="8" cy="7" r="1.5"/>
              </svg>
              {event.address}
            </span>
          )}
        </div>
      </div>

      {/* Map preview */}
      <div className="h-52 rounded-2xl overflow-hidden mb-6 border border-sand-dark shadow-sm">
        <Map
          events={[event]}
          userPosition={null}
          clickEnabled={false}
          className="w-full h-full"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="md:col-span-2 space-y-6">

          {/* Description */}
          {event.description && (
            <div className="card p-5">
              <h2 className="font-display font-semibold text-lg text-night mb-3">About this event</h2>
              <p className="text-sm text-night/75 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Attendees */}
          {going.length > 0 && (
            <div className="card p-5">
              <h2 className="font-display font-semibold text-lg text-night mb-3">
                Attendees
                <span className="ml-2 text-sm font-body font-normal text-night/40">
                  ({going.length}{event.max_attendees ? `/${event.max_attendees}` : ''})
                </span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {going.map(a => (
                  <div key={a.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-sand border border-sand-dark text-sm">
                    <div className="w-5 h-5 rounded-full bg-forest flex items-center justify-center text-sand text-[10px] font-semibold">
                      {a.username[0].toUpperCase()}
                    </div>
                    {a.username}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Stats card */}
          <div className="card p-4 space-y-3">
            <div>
              <p className="label">Organiser</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-7 h-7 rounded-full bg-forest flex items-center justify-center text-sand text-xs font-semibold">
                  {event.organizer_name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-night">{event.organizer_name}</span>
              </div>
            </div>
            <div>
              <p className="label">Capacity</p>
              <p className="text-sm text-night">
                {event.rsvp_count} going
                {event.max_attendees
                  ? ` · ${Math.max(0, event.max_attendees - event.rsvp_count)} spots left`
                  : ' · Unlimited'}
              </p>
              {event.max_attendees && (
                <div className="mt-1.5 h-1.5 rounded-full bg-sand-dark overflow-hidden">
                  <div
                    className="h-full rounded-full bg-forest transition-all"
                    style={{ width: `${Math.min(100, (event.rsvp_count / event.max_attendees) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* RSVP */}
          {!isOrganiser && (
            <div className="card p-4">
              <p className="label mb-3">Your RSVP</p>
              <div className="space-y-2">
                {RSVP_OPTIONS.map(({ status, label, emoji }) => (
                  <button
                    key={status}
                    onClick={() => handleRsvp(status)}
                    disabled={
                      rsvpMutation.isPending || cancelMutation.isPending ||
                      (isFull && status === 'going' && myRsvp?.status !== 'going')
                    }
                    className={`w-full btn justify-center text-sm ${
                      myRsvp?.status === status
                        ? 'bg-forest text-sand'
                        : 'btn-secondary'
                    } disabled:opacity-40`}
                  >
                    {emoji} {myRsvp?.status === status ? `${label} ✓` : label}
                  </button>
                ))}
              </div>
              {isFull && myRsvp?.status !== 'going' && (
                <p className="text-xs text-ember mt-2 text-center">Event is at capacity.</p>
              )}
              {!user && (
                <p className="text-xs text-night/50 mt-2 text-center">
                  <Link to="/login" className="text-forest underline">Sign in</Link> to RSVP
                </p>
              )}
            </div>
          )}

          {/* Organiser controls */}
          {isOrganiser && (
            <div className="card p-4 space-y-2">
              <p className="label mb-2">Manage Event</p>
              <Link to={`/events/${id}/edit`} className="btn-secondary w-full justify-center text-sm">
                Edit Event
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="btn-ember w-full justify-center text-sm"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete Event'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}