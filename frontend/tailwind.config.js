/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00AEEF", // Doraemon Blue
        secondary: "#EE1C25", // Doraemon Red
        accent: "#FFF200", // Doraemon Bell Yellow
        dark: "#0F0F1A"
      },
    },
  },

  plugins: [],
}
// force rebuild
