/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff",
      black: "#000000",
      slate: {
        950: "#0B0C10",
        900: "#1F2833",
        800: "#26323d",
        700: "#31414f",
        500: "#7f919b",
        400: "#9ba9b0",
        300: "#C5C6C7",
        200: "#d8dadb",
        100: "#eef0f1"
      },
      cyan: {
        950: "#103634",
        700: "#45A29E",
        600: "#45A29E",
        500: "#66FCF1",
        400: "#7ffdf4",
        300: "#66FCF1",
        200: "#b8fffa",
        100: "#eafffe"
      },
      violet: {
        700: "#1F2833",
        500: "#45A29E",
        300: "#66FCF1",
        200: "#C5C6C7"
      },
      rose: {
        500: "#be445d",
        400: "#d05f76",
        100: "#ffe0e6"
      },
      brand: {
        bg: "#0B0C10",
        surface: "#1F2833",
        text: "#C5C6C7",
        cyan: "#66FCF1",
        teal: "#45A29E"
      }
    },
    extend: {
      colors: {
        slateGlow: "#0B0C10",
        neonBlue: "#66FCF1",
        neonViolet: "#45A29E"
      },
      boxShadow: {
        glow: "0 16px 42px rgba(102, 252, 241, 0.22)"
      }
    }
  },
  plugins: []
};
