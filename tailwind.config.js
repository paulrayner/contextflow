/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        contextCore: '#f8e7a1',        // soft gold
        contextSupporting: '#dbeafe',  // pale blue
        contextGeneric: '#f3f4f6',     // light gray
      },
    },
  },
  plugins: [],
}
