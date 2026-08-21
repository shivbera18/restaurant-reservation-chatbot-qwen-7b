/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
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
          // Dark mode surface colors
          surface: "#1E1E1E",
          "surface-alt": "#2A2A2A",
          "surface-raised": "#333333",
        }
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px 0px #000',
        'neo': '4px 4px 0px 0px #000',
        'neo-lg': '6px 6px 0px 0px #000',
        'neo-xl': '8px 8px 0px 0px #000',
        // Dark mode variants (lighter shadow on dark bg)
        'neo-sm-dark': '2px 2px 0px 0px rgba(255,255,255,0.15)',
        'neo-dark': '4px 4px 0px 0px rgba(255,255,255,0.15)',
        'neo-lg-dark': '6px 6px 0px 0px rgba(255,255,255,0.15)',
      },
      borderWidth: {
        '3': '3px',
      },
      borderRadius: {
        'neo': '6px',     // subtle rounding for cards/buttons
        'neo-sm': '4px',  // pills, badges
        'neo-lg': '10px', // modals, large containers
      },
    },
  },
  plugins: [],
}
