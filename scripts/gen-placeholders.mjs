// Generates original vector placeholder art per category (no stock photos).
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'public', 'images', 'placeholders');
fs.mkdirSync(OUT, { recursive: true });

const BG = '#15151a';
const GOLD = '#e8a93c';
const GOLD2 = '#f5c35c';
const EMBER = '#f25c2a';
const CREAM = '#f2e6cf';
const BUN = '#d99a4e';
const BUN2 = '#b97a35';
const LETTUCE = '#7fae4c';
const MEAT = '#6e4127';
const CHEESE = '#f5c35c';

function frame(inner, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="${BG}"/>
  <circle cx="200" cy="140" r="110" fill="#1b1b21"/>
  <circle cx="200" cy="140" r="110" fill="none" stroke="${GOLD}" stroke-opacity="0.25" stroke-dasharray="4 6"/>
  ${inner}
  <text x="200" y="278" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="${GOLD}" fill-opacity="0.8" letter-spacing="2">${label}</text>
</svg>`;
}

const art = {
  burgers: `
  <g>
    <ellipse cx="200" cy="110" rx="72" ry="30" fill="${BUN}"/>
    <ellipse cx="200" cy="103" rx="72" ry="26" fill="${GOLD2}"/>
    <g fill="${CREAM}"><circle cx="170" cy="96" r="2.4"/><circle cx="195" cy="90" r="2.4"/><circle cx="222" cy="97" r="2.4"/><circle cx="240" cy="104" r="2.4"/><circle cx="180" cy="106" r="2.4"/></g>
    <path d="M128 132 q18 -12 36 0 q18 12 36 0 q18 -12 36 0 q18 12 36 0 l0 10 l-144 0 z" fill="${LETTUCE}"/>
    <rect x="130" y="142" width="140" height="12" rx="6" fill="${CHEESE}"/>
    <rect x="126" y="154" width="148" height="18" rx="9" fill="${MEAT}"/>
    <ellipse cx="200" cy="186" rx="70" ry="16" fill="${BUN2}"/>
  </g>`,
  sandwiches: `
  <g>
    <path d="M120 190 L200 80 L280 190 Z" fill="${BUN}"/>
    <path d="M136 176 L200 96 L264 176 Z" fill="${CREAM}"/>
    <path d="M148 168 q13 -10 26 0 q13 10 26 0 q13 -10 26 0 q13 10 26 0 l0 8 l-104 0 z" fill="${LETTUCE}"/>
    <rect x="146" y="180" width="108" height="9" rx="4.5" fill="${EMBER}"/>
    <path d="M120 190 L200 80 L280 190" fill="none" stroke="${BUN2}" stroke-width="6" stroke-linejoin="round"/>
  </g>`,
  pasta: `
  <g>
    <ellipse cx="200" cy="185" rx="85" ry="22" fill="#26262e"/>
    <ellipse cx="200" cy="178" rx="78" ry="18" fill="${CREAM}"/>
    <g fill="none" stroke="${GOLD2}" stroke-width="7" stroke-linecap="round">
      <path d="M150 160 q10 -24 30 -10 q22 16 40 -4 q16 -18 34 2"/>
      <path d="M160 175 q14 -20 32 -6 q20 15 36 -3"/>
      <path d="M175 150 q12 -16 28 -6"/>
    </g>
    <circle cx="170" cy="158" r="5" fill="${EMBER}"/>
    <circle cx="228" cy="150" r="5" fill="${EMBER}"/>
    <circle cx="205" cy="170" r="5" fill="${EMBER}"/>
  </g>`,
  plates: `
  <g>
    <circle cx="200" cy="150" r="80" fill="#e8e8ec"/>
    <circle cx="200" cy="150" r="62" fill="#d7d7de"/>
    <circle cx="185" cy="140" r="22" fill="${MEAT}"/>
    <circle cx="225" cy="160" r="16" fill="${GOLD2}"/>
    <circle cx="212" cy="128" r="10" fill="${LETTUCE}"/>
    <circle cx="168" cy="168" r="9" fill="${EMBER}"/>
  </g>`,
  fries: `
  <g>
    <path d="M150 120 L160 210 L240 210 L250 120 Z" fill="${EMBER}"/>
    <path d="M150 120 L160 210 L240 210 L250 120 Z" fill="none" stroke="#b23c16" stroke-width="4"/>
    <g fill="${GOLD2}">
      <rect x="158" y="78" width="14" height="70" rx="5" transform="rotate(-8 165 113)"/>
      <rect x="178" y="70" width="14" height="76" rx="5" transform="rotate(-2 185 108)"/>
      <rect x="198" y="72" width="14" height="74" rx="5" transform="rotate(4 205 109)"/>
      <rect x="218" y="80" width="14" height="66" rx="5" transform="rotate(10 225 113)"/>
    </g>
  </g>`,
  appetizers: `
  <g>
    <g fill="${GOLD2}">
      <rect x="140" y="120" width="26" height="60" rx="10"/>
      <rect x="176" y="108" width="26" height="72" rx="10"/>
      <rect x="212" y="116" width="26" height="64" rx="10"/>
      <rect x="248" y="126" width="22" height="54" rx="10"/>
    </g>
    <g stroke="${BUN2}" stroke-width="2" opacity="0.6">
      <line x1="146" y1="132" x2="160" y2="132"/><line x1="182" y1="122" x2="196" y2="122"/><line x1="218" y1="128" x2="232" y2="128"/>
    </g>
    <ellipse cx="205" cy="205" rx="46" ry="12" fill="${EMBER}"/>
  </g>`,
  adds: `
  <g>
    <path d="M165 130 h70 l-8 60 h-54 z" fill="#e8e8ec"/>
    <path d="M165 130 h70 l-3 22 h-64 z" fill="${GOLD2}"/>
    <path d="M172 152 q14 18 28 0 q14 -18 28 0 l-3 22 q-12 14 -25 2 q-13 12 -25 -2 z" fill="${GOLD}"/>
    <circle cx="255" cy="118" r="16" fill="${EMBER}"/>
    <text x="255" y="124" text-anchor="middle" font-family="system-ui" font-size="16" fill="#fff">+</text>
  </g>`,
  'soft-drinks': `
  <g>
    <rect x="172" y="95" width="56" height="105" rx="10" fill="${EMBER}"/>
    <rect x="172" y="95" width="56" height="105" rx="10" fill="none" stroke="#b23c16" stroke-width="4"/>
    <rect x="182" y="120" width="36" height="34" rx="6" fill="#fff" opacity="0.92"/>
    <line x1="205" y1="95" x2="220" y2="60" stroke="${GOLD2}" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="200" cy="200" rx="30" ry="7" fill="#0a0a0c" opacity="0.5"/>
  </g>`,
};

const labels = {
  burgers: 'BURGERS', sandwiches: 'SANDWICHES', pasta: 'PASTA', plates: 'PLATES',
  fries: 'FRIES', appetizers: 'APPETIZERS', adds: 'EXTRAS', 'soft-drinks': 'DRINKS',
};

for (const [slug, inner] of Object.entries(art)) {
  fs.writeFileSync(path.join(OUT, `${slug}.svg`), frame(inner, labels[slug] || slug.toUpperCase()));
}

// Default logo mark: flame + wordmark placeholder
fs.writeFileSync(path.join(OUT, 'logo.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="56" fill="${BG}" stroke="${GOLD}" stroke-width="3"/>
  <path d="M60 24c10 14 22 22 22 40a22 22 0 1 1-44 0c0-8 3-13 7-19 1 6 4 9 8 11-2-12 1-24 7-32z" fill="${GOLD}"/>
  <path d="M60 78a10 10 0 1 0 10-10c0 6-4 8-6 9 2-5 0-10-4-13-6 4-10 8-10 14z" fill="${EMBER}"/>
</svg>`);

