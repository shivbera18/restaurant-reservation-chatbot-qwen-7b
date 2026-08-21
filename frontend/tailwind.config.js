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
          cream: "var(--neo-surface)",
          canvas: "var(--neo-canvas)",
          card: "var(--neo-card)",
          surface: "var(--neo-surface)",
          dark: "#161616",
          border: "var(--neo-border)",
        }
      },
      textColor: {
        'neo-main': 'var(--neo-text)',
        'neo-muted': 'var(--neo-text-muted)',
      },
      boxShadow: {
        'neo-sm': 'var(--neo-shadow-sm, 2px 2px 0px 0px #000)',
        'neo': 'var(--neo-shadow, 4px 4px 0px 0px #000)',
        'neo-lg': 'var(--neo-shadow-lg, 6px 6px 0px 0px #000)',
        'neo-xl': 'var(--neo-shadow-xl, 8px 8px 0px 0px #000)',
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
