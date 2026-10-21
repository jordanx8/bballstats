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
        pelicans: {
          navy: '#0C2340',
          navyDark: '#061324',
          navyDeep: '#040d1a',
          navyLight: '#16365C',
          navyBorder: '#1c4575',
          gold: '#C69214',
          goldMetallic: '#B4975A',
          goldLight: '#E0B543',
          goldMuted: 'rgba(198, 146, 20, 0.15)',
          red: '#C8102E',
          redBright: '#E31837',
          redMuted: 'rgba(200, 16, 46, 0.15)',
          white: '#F5F7FA',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
