/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5fa',
          100: '#e1ebf5',
          200: '#c3d7ec',
          300: '#94bce0',
          400: '#5e9cd0',
          500: '#387ec0',
          600: '#2763a4',
          700: '#204f85',
          800: '#1e436d',
          900: '#0f243f',
          950: '#091526',
        },
        brand: {
          blue: '#1E3E62',
          navy: '#0B192C',
          accent: '#2563EB',
          light: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
