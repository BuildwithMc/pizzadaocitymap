/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pizza-red': '#ff1226',
        'pizza-yellow': '#f8e00d',
        'pizza-dark': '#020202',
      },
    },
  },
  plugins: [],
}
