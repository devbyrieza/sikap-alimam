const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/master/NavTabs.tsx', 'utf8');

const regex = /<Link href="\/master\/santri" style=\{getStyle\("\/master\/santri"\)\}>[\s\S]*?Data Santri[\s\S]*?<\/Link>/;

const newLink = `<Link href="/master/santri" style={getStyle("/master/santri")}>
        <Users size={16} />
        Data Santri
      </Link>

      <Link href="/master/santri/kelengkapan" style={getStyle("/master/santri/kelengkapan")}>
        <Users size={16} />
        Kelengkapan (NIS & Tgl Lahir)
      </Link>`;

code = code.replace(regex, newLink);

fs.writeFileSync('src/app/(dashboard)/master/NavTabs.tsx', code);
