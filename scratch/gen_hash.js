const bcrypt = require('bcryptjs');
(async () => {
  console.log("Paas2026!:", await bcrypt.hash("Paas2026!", 10));
  console.log("Puas2026!:", await bcrypt.hash("Puas2026!", 10));
  console.log("Andalus2026!:", await bcrypt.hash("Andalus2026!", 10));
  console.log("2026#@:", await bcrypt.hash("2026#@", 10));
})();
