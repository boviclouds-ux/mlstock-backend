/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:        '#1B2D8A', // ML STOCK deep navy — sidebar, headings, primary CTAs
          'navy-dark': '#141F61', // hover / pressed state
          'navy-light':'#2A3FA3', // lighter variant for rings / borders
          cyan:        '#0DC8E8', // active links, primary accent
          'cyan-dark': '#0AABCA', // hover state for cyan elements
          'cyan-light':'#E0F8FD', // light tint for backgrounds
          green:       '#2BAA2B', // success, stock OK, validation
          'green-dark':'#1F8020', // hover
          'green-light':'#E8F8E8',// tint
          red:         '#E61818', // danger, alerts, déconnexion
          'red-light': '#FEE8E8', // tint
        },
      },
    },
  },
  plugins: [],
}

