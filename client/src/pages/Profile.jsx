import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [bio,       setBio]   = useState(user?.bio || '');
  const [avatarUrl, setAvatar] = useState(user?.avatar_url || '');
  const [saving,   setSaving] = useState(false);
  const [saveErr,  setSaveErr] = useState('');

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const { data: myEvents = [], isLoading } = useQuery({
    queryKey: ['userEvents', user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${user.id}/events`);
      return data.events;
    },
    enabled: !!user,
  });

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaveErr('');
    try {
      const { data } = await api.put('/users/me', { bio, avatar_url: avatarUrl });
      updateUser(data.user);
      setEditing(false);
    } catch (err) {
      setSaveErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  const upcomingEvents = myEvents.filter(e => new Date(e.date_time) >= new Date());
  const pastEvents     = myEvents.filter(e => new Date(e.date_time) <  new Date());

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-up">

      {/* Profile card */}
      <div className="card p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username}
                     className="w-16 h-16 rounded-full object-cover border-2 border-sand-dark" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center
                                text-sand text-2xl font-display font-bold">
                  {user.username[0].toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h1 className="font-display font-bold text-2xl text-night">{user.username}</h1>
              <p className="text-sm text-night/50">{user.email}</p>
              <p className="text-xs text-night/40 mt-0.5">
                Member since {new Date(user.created_at).toLocaleDateString(undefined, { month:'long', year:'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditing(e => !e)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="btn-ghost text-xs px-3 py-1.5 text-ember hover:bg-ember/8"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Bio */}
        {!editing ? (
          <p className="text-sm text-night/70 leading-relaxed">
            {user.bio || <span className="text-night/30 italic">No bio yet – click Edit Profile to add one.</span>}
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="label">Bio</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell your community about yourself…"
              />
            </div>
            <div>
              <label className="label">Avatar URL <span className="text-night/30 font-normal normal-case">(optional)</span></label>
              <input className="input" value={avatarUrl} onChange={e => setAvatar(e.target.value)} placeholder="https://…" />
            </div>
            {saveErr && <p className="text-xs text-ember">{saveErr}</p>}
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-5 pt-4 border-t border-sand-dark">
          <div className="text-center">
            <p className="font-display font-bold text-xl text-forest">{myEvents.length}</p>
            <p className="text-xs text-night/50">Events hosted</p>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-xl text-forest">{upcomingEvents.length}</p>
            <p className="text-xs text-night/50">Upcoming</p>
          </div>
        </div>
      </div>

      {/* My events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-xl text-night">My Events</h2>
          <Link to="/events/new" className="btn-primary text-xs px-3 py-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 2v12M2 8h12" strokeLinecap="round"/>
            </svg>
            New Event
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1,2].map(i => (
              <div key={i} className="card p-4 animate-pulse flex gap-3">
                <div className="w-12 h-14 bg-sand-dark rounded-xl"/>
                <div className="flex-1 space-y-2"><div className="h-4 bg-sand-dark rounded w-3/4"/><div className="h-3 bg-sand-dark rounded w-1/2"/></div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && myEvents.length === 0 && (
          <div className="text-center py-12 card">
            <p className="text-3xl mb-2">🗓️</p>
            <p className="text-sm font-medium text-night/60">You haven't hosted any events yet.</p>
            <Link to="/events/new" className="btn-primary mt-4 inline-flex text-sm">Create your first event</Link>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <>
            <h3 className="text-xs font-mono uppercase tracking-widest text-night/40 mb-2">Upcoming</h3>
            <div className="space-y-3 mb-6">
              {upcomingEvents.map(e => <EventCard key={e.id} event={e} compact />)}
            </div>
          </>
        )}

        {pastEvents.length > 0 && (
          <>
            <h3 className="text-xs font-mono uppercase tracking-widest text-night/40 mb-2">Past</h3>
            <div className="space-y-3 opacity-70">
              {pastEvents.map(e => <EventCard key={e.id} event={e} compact />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}