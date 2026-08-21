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
        'neo-sm-dark': '2px 2px 0px 0px rgba(255,255,255,0.18)',
        'neo-dark': '4px 4px 0px 0px rgba(255,255,255,0.18)',
        'neo-lg-dark': '6px 6px 0px 0px rgba(255,255,255,0.18)',
        'neo-xl-dark': '8px 8px 0px 0px rgba(255,255,255,0.18)',
      },
      borderWidth: {
        '3': '3px',
      },
      borderRadius: {
        'neo-sm': '6px',   // pills, small badges, chips, mini-buttons
        'neo': '12px',     // standard cards, chat bubbles, buttons, inputs
        'neo-lg': '16px',  // modals, floating sidebar, tickets, drawers
        'neo-xl': '22px',  // hero panels, big modal wrappers
      },
    },
  },
  plugins: [],
}
