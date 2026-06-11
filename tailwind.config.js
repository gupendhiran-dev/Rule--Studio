/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jumio: {
          green: '#00C853',
          'green-dark': '#00A846',
          'green-light': '#E8F9F0',
          sidebar: '#1C1F24',
          'sidebar-hover': '#2A2D35',
          bg: '#F0F2F5',
          border: '#E5E7EB',
          text: '#111827',
          muted: '#6B7280',
          light: '#9CA3AF',
          blue: '#1976D2',
          'blue-light': '#EFF6FF',
          red: '#D32F2F',
          orange: '#F97316',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
