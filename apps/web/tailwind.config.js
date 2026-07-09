/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        guild: {
          bg: "#FFF7EF",
          panel: "#FFFFFF",
          panelSoft: "#FFF0D6",
          gold: "#FF9F6B",
          goldSoft: "#FFD89A",
          ember: "#F37E5F",
          sky: "#7ED8FF",
          mint: "#63E6C5",
          grass: "#A7E8B4",
          blueSoft: "#BEE7FF",
          ink: "#5B4636",
          muted: "#8E7A6A",
          line: "#F1DEC6",
        },
      },
      boxShadow: {
        glow: "0 18px 45px rgba(176, 124, 76, 0.14), 0 1px 0 rgba(255, 255, 255, 0.65) inset",
        soft: "0 14px 34px rgba(176, 124, 76, 0.12)",
      },
      borderRadius: {
        guild: "22px",
      },
    },
  },
  plugins: [],
};
