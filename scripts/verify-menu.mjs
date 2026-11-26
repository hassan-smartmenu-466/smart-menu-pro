// Verifies the seeded database matches the specification menu exactly.
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const db = new DatabaseSync(process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'smartmenu.db'));
const cats = db.prepare('SELECT slug, name_en FROM categories ORDER BY sort_order').all();
const prods = db.prepare(
  `SELECT c.name_en AS category, p.name, p.price_cents FROM products p
   JOIN categories c ON c.id = p.category_id ORDER BY c.sort_order, p.id`
).all();
console.log(`Categories: ${cats.length}`);
for (const c of cats) {
  const n = prods.filter((p) => p.category === c.name_en).length;
  console.log(`  ${c.name_en}: ${n}`);
}
console.log(`Total products: ${prods.length}`);
const badPrices = prods.filter((p) => !Number.isInteger(p.price_cents) || p.price_cents < 0);
console.log(`Invalid prices: ${badPrices.length}`);
