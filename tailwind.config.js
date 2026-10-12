/** Tailwind build config (same defaults as the CDN build, v3.4.17). Rebuild with:
 *  npx tailwindcss@3.4.17 -c tailwind.config.js -i src/tailwind.css -o css/tailwind.css --minify
 */
module.exports = {
  content: ['./index.html', './js/*.js'],
  theme: { extend: {} },
  plugins: [],
};
