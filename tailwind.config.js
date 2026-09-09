/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Each token reads from a CSS variable set in globals.css, one set
        // for :root (light) and one for .dark. The `<alpha-value>` bit lets
        // Tailwind opacity modifiers (e.g. bg-cardBg/50) keep working.
        background: 'rgb(var(--color-background) / <alpha-value>)',
        secondaryBg: 'rgb(var(--color-secondary-bg) / <alpha-value>)',
        cardBg: 'rgb(var(--color-card-bg) / <alpha-value>)',
        borderColor: 'rgb(var(--color-border) / <alpha-value>)',
        primaryBlue: 'rgb(var(--color-primary-blue) / <alpha-value>)',
        hoverBlue: 'rgb(var(--color-hover-blue) / <alpha-value>)',
        accentCyan: 'rgb(var(--color-accent-cyan) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        primaryText: 'rgb(var(--color-primary-text) / <alpha-value>)',
        secondaryText: 'rgb(var(--color-secondary-text) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Satoshi', 'General Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        button: '14px',
        input: '16px',
      },
      boxShadow: {
        card: '0 10px 40px rgba(37,99,235,.15)',
        hover: '0 20px 60px rgba(37,99,235,.20)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
