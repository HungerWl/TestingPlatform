/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#10120f',
          soft: '#1b1e19',
          muted: '#5f6158',
        },
        paper: {
          DEFAULT: '#f2efe7',
          deep: '#e9e4d9',
          card: '#fbfaf6',
        },
        acid: {
          DEFAULT: '#d8fb4f',
          deep: '#bfe52e',
        },
        ember: {
          DEFAULT: '#ff5c35',
          soft: '#ffe4dc',
        },
        frost: {
          DEFAULT: '#cfe6ff',
          deep: '#97c7f6',
        },
        line: {
          DEFAULT: '#ddd7c9',
          strong: '#c7bfae',
        },
        muted: '#79766c',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Variable"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        display: ['Sora Variable', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"SFMono-Regular"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(16, 18, 15, 0.04), 0 12px 32px -24px rgba(16, 18, 15, 0.4)',
        lift: '0 18px 42px -22px rgba(16, 18, 15, 0.32)',
      },
      borderRadius: {
        panel: '18px',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'rise-in': 'riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scan-line': 'scanLine 5s linear infinite',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(216, 251, 79, 0.5)' },
          '50%': { opacity: '0.65', boxShadow: '0 0 0 7px rgba(216, 251, 79, 0)' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
};
