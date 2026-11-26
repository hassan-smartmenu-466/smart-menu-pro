// Initial menu exactly as provided in the SMART MENU PRO master specification.
// Names and prices are the source of truth and must not be changed here.
// The spec header says "TOTAL INITIAL PRODUCTS: 81" but the list it provides
// contains 73 products; we seed exactly the 73 listed (never invent products).

export interface SeedCategory {
  slug: string;
  nameEn: string;
  nameAr: string;
  nameFr: string;
  sortOrder: number;
}

export interface SeedProduct {
  category: string; // category slug
  name: string;
  price: number; // USD
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { slug: 'burgers', nameEn: 'Burgers', nameAr: 'برغر', nameFr: 'Burgers', sortOrder: 1 },
  { slug: 'sandwiches', nameEn: 'Sandwiches', nameAr: 'ساندويتش', nameFr: 'Sandwichs', sortOrder: 2 },
  { slug: 'pasta', nameEn: 'Pasta', nameAr: 'باستا', nameFr: 'Pâtes', sortOrder: 3 },
  { slug: 'plates', nameEn: 'Plates', nameAr: 'أطباق', nameFr: 'Assiettes', sortOrder: 4 },
  { slug: 'fries', nameEn: 'Fries', nameAr: 'بطاطا', nameFr: 'Frites', sortOrder: 5 },
  { slug: 'appetizers', nameEn: 'Appetizers', nameAr: 'مقبلات', nameFr: 'Entrées', sortOrder: 6 },
  { slug: 'adds', nameEn: 'Adds', nameAr: 'إضافات', nameFr: 'Suppléments', sortOrder: 7 },
  { slug: 'soft-drinks', nameEn: 'Soft Drinks', nameAr: 'مشروبات غازية', nameFr: 'Boissons', sortOrder: 8 },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  // BURGERS
  { category: 'burgers', name: 'Classic Beef', price: 6 },
  { category: 'burgers', name: 'Classic Chicken', price: 5.8 },
  { category: 'burgers', name: 'Honey Mustard Chicken', price: 5.9 },
  { category: 'burgers', name: 'Honey Mustard Beef', price: 6.1 },
  { category: 'burgers', name: 'Smoke House Chicken', price: 6 },
  { category: 'burgers', name: 'Smoke House Beef', price: 6.2 },
  { category: 'burgers', name: 'Mushroom Chicken', price: 6.2 },
  { category: 'burgers', name: 'Mushroom Beef', price: 6.4 },
  { category: 'burgers', name: 'Buffalo Chicken', price: 6 },
  { category: 'burgers', name: 'Buffalo Beef', price: 6.2 },
  { category: 'burgers', name: 'BBQ Chicken', price: 6 },
  { category: 'burgers', name: 'BBQ Beef', price: 6.2 },
  { category: 'burgers', name: 'Uncle Chicken', price: 6 },
  { category: 'burgers', name: 'Uncle Beef', price: 6.2 },
  { category: 'burgers', name: 'Bazooka Chicken', price: 6.5 },
  { category: 'burgers', name: 'Fayez Burger', price: 6.5 },
  { category: 'burgers', name: 'Crazy Burger', price: 6.5 },
  { category: 'burgers', name: 'Bulidozer Burger', price: 6.5 },
  { category: 'burgers', name: 'Fajita Burger', price: 6 },
  { category: 'burgers', name: 'Smashed Fayez Burger', price: 6.5 },
  { category: 'burgers', name: 'Mini Burger', price: 4.5 },
  // SANDWICHES
  { category: 'sandwiches', name: 'Tawook', price: 5.2 },
  { category: 'sandwiches', name: 'Francisco', price: 5.3 },
  { category: 'sandwiches', name: 'Fajita', price: 5.8 },
  { category: 'sandwiches', name: 'Crispy', price: 5.3 },
  { category: 'sandwiches', name: 'Twister', price: 5.8 },
  { category: 'sandwiches', name: 'Bazooka', price: 6 },
  { category: 'sandwiches', name: 'Escalope', price: 5.8 },
  { category: 'sandwiches', name: 'Chicken Sub', price: 5.2 },
  { category: 'sandwiches', name: 'BBQ Chicken', price: 5.3 },
  { category: 'sandwiches', name: 'Pika Sandwich', price: 5.5 },
  { category: 'sandwiches', name: 'Chicken Maxican', price: 5.3 },
  { category: 'sandwiches', name: 'Mushroom Sandwich', price: 5.4 },
  { category: 'sandwiches', name: 'Steak Sandwich', price: 6 },
  { category: 'sandwiches', name: 'Philadelphia Sandwich', price: 6.5 },
  { category: 'sandwiches', name: 'Shrimp Sandwich', price: 6.5 },
  { category: 'sandwiches', name: 'Fries Sandwich', price: 4 },
  // PASTA
  { category: 'pasta', name: 'Mushroom Chicken', price: 8 },
  { category: 'pasta', name: 'Buffalo Pasta', price: 8 },
  { category: 'pasta', name: 'Shrimp Pasta', price: 10 },
  { category: 'pasta', name: 'Cury Pasta', price: 8 },
  // PLATES
  { category: 'plates', name: 'Mushroom Chicken', price: 9 },
  { category: 'plates', name: 'Grilled Plate', price: 9 },
  { category: 'plates', name: 'Honey Mustard', price: 9 },
  { category: 'plates', name: 'Crispy Plate (5 PCS)', price: 9 },
  { category: 'plates', name: 'Escalop Plate (5 PCS)', price: 9 },
  { category: 'plates', name: 'Shrimp Plate (15 PCS)', price: 12 },
  // FRIES
  { category: 'fries', name: 'Large Fries', price: 5.5 },
  { category: 'fries', name: 'Small Fries', price: 4 },
  { category: 'fries', name: 'Curly Fries', price: 6 },
  { category: 'fries', name: 'Large Cheesy Fries', price: 6.5 },
  { category: 'fries', name: 'Small Cheesy Fries', price: 5 },
  { category: 'fries', name: 'Large Buffalo Fries', price: 6.7 },
  { category: 'fries', name: 'Large Mushroom Fries', price: 7 },
  { category: 'fries', name: 'Small Mushroom Fries', price: 5.5 },
  { category: 'fries', name: 'Large Pepperoni Fries', price: 7 },
  { category: 'fries', name: 'Small Pepperoni Fries', price: 5.5 },
  { category: 'fries', name: 'Wedges', price: 5 },
  // APPETIZERS
  { category: 'appetizers', name: 'Mozzarella Sticks', price: 5 },
  { category: 'appetizers', name: 'Cheese Balls', price: 5 },
  { category: 'appetizers', name: 'Wings (10 PCS)', price: 5 },
  // ADDS
  { category: 'adds', name: 'Small Cup Cheddar', price: 1 },
  { category: 'adds', name: 'Large Cup Cheddar', price: 3.3 },
  { category: 'adds', name: 'Mozzarella Patty', price: 2.5 },
  { category: 'adds', name: 'Cheddar Patty', price: 2.5 },
  { category: 'adds', name: 'Chicken Patty', price: 2.5 },
  { category: 'adds', name: 'Beef Patty', price: 3 },
  // SOFT DRINKS
  { category: 'soft-drinks', name: 'Pepsi', price: 1 },
  { category: 'soft-drinks', name: '7UP', price: 1 },
  { category: 'soft-drinks', name: 'Kinza', price: 1 },
  { category: 'soft-drinks', name: 'Mirinda', price: 1 },
  { category: 'soft-drinks', name: 'Water', price: 0.5 },
  { category: 'soft-drinks', name: 'Fresh Juice', price: 2 },
];

// The "Adds" items double as the default extras offered on burgers and sandwiches.
export const DEFAULT_EXTRA_NAMES = [
  'Small Cup Cheddar',
  'Large Cup Cheddar',
  'Mozzarella Patty',
  'Cheddar Patty',
  'Chicken Patty',
  'Beef Patty',
];
