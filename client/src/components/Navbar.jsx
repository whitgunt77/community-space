import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/',        label: 'Map'     },
  { to: '/events',  label: 'Events'  },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sand-dark/60
                       bg-sand/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" aria-label="Community Space home">
          <span className="flex h-8 w-8 items-center justify-center rounded-full
                           bg-forest text-sand text-sm font-display font-bold
                           group-hover:bg-forest-dark transition-colors">
            cs
          </span>
          <span className="hidden sm:block font-display font-semibold text-forest text-lg leading-none">
            Community<br />
            <span className="text-xs font-body font-normal tracking-widest uppercase text-night/50">Space</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-forest/10 text-forest'
                    : 'text-night/60 hover:text-night hover:bg-night/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/events/new"
                className="btn-primary text-xs px-3 py-1.5 hidden sm:inline-flex"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2v12M2 8h12" strokeLinecap="round"/>
                </svg>
                New Event
              </Link>

              {/* Avatar dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-2 rounded-full border border-sand-dark
                             bg-white/70 px-2 py-1 text-sm hover:bg-white transition-colors"
                  aria-expanded={menuOpen}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full
                                   bg-forest text-sand text-xs font-semibold">
                    {user.username[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:block font-medium text-night/80 max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-night/40 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                       viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-44 card p-1 shadow-xl animate-fade-in">
                    <Link to="/profile"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                                     text-night/70 hover:bg-sand transition-colors"
                          onClick={() => setMenuOpen(false)}>
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" strokeLinecap="round"/>
                      </svg>
                      Profile
                    </Link>
                    <Link to="/events/new"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                                     text-night/70 hover:bg-sand transition-colors sm:hidden"
                          onClick={() => setMenuOpen(false)}>
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 2v12M2 8h12" strokeLinecap="round"/>
                      </svg>
                      New Event
                    </Link>
                    <hr className="my-1 border-sand-dark"/>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm
                                 text-ember hover:bg-ember/5 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10 2h3a1 1 0 011 1v10a1 1 0 01-1 1h-3M7 11l3-3-3-3M10 8H2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"    className="btn-ghost text-sm px-3 py-1.5">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm px-3 py-1.5">Join</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="flex md:hidden border-t border-sand-dark/40 bg-sand/60">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 py-2 text-center text-xs font-medium transition-colors ${
                isActive ? 'text-forest border-b-2 border-forest' : 'text-night/50 border-b-2 border-transparent'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}