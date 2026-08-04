/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        secondaryBg: "#111827",
        cardBg: "#161B22",
        borderColor: "#262F3D",
        primaryBlue: "#2563EB",
        hoverBlue: "#3B82F6",
        accentCyan: "#38BDF8",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        primaryText: "#FFFFFF",
        secondaryText: "#94A3B8",
      },
      fontFamily: {
        sans: ["Satoshi", "General Sans", "Inter", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        button: "14px",
        input: "16px",
      },
      boxShadow: {
        card: "0 10px 40px rgba(37,99,235,.15)",
        hover: "0 20px 60px rgba(37,99,235,.20)",
      },
    },
  },
  plugins: [],
};
