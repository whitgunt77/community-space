import { Link } from 'react-router-dom';

const CATEGORY_EMOJI = {
  general:  '📍',
  sports:   '⚽',
  music:    '🎵',
  food:     '🍽️',
  art:      '🎨',
  tech:     '💻',
  outdoors: '🌲',
  social:   '🎉',
};

export default function EventCard({ event, onClick, compact = false }) {
  const date     = new Date(event.date_time);
  const isPast   = date < new Date();
  const emoji    = CATEGORY_EMOJI[event.category] || '📍';
  const isFull   = event.max_attendees && event.rsvp_count >= event.max_attendees;

  const content = (
    <article
      className={`card-hover p-4 flex gap-3 ${compact ? 'py-3' : ''} ${isPast ? 'opacity-60' : ''}`}
    >
      {/* Date tile */}
      <div className="flex-shrink-0 w-12 text-center rounded-xl bg-forest/8 py-1.5 px-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-forest/60">
          {date.toLocaleDateString(undefined, { month: 'short' })}
        </div>
        <div className="text-xl font-display font-bold text-forest leading-none">
          {date.getDate()}
        </div>
        <div className="text-[10px] font-mono text-forest/50">
          {date.toLocaleDateString(undefined, { weekday: 'short' })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <span className="badge-category">
            {emoji} {event.category}
          </span>
          {isFull && <span className="badge bg-ember/15 text-ember">Full</span>}
          {isPast && <span className="badge bg-night/10 text-night/50">Past</span>}
        </div>

        <h3 className={`font-display font-semibold text-night leading-snug truncate ${compact ? 'text-sm' : 'text-base'}`}>
          {event.title}
        </h3>

        {!compact && event.description && (
          <p className="text-xs text-night/60 mt-1 line-clamp-2">{event.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-night/50">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2" strokeLinecap="round"/>
            </svg>
            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>

          {event.organizer_name && (
            <span className="flex items-center gap-1 truncate">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" strokeLinecap="round"/>
              </svg>
              {event.organizer_name}
            </span>
          )}

          {event.rsvp_count != null && (
            <span className="flex items-center gap-1 ml-auto flex-shrink-0">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11 7c1.1 0 2 .9 2 2s-.9 2-2 2M5 7c-1.1 0-2 .9-2 2s.9 2 2 2M1 13.5c0-2.5 1.8-4.5 4-4.5M11 13.5c0-2.5 2.2-4.5 4-4.5M5.5 13.5c0-2.49 1.12-4.5 2.5-4.5s2.5 2.01 2.5 4.5" strokeLinecap="round"/>
              </svg>
              {event.rsvp_count}
              {event.max_attendees ? `/${event.max_attendees}` : ''}
            </span>
          )}

          {event.distance_km != null && (
            <span className="flex items-center gap-1 flex-shrink-0 text-moss font-medium">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2C5.24 2 3 4.24 3 7c0 4.25 5 9 5 9s5-4.75 5-9c0-2.76-2.24-5-5-5z" strokeLinecap="round"/>
                <circle cx="8" cy="7" r="1.5"/>
              </svg>
              {event.distance_km} km
            </span>
          )}
        </div>
      </div>
    </article>
  );

  if (onClick) {
    return (
      <button onClick={() => onClick(event)} className="w-full text-left">
        {content}
      </button>
    );
  }

  return <Link to={`/events/${event.id}`}>{content}</Link>;
}