/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest:  { DEFAULT: '#2D6A4F', light: '#40916C', dark: '#1B4332' },
        moss:    { DEFAULT: '#52B788', light: '#74C69D', dark: '#40916C'  },
        sand:    { DEFAULT: '#F4ECD8', light: '#FAF6EE', dark: '#E0D5BB'  },
        ember:   { DEFAULT: '#E76F51', light: '#F4A261', dark: '#C1533A'  },
        night:   { DEFAULT: '#1A1D1E', mid: '#252929', light: '#2F3535'   },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-up':    'fadeUp 0.4s ease both',
        'fade-in':    'fadeIn 0.3s ease both',
        'slide-in':   'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'ping-slow':  'ping 2s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateX(100%)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};