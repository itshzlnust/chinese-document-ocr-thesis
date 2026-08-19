/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chinese: {
          red: '#D92B2B',
          darkRed: '#9E1C1C',
          gold: '#E6A119',
          jade: '#10B981',
          ink: '#0F172A',
          paper: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        kai: ['STKaiti', 'Kaiti SC', 'KaiTi', 'serif']
      }
    },
  },
  plugins: [],
}
