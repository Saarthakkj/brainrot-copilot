/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,js,jsx}",
        "./offscreen.html",
        "./content-script.jsx"
    ],
    theme: {
        extend: {
            zIndex: {
                'max': '2147483647',
                'max-plus': '2147483648'
            }
        }
    },
    plugins: [],
} 