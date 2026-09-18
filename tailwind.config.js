/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F7F5F2',
        surface: '#FFFFFF',
        primary: '#2A52BE',
        'primary-light': '#EEF1FB',
        amber: '#E8A838',
        'amber-light': '#FDF6E7',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B66',
        border: '#E4E2DE',
        danger: '#C0392B',
        success: '#1A7F4B',
        'insight-strategy': '#2A52BE',
        'insight-tech': '#E8A838',
        'insight-people': '#1A7F4B',
        'insight-risk': '#C0392B',
        'insight-innovation': '#7C3AED',
        note: '#FFFEF5',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        control: '8px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.07)',
        'card-hover': '0 6px 22px rgba(0,0,0,0.11)',
        note: '0 3px 10px rgba(0,0,0,0.08)',
        panel: '-8px 0 30px rgba(0,0,0,0.12)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      screens: {
        mobile: '375px',
        tablet: '768px',
        desktop: '1200px',
      },
    },
  },
  plugins: [],
}
