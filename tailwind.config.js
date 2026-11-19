/** @type {import('tailwindcss').Config} */
// Thème branché sur les tokens Sidekick (src/styles/tokens.css) : les classes
// `bg-accent`, `text-ink`, `border-line`, `rounded-md`… lisent les variables CSS.
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          'on-dark': 'var(--accent-on-dark)',
        },
        'on-accent': 'var(--on-accent)',
        ground: 'var(--ground)',
        surface: 'var(--surface)',
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        band: 'var(--band)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
        fab: 'var(--shadow-fab)',
      },
    },
  },
  plugins: [],
};
