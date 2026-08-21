/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neo: {
          yellow: "#FFE600",
          green: "#4ADE80",
          blue: "#38BDF8",
          purple: "#A78BFA",
          orange: "#FB923C",
          pink: "#F472B6",
          cream: "#FAF8F5",
          canvas: "#F4EFE6",
          dark: "#121212",
        }
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px 0px #000',
        'neo': '4px 4px 0px 0px #000',
        'neo-lg': '6px 6px 0px 0px #000',
        'neo-xl': '8px 8px 0px 0px #000',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}
