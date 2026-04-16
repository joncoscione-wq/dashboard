/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './public/**/*.html',
    './vanilla-dashboard/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        primary:    '#0d4259',
        'primary-90': '#154e69',
        'primary-70': '#2a6884',
        accent:     '#186f8a',
        'accent-bg':'#e4f2f7',
        taupe:      '#a5a08e',
        'taupe-bg': '#f5f2ed',
        ci: {
          bg:      '#f3f4f6',
          surface: '#ffffff',
          border:  '#dde1e8',
          border2: '#c6ccd6',
          text:    '#0d2d3e',
          text2:   '#3d4f5c',
          muted:   '#7a8899',
          green:   '#1a7a4a',
          'green-bg': '#e5f5ec',
          red:     '#b83228',
          'red-bg':'#fceeed',
          amber:   '#a34f00',
          'amber-bg': '#fef2e0',
        }
      },
      fontFamily: {
        poppins:  ['Poppins', 'sans-serif'],
        'dm-sans': ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 5px rgba(13,66,89,.06)',
        modal: '0 18px 60px rgba(0,0,0,.25)',
      }
    }
  },
  plugins: []
}
