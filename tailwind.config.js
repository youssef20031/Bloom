/** Tailwind CSS Configuration with custom primary color scale */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  'hsl(214 100% 97%)',   // #f1f7ff approx
          100: 'hsl(214 95% 93%)',    // #e3effe
          200: 'hsl(214 90% 87%)',    // interpolated
          300: 'hsl(215 88% 80%)',    // interpolated
          400: 'hsl(216 86% 70%)',    // interpolated
          500: 'hsl(217 91% 60%)',    // matches --primary-500
          600: 'hsl(221 83% 53%)',    // matches --primary-600
          700: 'hsl(224 76% 48%)',    // matches --primary-700
          800: 'hsl(226 71% 40%)',    // matches --primary-800
          900: 'hsl(224 64% 33%)',    // matches --primary-900
          950: 'hsl(226 60% 23%)'     // deep shade for dark bg usage
        }
      }
    }
  },
  plugins: []
};

