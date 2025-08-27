/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        'brand-green': {
          DEFAULT: '#013220',
          light: '#024b30',
        },
        'brand-gold': '#FFD700',
        'brand-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
};
