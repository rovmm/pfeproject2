/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#2F81F7',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#2F81F7',
          600: '#1A6FE0',
          700: '#1558C0',
        },
        success: {
          DEFAULT: '#238636',
          light: '#2EA043',
        },
        danger: {
          DEFAULT: '#DA3633',
          light: '#F85149',
        },
        warning: {
          DEFAULT: '#D29922',
          light: '#E3B341',
        },
        accent: '#8B949E',
        // Dark mode tokens
        dark: {
          bg:      '#0D1117',
          sidebar: '#161B22',
          card:    '#21262D',
          border:  '#30363D',
          text:    '#C9D1D9',
          muted:   '#8B949E',
        },
        // Light mode tokens
        light: {
          bg:      '#F6F8FA',
          sidebar: '#FFFFFF',
          card:    '#FFFFFF',
          border:  '#D0D7DE',
          text:    '#24292F',
          muted:   '#57606A',
        },
      },
      boxShadow: {
        card:      '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.20)',
        modal:     '0 8px 32px rgba(0,0,0,0.32)',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease forwards',
        'slide-in':     'slideIn 0.25s ease forwards',
        'pulse-blue':   'pulseBlue 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'skeleton':     'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        pulseBlue: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(47,129,247,0.7)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(47,129,247,0)' },
        },
        skeleton: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      transitionProperty: {
        all: 'all',
      },
      transitionDuration: {
        DEFAULT: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [],
}
