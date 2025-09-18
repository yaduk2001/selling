/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enable dark mode using a class (e.g., <body class="dark">)
  darkMode: 'class',
  
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  plugins: [],
};
