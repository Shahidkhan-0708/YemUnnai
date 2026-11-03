import fs from 'fs';

let s = fs.readFileSync('src/components/HomeDiscoveryScreen.tsx', 'utf8');

// 1. remove selectedCategory state
s = s.replace(
  /const \[selectedCategory, setSelectedCategory\] = useState<FoodCategory>\('cooked'\);\s*const \[searchQuery, setSearchQuery\] = useState\(''\);\s*const \[menuCategory, setMenuCategory\] = useState\('All'\);\s*React\.useEffect\(\(\) => setMenuCategory\('All'\), \[restaurantId, selectedCategory\]\);/,
  `const [searchQuery, setSearchQuery] = useState('');\n  const [menuCategory, setMenuCategory] = useState('All');\n  React.useEffect(() => setMenuCategory('All'), [restaurantId]);`
);

// 2. remove totalByCategory
s = s.replace(
  /const totalByCategory = useMemo\(\(\) => \(\{\s*cooked: items\.filter\(i => i\.category === 'cooked'\)\.length,\s*packed: items\.filter\(i => i\.category === 'packed'\)\.length\s*\}\), \[items\]\);/,
  ''
);

// 3. update menuCategories
s = s.replace(
  'const menuCategories = restaurantId ? [...new Set(shopItems.filter(item => item.category === selectedCategory && item.menuCategory).map(item => item.menuCategory!))] : [];',
  'const menuCategories = restaurantId ? [...new Set(shopItems.filter(item => item.menuCategory).map(item => item.menuCategory!))] : [];'
);

// 4. remove item.category === selectedCategory from displayedItems filter
s = s.replace(
  'item.category === selectedCategory && ',
  ''
);

// 5. remove the discovery-categories cooked/packed toggle button strip
s = s.replace(
  /<div className="discovery-categories" aria-label="Food categories">\{[\s\S]*?<\/div>/,
  ''
);

// 6. remove unused FoodCategory import if needed
s = s.replace(/, FoodCategory/, '');

fs.writeFileSync('src/components/HomeDiscoveryScreen.tsx', s, 'utf8');
console.log('HomeDiscoveryScreen.tsx updated successfully!');
