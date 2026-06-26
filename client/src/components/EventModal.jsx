import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEvent, useMyRsvp, useRsvpEvent, useCancelRsvp, useDeleteEvent } from '../hooks/useEvents';
import { useAuth } from '../context/AuthContext';

const RSVP_LABELS = { going: 'Going ✓', interested: 'Interested', not_going: 'Not going' };

export default function EventModal({ eventId, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error } = useEvent(eventId);
  const { data: myRsvp }           = useMyRsvp(user ? eventId : null);
  const rsvpMutation               = useRsvpEvent();
  const cancelMutation             = useCancelRsvp();
  const deleteMutation             = useDeleteEvent();

  // Trap scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleRsvp = (status) => {
    if (!user) { navigate('/login'); return; }
    if (myRsvp?.status === status) {
      cancelMutation.mutate(eventId);
    } else {
      rsvpMutation.mutate({ eventId, status });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    await deleteMutation.mutateAsync(eventId);
    onClose();
  };

  const event     = data?.event;
  const attendees = data?.attendees || [];
  const isOrganiser = user && event && user.id === event.organizer_id;
  const date        = event ? new Date(event.date_time) : null;
  const isFull      = event?.max_attendees && event.rsvp_count >= event.max_attendees;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                 bg-night/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg bg-sand rounded-t-3xl sm:rounded-2xl
                      shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin
                      animate-slide-in sm:animate-fade-up">

        {/* Header bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between
                        px-5 py-4 bg-sand/95 backdrop-blur border-b border-sand-dark">
          <div className="h-1 w-10 rounded-full bg-sand-dark block sm:hidden mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
          <h2 className="font-display font-semibold text-night text-lg">Event Details</h2>
          <button onClick={onClose} className="btn-icon btn-ghost p-1.5 -mr-1">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-4">
          {isLoading && (
            <div className="flex flex-col gap-3 py-8 items-center">
              <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin"/>
              <p className="text-sm text-night/50">Loading event…</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-ember text-center py-8">Failed to load event. Please try again.</p>
          )}

          {event && (
            <>
              {/* Category + title */}
              <div className="mb-4">
                <span className="badge-category mb-2">{event.category}</span>
                <h3 className="font-display font-bold text-2xl text-night leading-tight text-balance">
                  {event.title}
                </h3>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="card p-3">
                  <p className="label">Date & Time</p>
                  <p className="text-sm font-medium text-night">
                    {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-night/60">
                    {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="card p-3">
                  <p className="label">Attendees</p>
                  <p className="text-sm font-medium text-night">
                    {event.rsvp_count} going
                  </p>
                  <p className="text-xs text-night/60">
                    {event.max_attendees ? `${event.max_attendees - event.rsvp_count} spots left` : 'Unlimited'}
                  </p>
                </div>
              </div>

              {/* Address */}
              {event.address && (
                <div className="flex items-start gap-2 mb-4 text-sm text-night/70">
                  <svg className="w-4 h-4 mt-0.5 text-forest flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 2C5.24 2 3 4.24 3 7c0 4.25 5 9 5 9s5-4.75 5-9c0-2.76-2.24-5-5-5z"/><circle cx="8" cy="7" r="1.5"/>
                  </svg>
                  <span>{event.address}</span>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="mb-5">
                  <p className="label">About</p>
                  <p className="text-sm text-night/75 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Organiser */}
              <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-forest/5 border border-forest/10">
                <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center text-sand text-sm font-semibold">
                  {event.organizer_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-night/50">Organised by</p>
                  <p className="text-sm font-medium text-night">{event.organizer_name}</p>
                </div>
              </div>

              {/* RSVP buttons */}
              {!isOrganiser && (
                <div className="mb-5">
                  <p className="label mb-2">Your RSVP</p>
                  <div className="flex gap-2">
                    {['going', 'interested'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleRsvp(status)}
                        disabled={rsvpMutation.isPending || cancelMutation.isPending || (isFull && status === 'going' && myRsvp?.status !== 'going')}
                        className={`flex-1 btn text-sm py-2 justify-center transition-all ${
                          myRsvp?.status === status
                            ? 'bg-forest text-sand shadow-sm'
                            : 'btn-secondary'
                        } disabled:opacity-40`}
                      >
                        {myRsvp?.status === status ? RSVP_LABELS[status] : status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                  {isFull && myRsvp?.status !== 'going' && (
                    <p className="text-xs text-ember mt-2 text-center">This event is at capacity.</p>
                  )}
                </div>
              )}

              {/* Attendees preview */}
              {attendees.length > 0 && (
                <div className="mb-5">
                  <p className="label mb-2">Going ({attendees.filter(a => a.status === 'going').length})</p>
                  <div className="flex -space-x-2">
                    {attendees.filter(a => a.status === 'going').slice(0, 8).map((a) => (
                      <div key={a.id}
                           title={a.username}
                           className="w-8 h-8 rounded-full bg-forest/20 border-2 border-sand
                                      flex items-center justify-center text-xs font-semibold text-forest">
                        {a.username[0].toUpperCase()}
                      </div>
                    ))}
                    {attendees.filter(a => a.status === 'going').length > 8 && (
                      <div className="w-8 h-8 rounded-full bg-sand-dark border-2 border-sand
                                      flex items-center justify-center text-xs text-night/50">
                        +{attendees.filter(a => a.status === 'going').length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Organiser actions */}
              {isOrganiser && (
                <div className="flex gap-2 pt-3 border-t border-sand-dark">
                  <Link
                    to={`/events/${event.id}/edit`}
                    onClick={onClose}
                    className="btn-secondary flex-1 justify-center text-sm"
                  >
                    Edit Event
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="btn-ember flex-1 justify-center text-sm"
                  >
                    {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}