// Hero backdrop texture
fs.writeFileSync(path.join(OUT, 'hero.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600">
  <defs>
    <radialGradient id="g" cx="70%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#26262e"/>
      <stop offset="55%" stop-color="#15151a"/>
      <stop offset="100%" stop-color="#0a0a0c"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="600" fill="url(#g)"/>
  <g fill="${GOLD}" opacity="0.06">
    <circle cx="1050" cy="120" r="180"/>
    <circle cx="150" cy="500" r="140"/>
  </g>
  <g transform="translate(820 130) scale(1.5)">
    <ellipse cx="130" cy="80" rx="72" ry="30" fill="${BUN}"/>
    <ellipse cx="130" cy="73" rx="72" ry="26" fill="${GOLD2}"/>
    <path d="M58 102 q18 -12 36 0 q18 12 36 0 q18 -12 36 0 q18 12 36 0 l0 10 l-144 0 z" fill="${LETTUCE}"/>
    <rect x="60" y="112" width="140" height="12" rx="6" fill="${CHEESE}"/>
    <rect x="56" y="124" width="148" height="18" rx="9" fill="${MEAT}"/>
    <ellipse cx="130" cy="156" rx="70" ry="16" fill="${BUN2}"/>
  </g>
</svg>`);

// OG image
fs.writeFileSync(path.join(OUT, 'og.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}"/>
  <text x="80" y="300" font-family="system-ui,sans-serif" font-size="84" font-weight="800" fill="#fff">SMART MENU PRO</text>
  <text x="80" y="370" font-family="system-ui,sans-serif" font-size="36" fill="${GOLD}">More Than a Menu. A Sales Machine.</text>
  <rect x="80" y="420" width="300" height="8" rx="4" fill="${GOLD}"/>
</svg>`);

console.log('placeholders written:', fs.readdirSync(OUT).join(', '));
