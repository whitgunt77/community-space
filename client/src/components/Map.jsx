import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';

// ─── Custom SVG marker factory ───────────────────────────────────────────────
const makeIcon = (color = '#2D6A4F', pulse = false) => L.divIcon({
  className: '',
  iconAnchor: [16, 40],
  popupAnchor: [0, -42],
  html: `
    <div style="position:relative;width:32px;height:40px;">
      ${pulse ? `
        <span style="position:absolute;top:2px;left:2px;width:28px;height:28px;
                     border-radius:50%;background:${color};opacity:.25;
                     animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>` : ''}
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 9.941 14 24 16 24s16-14.059 16-24C32 7.163 24.837 0 16 0z"
              fill="${color}" />
        <circle cx="16" cy="16" r="7" fill="white" fill-opacity="0.9"/>
      </svg>
    </div>`,
});

const CATEGORY_COLORS = {
  general:  '#2D6A4F',
  sports:   '#2196F3',
  music:    '#9C27B0',
  food:     '#FF9800',
  art:      '#E91E63',
  tech:     '#607D8B',
  outdoors: '#4CAF50',
  social:   '#F44336',
};

const userIcon = makeIcon('#E76F51', true);

// ─── Sub-component: click handler ────────────────────────────────────────────
function MapClickHandler({ onMapClick, enabled }) {
  useMapEvents({
    click(e) {
      if (enabled) onMapClick(e.latlng);
    },
  });
  return null;
}

// ─── Sub-component: fly to user position ─────────────────────────────────────
function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 13, { duration: 1.2 });
  }, [position, map]);
  return null;
}

// ─── Main Map component ──────────────────────────────────────────────────────
export default function Map({
  events       = [],
  userPosition = null,
  onMapClick   = null,
  onEventClick = null,
  flyToUser    = false,
  clickEnabled = true,
  className    = '',
}) {
  const defaultCenter = userPosition
    ? [userPosition.lat, userPosition.lng]
    : [40.7128, -74.006];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      className={`w-full h-full ${className}`}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Click-to-create handler */}
      {onMapClick && (
        <MapClickHandler onMapClick={onMapClick} enabled={clickEnabled} />
      )}

      {/* Fly to user on first load */}
      {flyToUser && userPosition && <FlyToUser position={userPosition} />}

      {/* User location indicator */}
      {userPosition && (
        <>
          <Circle
            center={[userPosition.lat, userPosition.lng]}
            radius={300}
            pathOptions={{ color: '#E76F51', fillColor: '#E76F51', fillOpacity: 0.08, weight: 1 }}
          />
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={userIcon}
            zIndexOffset={1000}
          >
            <Popup>
              <div className="text-sm font-medium text-night/70 py-0.5">You are here</div>
            </Popup>
          </Marker>
        </>
      )}

      {/* Event markers */}
      {events.map((event) => {
        const color = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.general;
        const icon  = makeIcon(color);
        const date  = new Date(event.date_time);

        return (
          <Marker
            key={event.id}
            position={[parseFloat(event.lat), parseFloat(event.lng)]}
            icon={icon}
            eventHandlers={{
              click: () => onEventClick?.(event),
            }}
          >
            <Popup>
              <div className="min-w-[180px] max-w-[240px]">
                <span className="badge-category mb-1">{event.category}</span>
                <h3 className="font-display font-semibold text-night text-base leading-tight mb-1">
                  {event.title}
                </h3>
                <p className="text-xs text-night/60 mb-2">
                  📅 {date.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })}
                  &nbsp;·&nbsp;
                  {date.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' })}
                </p>
                {event.rsvp_count != null && (
                  <p className="text-xs text-night/50 mb-2">
                    👥 {event.rsvp_count} going
                    {event.max_attendees ? ` / ${event.max_attendees} max` : ''}
                  </p>
                )}
                {onEventClick && (
                  <button
                    onClick={() => onEventClick(event)}
                    className="btn-primary w-full text-xs py-1.5 justify-center"
                  >
                    View details
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}