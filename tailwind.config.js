/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zonaA: { bg: '#fee2e2', text: '#991b1b' },
        zonaB: { bg: '#fef3c7', text: '#92400e' },
        zonaC: { bg: '#d1fae5', text: '#065f46' },
      },
    },
  },
  plugins: [],
}
