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
        heading: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#1e3a8a',
          50:  '#EEF2FB',
          100: '#DCE4F5',
          500: '#1e3a8a',
          600: '#16296b',
          700: '#111f52',
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
        accent: '#2c53ab',
        // Dark mode tokens
        dark: {
          bg:      '#141127',
          sidebar: '#1e1b2e',
          card:    '#221f38',
          border:  '#322c48',
          text:    '#e4e0f4',
          muted:   '#8b82ad',
        },
        // Light mode tokens
        light: {
          bg:      '#f3e8d3',
          sidebar: '#fdf7ec',
          card:    '#fdf7ec',
          border:  '#e7dcc5',
          text:    '#141427',
          muted:   '#8a8271',
        },
      },
      boxShadow: {
        card:      '0 16px 34px -26px rgba(43,36,80,0.3)',
        'card-hover': '0 20px 40px -20px rgba(43,36,80,0.35)',
        modal:     '0 20px 50px -12px rgba(20,20,39,0.45)',
        btn:       '0 10px 22px -8px rgba(30,58,138,0.45)',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(63,111,214,0.7)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(63,111,214,0)' },
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
