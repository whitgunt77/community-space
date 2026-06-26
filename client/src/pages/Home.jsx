import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from '../components/Map';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import CreateEventForm from '../components/CreateEventForm';
import { useEvents } from '../hooks/useEvents';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all','general','sports','music','food','art','tech','outdoors','social'];

export default function Home() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const { position } = useGeolocation();

  // Filters
  const [category,   setCategory]   = useState('all');
  const [useProximity, setUseProximity] = useState(false);
  const [radius,     setRadius]     = useState(25);

  // UI state
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [createCoords,    setCreateCoords]    = useState(null); // { lat, lng }
  const [sidebarTab,      setSidebarTab]      = useState('list'); // 'list' | 'filters'

  const filters = {
    ...(category !== 'all' ? { category } : {}),
    ...(useProximity && position
      ? { lat: position.lat, lng: position.lng, radius }
      : {}),
  };

  const { data: events = [], isLoading, isError } = useEvents(filters);

  const handleMapClick = useCallback((latlng) => {
    if (!user) { navigate('/login'); return; }
    setCreateCoords({ lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) });
  }, [user, navigate]);

  const handleEventClick = useCallback((event) => {
    setSelectedEventId(event.id);
  }, []);

  const handleCreateSuccess = () => {
    setCreateCoords(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-7rem)] overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-80 lg:w-96 flex flex-col border-r border-sand-dark
                        bg-sand/60 backdrop-blur-sm overflow-hidden flex-shrink-0
                        order-2 md:order-1 max-h-[40vh] md:max-h-none">

        {/* Sidebar header */}
        <div className="px-4 pt-4 pb-3 border-b border-sand-dark">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display font-bold text-xl text-night">
              Events
              <span className="ml-2 text-sm font-body font-normal text-night/40">
                {isLoading ? '…' : `(${events.length})`}
              </span>
            </h1>
            <div className="flex rounded-lg overflow-hidden border border-sand-dark">
              {(['list','filters']).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    sidebarTab === tab
                      ? 'bg-forest text-sand'
                      : 'bg-white/60 text-night/60 hover:bg-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  category === c
                    ? 'bg-forest text-sand shadow-sm'
                    : 'bg-white/70 text-night/60 border border-sand-dark hover:border-forest/40'
                }`}
              >
                {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Filters pane */}
        {sidebarTab === 'filters' && (
          <div className="px-4 py-3 border-b border-sand-dark animate-fade-in space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setUseProximity(p => !p)}
                className={`relative w-9 h-5 rounded-full transition-colors ${useProximity ? 'bg-forest' : 'bg-sand-dark'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${useProximity ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm text-night/70">Near me</span>
            </label>

            {useProximity && (
              <div>
                <label className="label">Radius: {radius} km</label>
                <input
                  type="range" min="1" max="100" value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  className="w-full accent-forest"
                />
              </div>
            )}
          </div>
        )}

        {/* Hint bar */}
        {!createCoords && (
          <div className="px-4 py-2 bg-forest/5 border-b border-forest/10">
            <p className="text-xs text-forest/70">
              {user
                ? '🗺️ Click anywhere on the map to create an event'
                : '🗺️ Sign in to create events by clicking the map'}
            </p>
          </div>
        )}

        {/* Event list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-2">
          {isLoading && (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-14 bg-sand-dark rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-sand-dark rounded w-1/3" />
                    <div className="h-4 bg-sand-dark rounded w-3/4" />
                    <div className="h-3 bg-sand-dark rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          )}

          {!isLoading && isError && (
            <div className="text-center py-8">
              <p className="text-sm text-ember">Failed to load events.</p>
            </div>
          )}

          {!isLoading && !isError && events.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-3xl mb-2">🌱</p>
              <p className="text-sm font-medium text-night/60">No events found.</p>
              <p className="text-xs text-night/40 mt-1">
                {user ? 'Click on the map to create one!' : 'Sign in to create the first one.'}
              </p>
            </div>
          )}

          {!isLoading && events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              compact
              onClick={handleEventClick}
            />
          ))}
        </div>
      </aside>

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative order-1 md:order-2 min-h-[55vw] md:min-h-0">
        <Map
          events={events}
          userPosition={position}
          onMapClick={handleMapClick}
          onEventClick={handleEventClick}
          flyToUser
          className="w-full h-full"
        />

        {/* Create event overlay */}
        {createCoords && (
          <div className="absolute inset-0 bg-night/20 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4 z-40 animate-fade-in">
            <div className="w-full max-w-md card p-5 shadow-2xl animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-night text-lg">New Event</h2>
                <button onClick={() => setCreateCoords(null)} className="btn-icon btn-ghost p-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <p className="text-xs text-night/50 mb-4">
                📍 Pinned at {parseFloat(createCoords.lat).toFixed(4)}, {parseFloat(createCoords.lng).toFixed(4)}
              </p>
              <CreateEventForm
                initialLat={createCoords.lat}
                initialLng={createCoords.lng}
                onSuccess={handleCreateSuccess}
                onCancel={() => setCreateCoords(null)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Event detail modal */}
      {selectedEventId && (
        <EventModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </div>
  );
}