const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/logout/route.ts', 'utf8');

code = code.replace(
  'import { NextResponse } from "next/server";',
  'import { NextRequest, NextResponse } from "next/server";'
);

fs.writeFileSync('src/app/api/auth/logout/route.ts', code);
