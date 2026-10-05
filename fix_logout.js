const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/logout/route.ts', 'utf8');

code += `\n\nexport async function GET(req: NextRequest) {
  await deleteSession();
  const cookieStore = await cookies();
  cookieStore.delete({ name: "siakad_session", domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined });
  cookieStore.delete({ name: "app_session", domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined });
  cookieStore.delete({ name: "ppdb_session", domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined });
  cookieStore.delete("siakad_session");
  cookieStore.delete("app_session");
  cookieStore.delete("ppdb_session");
  return NextResponse.redirect(new URL("/login", req.url));
}
`;

// Also need to import NextRequest
if (!code.includes('NextRequest')) {
  code = code.replace('import { NextResponse }', 'import { NextRequest, NextResponse }');
}

fs.writeFileSync('src/app/api/auth/logout/route.ts', code);
