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
        court: {
          50: '#fbf7ee',
          100: '#f4ebd5',
          200: '#e8d2a6',
          300: '#dbb471',
          400: '#d19746',
          500: '#c57d2b',
          600: '#aa6022',
          700: '#87461f',
          800: '#6f3920',
          900: '#5c301e',
        },
        nba: {
          blue: '#1d428a',
          red: '#c8102e',
          dark: '#0f172a',
        }
      },
    },
  },
  plugins: [],
}
