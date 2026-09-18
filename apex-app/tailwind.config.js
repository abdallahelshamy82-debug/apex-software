/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        apex: {
          cyan: '#06B6D4',
          midnight: '#05070F',
          card: '#0A0F1C',
          purple: '#8B5CF6'
        }
      }
    },
  },
  plugins: [],
}
