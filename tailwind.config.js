/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      fontFamily: {
        // Enforcing a unified premium, clean sans-serif superfamily
        sans: [
          'Inter', 
          'system-ui', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          '"Segoe UI"', 
          'Roboto', 
          'sans-serif'
        ],
      },
      fontSize: {
        // Mathematically precise, strict food-app scale
        '2xs': ['10px', { lineHeight: '12px', letterSpacing: '-0.01em' }],
        'xs': ['12px', { lineHeight: '16px', letterSpacing: '-0.01em' }],
        'sm': ['14px', { lineHeight: '18px', letterSpacing: '-0.01em' }],
        'base': ['16px', { lineHeight: '22px', letterSpacing: '-0.02em' }],
        'lg': ['18px', { lineHeight: '24px', letterSpacing: '-0.02em' }],
        'xl': ['20px', { lineHeight: '26px', letterSpacing: '-0.025em' }],
      },
      fontWeight: {
        // Limited to 3 highly predictable weights to completely end font noise
        normal: '400',
        semibold: '600',
        black: '800',
      }
    },
  },
}
