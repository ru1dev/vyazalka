/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#24201d',
        paper: '#fffaf2',
        berry: '#8f3551',
        moss: '#55745b',
        flax: '#e7d3a8',
        sky: '#d8e7ec',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(36, 32, 29, 0.08)',
      },
    },
  },
  plugins: [],
};
