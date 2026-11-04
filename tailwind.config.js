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
          navy: '#14161f',
          navyDark: '#0b0c12',
          navyDeep: '#07080c',
          navyLight: '#1e2230',
          navyBorder: '#2a2f42',
          gold: '#8b9bf5',
          goldMetallic: '#6f7bdc',
          goldLight: '#b4bffd',
          goldMuted: 'rgba(139, 155, 245, 0.15)',
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
