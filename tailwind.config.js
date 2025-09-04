/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'accent': '#bcfe04',
        'dark-primary': '#121212',
        'dark-secondary': '#1a1a1a',
        'evm-blue': '#485de4',
        'tezos-green': '#d1f121',
        'solana-purple': '#470f4f',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'progress': 'progress 7s linear forwards',
      },
    },
  },
  plugins: [],
}