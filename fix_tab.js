const fs = require('fs');
let code = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// Replace the username input to have tabIndex={1}
code = code.replace(
  'type={isWali ? "number" : "text"}',
  'type={isWali ? "number" : "text"}\n                  tabIndex={1}'
);

// Replace the password input to have tabIndex={2}
code = code.replace(
  'type={showPassword ? "text" : "password"}',
  'type={showPassword ? "text" : "password"}\n                  tabIndex={2}'
);

// Replace the Lupa Password button to have tabIndex={4}
code = code.replace(
  'onClick={() => setShowForgotModal(true)}',
  'onClick={() => setShowForgotModal(true)}\n                  tabIndex={4}'
);

// Replace the Submit button to have tabIndex={3}
code = code.replace(
  '<button\n                type="submit"\n                disabled={isLoading}',
  '<button\n                type="submit"\n                tabIndex={3}\n                disabled={isLoading}'
);

fs.writeFileSync('src/app/login/page.tsx', code);
