import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ffc510',
          dark: '#ffb800',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#000000',
          foreground: '#ffc510',
        },
        success: {
          DEFAULT: '#008a7c',
          foreground: '#ffffff',
        },
        error: {
          DEFAULT: '#c1564c',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'particle-up': {
          '0%': { transform: 'translate(-50%, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -20px) scale(0)', opacity: '0' },
        },
        'particle-down': {
          '0%': { transform: 'translate(-50%, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(-50%, 20px) scale(0)', opacity: '0' },
        },
        'particle-left': {
          '0%': { transform: 'translate(0, -50%) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(-20px, -50%) scale(0)', opacity: '0' },
        },
        'particle-right': {
          '0%': { transform: 'translate(0, -50%) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(20px, -50%) scale(0)', opacity: '0' },
        },
        burst: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
      },
      animation: {
        'particle-up': 'particle-up 0.6s ease-out forwards',
        'particle-down': 'particle-down 0.6s ease-out forwards',
        'particle-left': 'particle-left 0.6s ease-out forwards',
        'particle-right': 'particle-right 0.6s ease-out forwards',
        burst: 'burst 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config

