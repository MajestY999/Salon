
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // ← важно: .jsx!
  ],
  theme: {
    extend: {
      colors: {
        primary: '#cf490bff',
        secondary: '#6b6565ff',
        accent: '#0533ffff',
        light: '#ffffffff',
      },
    },
  },
  plugins: [],
}