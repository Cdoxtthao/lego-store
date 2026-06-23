/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        flower: {
          50:  '#FFF0F0',
          100: '#E8989A',
          150: '#E4959A',
        }
      },
      fontFamily: {
        sans: ['Quicksand', 'Baloo 2', 'sans-serif'],
      }
    }
  },
  plugins: [],
}