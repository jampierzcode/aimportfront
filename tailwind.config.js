/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Escala de marca derivada del navy original (#2d3484). "primary" y
        // "dark-purple" siguen resolviendo al mismo tono de siempre (DEFAULT)
        // para no romper clases existentes como bg-primary / text-dark-purple.
        "dark-purple": "#2d3484",
        primary: {
          DEFAULT: "#2d3484",
          50: "#eef0fb",
          100: "#dde1f7",
          200: "#b9c0ef",
          300: "#8f97e0",
          400: "#6169c9",
          500: "#3d44a8",
          600: "#2d3484",
          700: "#242a6a",
          800: "#1c2154",
          900: "#151940",
        },
        secondary: "#ebcf9e",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 6px -1px rgb(15 23 42 / 0.06)",
        "card-lg": "0 4px 10px -2px rgb(15 23 42 / 0.06), 0 10px 30px -8px rgb(15 23 42 / 0.10)",
      },
    },
  },
  plugins: [],
};
