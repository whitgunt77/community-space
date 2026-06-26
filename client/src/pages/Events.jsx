import { useState } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all','general','sports','music','food','art','tech','outdoors','social'];

export default function EventsPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState('all');
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const filters = {
    ...(category !== 'all' ? { category } : {}),
    ...(from ? { from: new Date(from).toISOString() } : {}),
    ...(to   ? { to:   new Date(to).toISOString()   } : {}),
  };

  const { data: events = [], isLoading, isError } = useEvents(filters);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-up">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-night">Upcoming Events</h1>
          <p className="text-sm text-night/50 mt-1">Discover what's happening in your community</p>
        </div>
        {user && (
          <Link to="/events/new" className="btn-primary text-sm">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 2v12M2 8h12" strokeLinecap="round"/>
            </svg>
            New Event
          </Link>
        )}
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-6 space-y-3">
        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                category === c
                  ? 'bg-forest text-sand shadow-sm'
                  : 'bg-sand text-night/60 border border-sand-dark hover:border-forest/40'
              }`}
            >
              {c === 'all' ? 'All categories' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">From</label>
            <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="label">To</label>
            <input type="date" className="input" value={to}   onChange={e => setTo(e.target.value)}   />
          </div>
          {(from || to) && (
            <button
              onClick={() => { setFrom(''); setTo(''); }}
              className="btn-ghost self-end text-xs px-2 py-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex gap-3">
              <div className="w-12 h-14 bg-sand-dark rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-sand-dark rounded w-1/4" />
                <div className="h-4 bg-sand-dark rounded w-2/3" />
                <div className="h-3 bg-sand-dark rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-16">
          <p className="text-ember font-medium">Failed to load events.</p>
          <p className="text-sm text-night/50 mt-1">Please check your connection and try again.</p>
        </div>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">🌱</p>
          <p className="font-display font-semibold text-xl text-night">No events yet</p>
          <p className="text-sm text-night/50 mt-2">
            {user
              ? 'Be the first – create an event from the map or the button above.'
              : 'Sign in to create the first community event.'}
          </p>
          {!user && (
            <Link to="/register" className="btn-primary mt-4 inline-flex">Get started</Link>
          )}
        </div>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className="space-y-3">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onClick={(e) => setSelectedId(e.id)}
            />
          ))}
        </div>
      )}

      {selectedId && (
        <EventModal eventId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}