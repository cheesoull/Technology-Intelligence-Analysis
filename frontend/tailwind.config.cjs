/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0D47A1',
        secondary: '#1565C0',
        lightBlue: 'rgba(227, 242, 253, 0.32)',
        textGray: '#666',
        textDark: '#333',
      },
    },
  },
  plugins: [],
};
