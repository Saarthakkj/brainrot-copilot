/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,js}",
        "./offscreen.html",
        "./content-script.js"
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