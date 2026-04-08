/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        osrs: {
          dark: '#1b1b1b',
          panel: '#2b2b2b',
          border: '#3e3e3e',
          gold: '#ff981f',
          green: '#00b200',
          red: '#ff3030',
          text: '#c8c8c8',
          white: '#ffffff',
        },
      },
    },
  },
  plugins: [],
}
