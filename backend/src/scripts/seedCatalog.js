const Category = require('../models/Category');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const StockMovement = require('../models/StockMovement');
const { STOCK_MOVEMENT_TYPE } = require('../config/constants');

const CATEGORIES_DATA = [
  {
    key: 'CLOTHING',
    name: 'Clothing',
    description: 'Apparel, garments, shirts, trousers, kurtas, and garments with size and color variants',
    isSystemDefault: true,
    isActive: true,
  },
  {
    key: 'GENERAL_STORE',
    name: 'General Store',
    description: 'Everyday consumables, household essentials, and packaged retail goods',
    isSystemDefault: true,
    isActive: true,
  },
  {
    key: 'GROCERIES',
    name: 'Groceries & Food Staples',
    description: 'Flour (Atta), rice, pulses (daal), spices, cooking oils, ghee, sugar, tea, and milk',
    isSystemDefault: false,
    isActive: true,
  },
  {
    key: 'SNACKS_BEVERAGES',
    name: 'Snacks, Beverages & Confectionery',
    description: 'Cold drinks, juices, mineral water, biscuits, chips, chocolates, and nimko',
    isSystemDefault: false,
    isActive: true,
  },
  {
    key: 'PERSONAL_CARE',
    name: 'Personal Care & Toiletries',
    description: 'Soaps, shampoos, toothpastes, skincare, shaving essentials, and hair oils',
    isSystemDefault: false,
    isActive: true,
  },
  {
    key: 'HOUSEHOLD_CLEANING',
    name: 'Household & Cleaning Supplies',
    description: 'Detergents, dishwashing, surface cleaners, insecticides, and tissues',
    isSystemDefault: false,
    isActive: true,
  },
  {
    key: 'ELECTRICAL_HARDWARE',
    name: 'Electrical & Hardware Supplies',
    description: 'LED bulbs, switches, sockets, multi-plugs, extension boards, wires, batteries, and hardware tools',
    isSystemDefault: false,
    isActive: true,
  },
  {
    key: 'STATIONERY',
    name: 'Stationery & School Supplies',
    description: 'Notebooks, registers, ballpoints, markers, packing tapes, and scissors',
    isSystemDefault: false,
    isActive: true,
  },
  {
    key: 'GARMENT_PARTS',
    name: 'Garment Accessories & Tailoring Parts',
    description: 'Buttons, zippers, sewing thread rolls, elastic bands, needles, and tailoring supplies',
    isSystemDefault: false,
    isActive: true,
  },
];

const PRODUCTS_DATA = [
  // ==========================================
  // GROCERIES & FOOD STAPLES (A to Z)
  // ==========================================
  {
    categoryKey: 'GROCERIES',
    name: 'Chakki Atta (Whole Wheat Flour) 10kg Bag',
    description: '100% pure whole wheat stone-ground chakki flour',
    isClothing: false,
    variants: [
      { sku: 'GROC-ATTA-10KG', barcode: '896400010011', costPrice: 1250, sellingPrice: 1380, stock: 40, threshold: 5 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Super Kernel Basmati Rice 5kg Bag',
    description: 'Aromatic aged long-grain super kernel basmati rice',
    isClothing: false,
    variants: [
      { sku: 'GROC-RICE-5KG', barcode: '896400010028', costPrice: 1650, sellingPrice: 1950, stock: 30, threshold: 5 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Refined White Sugar (Cheeni) 5kg Bag',
    description: 'Premium crystal white refined pure cane sugar',
    isClothing: false,
    variants: [
      { sku: 'GROC-SUG-5KG', barcode: '896400010035', costPrice: 700, sellingPrice: 780, stock: 50, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Dalda Cooking Oil 1 Litre Pouch',
    description: 'Pure vegetable cooking oil with VTF and vitamins A & D',
    isClothing: false,
    variants: [
      { sku: 'GROC-DALDA-1L', barcode: '896400010042', costPrice: 510, sellingPrice: 560, stock: 60, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Habib Banaspati Ghee 1kg Pouch',
    description: 'Hydrogenated vegetable cooking banaspati ghee',
    isClothing: false,
    variants: [
      { sku: 'GROC-HABIB-1KG', barcode: '896400010059', costPrice: 490, sellingPrice: 540, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Daal Chana (Yellow Gram Pulse) 1kg',
    description: 'Cleaned and sorted unpolished yellow split gram lentils',
    isClothing: false,
    variants: [
      { sku: 'GROC-DAAL-CHANA-1KG', barcode: '896400010066', costPrice: 240, sellingPrice: 290, stock: 45, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Daal Moong Washed (Yellow Split) 1kg',
    description: 'Husked yellow split moong pulse for everyday cooking',
    isClothing: false,
    variants: [
      { sku: 'GROC-DAAL-MOONG-1KG', barcode: '896400010073', costPrice: 290, sellingPrice: 350, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Daal Masoor (Red Split Lentils) 1kg',
    description: 'Fast-cooking red split masoor lentils',
    isClothing: false,
    variants: [
      { sku: 'GROC-DAAL-MASOOR-1KG', barcode: '896400010080', costPrice: 310, sellingPrice: 370, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'National Iodized Pink Himalayan Salt 800g Pouch',
    description: 'Refined iodized natural edible pink rock salt',
    isClothing: false,
    variants: [
      { sku: 'GROC-SALT-800G', barcode: '896400010097', costPrice: 50, sellingPrice: 65, stock: 100, threshold: 15 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'National Red Chilli Powder (Lal Mirch) 200g',
    description: 'Finely ground stemless red hot chilli powder',
    isClothing: false,
    variants: [
      { sku: 'GROC-CHILLI-200G', barcode: '896400010103', costPrice: 180, sellingPrice: 220, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'National Turmeric Powder (Haldi) 200g',
    description: 'Pure aromatic turmeric powder',
    isClothing: false,
    variants: [
      { sku: 'GROC-HALDI-200G', barcode: '896400010110', costPrice: 160, sellingPrice: 200, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Shan Special Bombay Biryani Masala 100g Double Pack',
    description: 'Authentic spice mix for Karachi & Bombay style biryani',
    isClothing: false,
    variants: [
      { sku: 'GROC-SHAN-BIRYANI', barcode: '896400010127', costPrice: 130, sellingPrice: 160, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Shan Shahi Qorma Recipe Masala 50g',
    description: 'Traditional rich gravy meat recipe spice mix',
    isClothing: false,
    variants: [
      { sku: 'GROC-SHAN-QORMA', barcode: '896400010134', costPrice: 105, sellingPrice: 130, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Tapal Danedar Black Tea Pouch 430g',
    description: 'Distinctive strong round tea granules for karak chai',
    isClothing: false,
    variants: [
      { sku: 'GROC-TAPAL-430G', barcode: '896400010141', costPrice: 620, sellingPrice: 690, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Lipton Yellow Label Black Tea 380g Pouch',
    description: 'Rich taste and fragrant golden aroma blend',
    isClothing: false,
    variants: [
      { sku: 'GROC-LIPTON-380G', barcode: '896400010158', costPrice: 590, sellingPrice: 660, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Olper\'s Full Cream Milk 1 Litre Tetrapak',
    description: 'UHT treated standardized full cream pure milk',
    isClothing: false,
    variants: [
      { sku: 'GROC-OLPERS-1L', barcode: '896400010165', costPrice: 270, sellingPrice: 295, stock: 80, threshold: 15 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Nestle MilkPak Pure Dairy Milk 1 Litre Tetrapak',
    description: 'Rich creamery homogenized pure cow and buffalo milk',
    isClothing: false,
    variants: [
      { sku: 'GROC-MILKPAK-1L', barcode: '896400010172', costPrice: 270, sellingPrice: 295, stock: 80, threshold: 15 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'National Tomato Ketchup 800g Pouch',
    description: 'Rich tomato puree condiment sauce with twist cap',
    isClothing: false,
    variants: [
      { sku: 'GROC-KETCHUP-800G', barcode: '896400010189', costPrice: 280, sellingPrice: 340, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Mitchell\'s Golden Apple Jam 450g Glass Jar',
    description: 'Fresh farm-picked orchard apple fruit jam spread',
    isClothing: false,
    variants: [
      { sku: 'GROC-JAM-APPLE-450G', barcode: '896400010196', costPrice: 260, sellingPrice: 320, stock: 30, threshold: 5 },
    ],
  },

  // ==========================================
  // SNACKS, BEVERAGES & CONFECTIONERY
  // ==========================================
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Coca-Cola Regular 1.5 Litre PET Bottle',
    description: 'Classic carbonated refreshing cola drink',
    isClothing: false,
    variants: [
      { sku: 'BEV-COKE-1.5L', barcode: '896400020010', costPrice: 170, sellingPrice: 200, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Sprite Lemon-Lime 1.5 Litre PET Bottle',
    description: 'Crisp, clean lemon-lime carbonated soda',
    isClothing: false,
    variants: [
      { sku: 'BEV-SPRITE-1.5L', barcode: '896400020027', costPrice: 170, sellingPrice: 200, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Nestle Pure Life Mineral Water 1.5 Litre Bottle',
    description: 'Pure purified bottled drinking water with essential minerals',
    isClothing: false,
    variants: [
      { sku: 'BEV-WATER-1.5L', barcode: '896400020034', costPrice: 80, sellingPrice: 110, stock: 90, threshold: 20 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Rooh Afza Herbal Red Syrup 800ml Bottle',
    description: 'Traditional cooling herbal distillate sharbat cordial',
    isClothing: false,
    variants: [
      { sku: 'BEV-ROOHAFZA-800ML', barcode: '896400020041', costPrice: 380, sellingPrice: 440, stock: 35, threshold: 8 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Sting Red Rush Energy Drink 300ml Sleek Can',
    description: 'Refreshing caffeinated taurine energy drink',
    isClothing: false,
    variants: [
      { sku: 'BEV-STING-300ML', barcode: '896400020058', costPrice: 85, sellingPrice: 110, stock: 70, threshold: 15 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Nestle Fruita Vitals Chaunsa Mango Nectar 1 Litre',
    description: 'Pure Pakistani Chaunsa mango pulp fruit juice',
    isClothing: false,
    variants: [
      { sku: 'BEV-JUICE-MANGO-1L', barcode: '896400020065', costPrice: 290, sellingPrice: 350, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Peek Freans Sooper Biscuits Half-Roll 112g',
    description: 'Egg and milk crunchy sweet tea biscuits',
    isClothing: false,
    variants: [
      { sku: 'SNAK-SOOPER-HR', barcode: '896400020072', costPrice: 40, sellingPrice: 50, stock: 120, threshold: 24 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'LU Prince Chocolate Cream Sandwich Biscuits Half-Roll',
    description: 'Rich cocoa chocolate filled round sandwich cookies',
    isClothing: false,
    variants: [
      { sku: 'SNAK-PRINCE-HR', barcode: '896400020089', costPrice: 40, sellingPrice: 50, stock: 100, threshold: 20 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'LU Oreo Vanilla Cream Sandwich Biscuits Half-Roll',
    description: 'Dark cocoa biscuit sandwiches with smooth sweet vanilla cream',
    isClothing: false,
    variants: [
      { sku: 'SNAK-OREO-HR', barcode: '896400020096', costPrice: 45, sellingPrice: 60, stock: 90, threshold: 18 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Lays Masala Potato Chips 50g Bag',
    description: 'Crunchy golden sliced potato chips with spicy masala seasoning',
    isClothing: false,
    variants: [
      { sku: 'SNAK-LAYS-MASALA', barcode: '896400020102', costPrice: 65, sellingPrice: 80, stock: 80, threshold: 15 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Kurkure Chutney Chaska 50g Bag',
    description: 'Crunchy twisted corn puff snack with tangy mint chutney flavor',
    isClothing: false,
    variants: [
      { sku: 'SNAK-KURKURE-50G', barcode: '896400020119', costPrice: 40, sellingPrice: 50, stock: 75, threshold: 15 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Cadbury Dairy Milk Chocolate 38g Bar',
    description: 'Smooth and creamy rich British milk chocolate bar',
    isClothing: false,
    variants: [
      { sku: 'CONF-DAIRYMILK-38G', barcode: '896400020126', costPrice: 110, sellingPrice: 140, stock: 70, threshold: 15 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Nimco Special Spicy Mix 250g Pack',
    description: 'Traditional fried savory mix with daal, sev, peanuts, and masala',
    isClothing: false,
    variants: [
      { sku: 'SNAK-NIMCO-250G', barcode: '896400020133', costPrice: 150, sellingPrice: 210, stock: 40, threshold: 8 },
    ],
  },

  // ==========================================
  // PERSONAL CARE & TOILETRIES
  // ==========================================
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Lifebuoy Total 10 Germ Protection Soap 115g',
    description: 'Antiseptic active silver formula daily bath soap',
    isClothing: false,
    variants: [
      { sku: 'PC-LIFEBUOY-115G', barcode: '896400030019', costPrice: 90, sellingPrice: 115, stock: 85, threshold: 15 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Lux Velvet Touch Jasmine & Almond Oil Soap 135g',
    description: 'Moisturizing beauty bath soap bar with floral fragrance',
    isClothing: false,
    variants: [
      { sku: 'PC-LUX-135G', barcode: '896400030026', costPrice: 120, sellingPrice: 150, stock: 75, threshold: 15 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Dettol Original Antiseptic Disinfectant Liquid 250ml',
    description: 'Trusted personal hygiene and first aid antiseptic liquid',
    isClothing: false,
    variants: [
      { sku: 'PC-DETTOL-250ML', barcode: '896400030033', costPrice: 340, sellingPrice: 410, stock: 35, threshold: 8 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Head & Shoulders Classic Clean Anti-Dandruff Shampoo 180ml',
    description: 'Clinically proven zinc pyrithione anti-dandruff hair shampoo',
    isClothing: false,
    variants: [
      { sku: 'PC-HS-SHAMPOO-180ML', barcode: '896400030040', costPrice: 420, sellingPrice: 490, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Sunsilk Black Shine Amla Pearl Shampoo 180ml',
    description: 'Nourishing hair shampoo for long-lasting glossy black shine',
    isClothing: false,
    variants: [
      { sku: 'PC-SUNSILK-180ML', barcode: '896400030057', costPrice: 380, sellingPrice: 450, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Colgate Total 12-Hour Protection Toothpaste 100g',
    description: 'Antibacterial cavity protection whole mouth toothpaste',
    isClothing: false,
    variants: [
      { sku: 'PC-COLGATE-100G', barcode: '896400030064', costPrice: 190, sellingPrice: 240, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Sensodyne Rapid Relief Toothpaste 100g',
    description: 'Clinically proven fast relief for sensitive teeth enamel',
    isClothing: false,
    variants: [
      { sku: 'PC-SENSODYNE-100G', barcode: '896400030071', costPrice: 320, sellingPrice: 390, stock: 35, threshold: 8 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Gillette Blue II Plus Disposable Razors (Pack of 5)',
    description: 'Twin thin comfort blades with lubrastrip for clean shaving',
    isClothing: false,
    variants: [
      { sku: 'PC-GILLETTE-B2-5PK', barcode: '896400030088', costPrice: 260, sellingPrice: 340, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Nivea Men Fresh Active Deodorant Body Spray 150ml',
    description: '48-hour ocean extract refreshing anti-odor body spray',
    isClothing: false,
    variants: [
      { sku: 'PC-NIVEA-SPRAY', barcode: '896400030095', costPrice: 650, sellingPrice: 820, stock: 25, threshold: 5 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Pond\'s Pure Bright Facial Foam Clay Wash 100g',
    description: 'Activated charcoal detox deep pore cleansing face wash',
    isClothing: false,
    variants: [
      { sku: 'PC-PONDS-100G', barcode: '896400030101', costPrice: 280, sellingPrice: 360, stock: 35, threshold: 8 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Parachute 100% Pure Coconut Hair Oil 200ml',
    description: 'Cold pressed naturally filtered edible coconut hair oil',
    isClothing: false,
    variants: [
      { sku: 'PC-PARACHUTE-200ML', barcode: '896400030118', costPrice: 270, sellingPrice: 340, stock: 40, threshold: 8 },
    ],
  },

  // ==========================================
  // HOUSEHOLD & CLEANING SUPPLIES
  // ==========================================
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Surf Excel Quick Wash Detergent Powder 1kg Pouch',
    description: 'Superior stain removal washing machine & bucket powder',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-SURFEXCEL-1KG', barcode: '896400040018', costPrice: 540, sellingPrice: 620, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Ariel Original Washing Powder 1kg Pouch',
    description: 'Brilliant whiteness and tough stain defense laundry powder',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-ARIEL-1KG', barcode: '896400040025', costPrice: 530, sellingPrice: 610, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Vim Dishwashing Bar Lemon Power 300g',
    description: 'Grease-cutting lemon extract bar with scrubbing pad',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-VIM-BAR-300G', barcode: '896400040032', costPrice: 75, sellingPrice: 95, stock: 70, threshold: 15 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Lemon Max Liquid Dishwash 500ml Bottle',
    description: 'Ultra concentrated liquid dishwashing detergent',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-MAX-500ML', barcode: '896400040049', costPrice: 210, sellingPrice: 260, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Harpic Power Plus 10x Max Toilet Cleaner 500ml',
    description: 'Disinfectant toilet bowl stain remover and germ killer',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-HARPIC-500ML', barcode: '896400040056', costPrice: 280, sellingPrice: 340, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Finis Black Phenyl Floor Cleaner 1 Litre Bottle',
    description: 'Heavy duty deodorizing floor disinfectant phenyl',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-PHENYL-1L', barcode: '896400040063', costPrice: 160, sellingPrice: 210, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Mortein Powergard All Insect Killer Spray 400ml',
    description: 'Instant knockdown aerosol insecticide spray for flies and mosquitoes',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-MORTEIN-400ML', barcode: '896400040070', costPrice: 480, sellingPrice: 580, stock: 30, threshold: 6 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Rose Petal Pop-up Luxury Facial Tissues (150 Sheets)',
    description: 'Soft 2-ply absorbent white facial tissues in dispenser box',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-ROSEPETAL-150', barcode: '896400040087', costPrice: 140, sellingPrice: 180, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Scotch-Brite Heavy Duty Scrub Sponges (Pack of 3)',
    description: 'Antimicrobial scouring fiber kitchen sponge pads',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-SCRUB-3PK', barcode: '896400040094', costPrice: 130, sellingPrice: 175, stock: 50, threshold: 10 },
    ],
  },

  // ==========================================
  // ELECTRICAL & HARDWARE SUPPLIES (A to Z)
  // ==========================================
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Philips LED Bulb 12 Watt Pin Base (B22) Daylight',
    description: 'Energy saving bright 6500K cool daylight pin-base LED bulb',
    isClothing: false,
    variants: [
      { sku: 'ELEC-LED-12W-B22', barcode: '896400050017', costPrice: 290, sellingPrice: 390, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Philips LED Bulb 18 Watt Screw Base (E27) Daylight',
    description: 'High lumen output screw-base E27 LED bulb for hall and rooms',
    isClothing: false,
    variants: [
      { sku: 'ELEC-LED-18W-E27', barcode: '896400050024', costPrice: 390, sellingPrice: 520, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Osaka Emergency Rechargeable LED Bulb 12W with Lithium Battery',
    description: 'Auto power-cut lighting rechargeable bulb with 3-hour backup',
    isClothing: false,
    variants: [
      { sku: 'ELEC-EMERG-LED-12W', barcode: '896400050031', costPrice: 650, sellingPrice: 890, stock: 25, threshold: 5 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Universal Multi-Plug 3-Pin Adapter with Neon Power Indicator',
    description: 'Multi-device universal socket converter for UK/US/EU pins',
    isClothing: false,
    variants: [
      { sku: 'ELEC-MPLUG-3PIN', barcode: '896400050048', costPrice: 140, sellingPrice: 220, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Heavy Duty Power Extension Board 5-Yard 4-Socket Strip',
    description: 'Surge protected fire-resistant power extension cord with master switch',
    isClothing: false,
    variants: [
      { sku: 'ELEC-EXT-BOARD-5Y', barcode: '896400050055', costPrice: 650, sellingPrice: 950, stock: 25, threshold: 5 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'PVC Nitto Insulation Tape (Black) 10-Yard Roll',
    description: 'Waterproof high-dielectric flame retardant electrical tape',
    isClothing: false,
    variants: [
      { sku: 'ELEC-TAPE-NITTO-BLK', barcode: '896400050062', costPrice: 45, sellingPrice: 70, stock: 120, threshold: 25 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'PVC Color Insulation Tape Multi-pack (Red, Yellow, Blue)',
    description: 'Phase identification colored electrical wire insulation tape 3-pack',
    isClothing: false,
    variants: [
      { sku: 'ELEC-TAPE-COLOR-3PK', barcode: '896400050079', costPrice: 120, sellingPrice: 190, stock: 60, threshold: 15 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Toshiba Heavy Duty AA Dry Cell Batteries (Pack of 4)',
    description: '1.5V zinc-carbon batteries for remotes, clocks, and torches',
    isClothing: false,
    variants: [
      { sku: 'ELEC-BATT-AA-4PK', barcode: '896400050086', costPrice: 160, sellingPrice: 240, stock: 80, threshold: 20 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Toshiba Heavy Duty AAA Dry Cell Batteries (Pack of 4)',
    description: '1.5V slim batteries for AC and TV remote controllers',
    isClothing: false,
    variants: [
      { sku: 'ELEC-BATT-AAA-4PK', barcode: '896400050093', costPrice: 160, sellingPrice: 240, stock: 80, threshold: 20 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Duracell Ultra Alkaline AA Batteries (Pack of 2)',
    description: 'Long-lasting high performance alkaline cells with power check',
    isClothing: false,
    variants: [
      { sku: 'ELEC-DURACELL-AA-2PK', barcode: '896400050109', costPrice: 280, sellingPrice: 380, stock: 40, threshold: 10 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Electric Neon Voltage Tester Screwdriver Pen',
    description: '100V-500V insulated electric test pencil for checking live current',
    isClothing: false,
    variants: [
      { sku: 'ELEC-TESTER-PEN', barcode: '896400050116', costPrice: 80, sellingPrice: 140, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Pakistan Cables 23/76 Twin Flat Copper Wire (10-Meter Roll)',
    description: '99.9% pure copper PVC insulated flexible cable for home wiring',
    isClothing: false,
    variants: [
      { sku: 'ELEC-WIRE-23-76-10M', barcode: '896400050123', costPrice: 550, sellingPrice: 750, stock: 20, threshold: 5 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Nylon Heavy Cable Ties 8-Inch (Pack of 100 Pieces)',
    description: 'Self-locking UV-resistant black wire fastening zip ties',
    isClothing: false,
    variants: [
      { sku: 'ELEC-CABLE-TIES-100', barcode: '896400050130', costPrice: 130, sellingPrice: 210, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Piano 1-Way Flush Wall Light Switch 10A',
    description: 'Classic durable white wall light switch button',
    isClothing: false,
    variants: [
      { sku: 'ELEC-SWITCH-PIANO-1W', barcode: '896400050147', costPrice: 90, sellingPrice: 150, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Universal 2-in-1 Wall Socket 13A with Switch',
    description: 'Shuttered 3-pin universal combination switch and socket',
    isClothing: false,
    variants: [
      { sku: 'ELEC-SOCKET-UNIV-13A', barcode: '896400050154', costPrice: 160, sellingPrice: 250, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Single Pole Miniature Circuit Breaker (MCB) 16 Amp',
    description: 'Overload and short circuit protection breaker for home DB boards',
    isClothing: false,
    variants: [
      { sku: 'ELEC-BREAKER-16A', barcode: '896400050161', costPrice: 380, sellingPrice: 520, stock: 25, threshold: 5 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Rechargeable LED Mosquito Swatter Bat with USB Charger',
    description: 'Electric mosquito killer racket with safety discharge mesh',
    isClothing: false,
    variants: [
      { sku: 'ELEC-MOSQ-BAT-RECH', barcode: '896400050178', costPrice: 520, sellingPrice: 750, stock: 20, threshold: 5 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Solid Brass Padlock (Tala) 40mm Heavy Duty with 3 Keys',
    description: 'Hardened shackle tamper-resistant lock for shops and gates',
    isClothing: false,
    variants: [
      { sku: 'HARD-PADLOCK-40MM', barcode: '896400050185', costPrice: 260, sellingPrice: 380, stock: 35, threshold: 8 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Super Elfy Instant Cyanoacrylate Adhesive 3g Tube',
    description: 'Fast curing bond for plastic, rubber, metal, and shoe soles',
    isClothing: false,
    variants: [
      { sku: 'HARD-ELFY-3G', barcode: '896400050192', costPrice: 35, sellingPrice: 50, stock: 150, threshold: 30 },
    ],
  },

  // ==========================================
  // STATIONERY & SCHOOL SUPPLIES
  // ==========================================
  {
    categoryKey: 'STATIONERY',
    name: 'Piano Crystal Ballpoint Pens (Box of 10 Blue)',
    description: 'Smooth writing 0.8mm medium tip blue ballpoint pens',
    isClothing: false,
    variants: [
      { sku: 'STAT-PIANO-PEN-10PK', barcode: '896400060016', costPrice: 150, sellingPrice: 220, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'STATIONERY',
    name: 'Dollar SP-10 Permanent Marker Bullet Tip (Black)',
    description: 'Waterproof fast drying alcohol based marker for paper, plastic, and metal',
    isClothing: false,
    variants: [
      { sku: 'STAT-DOLLAR-MARK-BLK', barcode: '896400060023', costPrice: 45, sellingPrice: 70, stock: 60, threshold: 15 },
    ],
  },
  {
    categoryKey: 'STATIONERY',
    name: 'Hardcover Register Notebook 200 Pages (A4 Standard)',
    description: 'Lined register ledger for accounting, stock lists, and office notes',
    isClothing: false,
    variants: [
      { sku: 'STAT-REG-A4-200P', barcode: '896400060030', costPrice: 190, sellingPrice: 280, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'STATIONERY',
    name: 'Transparent Packing Tape 2-Inch 50-Yard Roll',
    description: 'Heavy stick adhesive clear carton sealing tape',
    isClothing: false,
    variants: [
      { sku: 'STAT-TAPE-PACK-2IN', barcode: '896400060047', costPrice: 110, sellingPrice: 170, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'STATIONERY',
    name: 'Kangaro Heavy Duty Paper Stapler #10 with Box of Staples',
    description: 'Steel body desk stapler with reloadable 1000 staple pins',
    isClothing: false,
    variants: [
      { sku: 'STAT-STAPLER-NO10', barcode: '896400060054', costPrice: 180, sellingPrice: 260, stock: 30, threshold: 6 },
    ],
  },

  // ==========================================
  // CLOTHING & APPAREL (Multi-variant Apparel)
  // ==========================================
  {
    categoryKey: 'CLOTHING',
    name: 'Men\'s Classic Wash & Wear Kurta Shalwar Suit',
    description: 'Wrinkle-resistant fine polyester-viscose traditional Pakistani 2-piece kurta shalwar',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-KS-WHT-M', variantName: 'Crisp White / M', size: 'M', color: 'White', costPrice: 2100, sellingPrice: 3400, stock: 15, threshold: 3 },
      { sku: 'CLOTH-KS-WHT-L', variantName: 'Crisp White / L', size: 'L', color: 'White', costPrice: 2100, sellingPrice: 3400, stock: 20, threshold: 4 },
      { sku: 'CLOTH-KS-WHT-XL', variantName: 'Crisp White / XL', size: 'XL', color: 'White', costPrice: 2100, sellingPrice: 3400, stock: 12, threshold: 3 },
      { sku: 'CLOTH-KS-GRY-M', variantName: 'Charcoal Grey / M', size: 'M', color: 'Charcoal', costPrice: 2100, sellingPrice: 3400, stock: 14, threshold: 3 },
      { sku: 'CLOTH-KS-GRY-L', variantName: 'Charcoal Grey / L', size: 'L', color: 'Charcoal', costPrice: 2100, sellingPrice: 3400, stock: 18, threshold: 4 },
      { sku: 'CLOTH-KS-NVY-L', variantName: 'Midnight Navy / L', size: 'L', color: 'Navy', costPrice: 2100, sellingPrice: 3400, stock: 16, threshold: 4 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Men\'s Formal Oxford Cotton Dress Shirt',
    description: '100% fine cotton long sleeve button-down collar formal office shirt',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-SHIRT-BLU-39', variantName: 'Sky Blue / 39 (M)', size: '39 (M)', color: 'Sky Blue', costPrice: 1250, sellingPrice: 2200, stock: 15, threshold: 3 },
      { sku: 'CLOTH-SHIRT-BLU-41', variantName: 'Sky Blue / 41 (L)', size: '41 (L)', color: 'Sky Blue', costPrice: 1250, sellingPrice: 2200, stock: 18, threshold: 4 },
      { sku: 'CLOTH-SHIRT-WHT-39', variantName: 'Crisp White / 39 (M)', size: '39 (M)', color: 'White', costPrice: 1250, sellingPrice: 2200, stock: 16, threshold: 3 },
      { sku: 'CLOTH-SHIRT-WHT-41', variantName: 'Crisp White / 41 (L)', size: '41 (L)', color: 'White', costPrice: 1250, sellingPrice: 2200, stock: 20, threshold: 4 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Men\'s Premium Pique Polo T-Shirt',
    description: 'Breathable combed cotton pique knit casual polo with ribbed collar',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-POLO-BLK-M', variantName: 'Jet Black / M', size: 'M', color: 'Black', costPrice: 750, sellingPrice: 1350, stock: 20, threshold: 5 },
      { sku: 'CLOTH-POLO-BLK-L', variantName: 'Jet Black / L', size: 'L', color: 'Black', costPrice: 750, sellingPrice: 1350, stock: 22, threshold: 5 },
      { sku: 'CLOTH-POLO-NVY-M', variantName: 'Royal Navy / M', size: 'M', color: 'Navy', costPrice: 750, sellingPrice: 1350, stock: 18, threshold: 4 },
      { sku: 'CLOTH-POLO-NVY-L', variantName: 'Royal Navy / L', size: 'L', color: 'Navy', costPrice: 750, sellingPrice: 1350, stock: 20, threshold: 5 },
      { sku: 'CLOTH-POLO-MRN-L', variantName: 'Deep Maroon / L', size: 'L', color: 'Maroon', costPrice: 750, sellingPrice: 1350, stock: 15, threshold: 3 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Men\'s Regular Straight Denim Jeans',
    description: 'Durable 12oz stretch denim jeans with 5-pocket western styling',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-JEANS-IND-32', variantName: 'Dark Indigo / 32', size: '32', color: 'Dark Indigo', costPrice: 1450, sellingPrice: 2450, stock: 18, threshold: 4 },
      { sku: 'CLOTH-JEANS-IND-34', variantName: 'Dark Indigo / 34', size: '34', color: 'Dark Indigo', costPrice: 1450, sellingPrice: 2450, stock: 20, threshold: 4 },
      { sku: 'CLOTH-JEANS-IND-36', variantName: 'Dark Indigo / 36', size: '36', color: 'Dark Indigo', costPrice: 1450, sellingPrice: 2450, stock: 14, threshold: 3 },
      { sku: 'CLOTH-JEANS-BLK-32', variantName: 'Solid Black / 32', size: '32', color: 'Black', costPrice: 1450, sellingPrice: 2450, stock: 16, threshold: 3 },
      { sku: 'CLOTH-JEANS-BLK-34', variantName: 'Solid Black / 34', size: '34', color: 'Black', costPrice: 1450, sellingPrice: 2450, stock: 18, threshold: 4 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Men\'s Pure Combed Cotton Innerwear Vests (Baniyan)',
    description: 'Sweat-absorbent ribbed white sleeveless undergarment undershirt',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-VEST-WHT-M', variantName: 'White / 36 (M)', size: '36 (M)', color: 'White', costPrice: 260, sellingPrice: 420, stock: 30, threshold: 6 },
      { sku: 'CLOTH-VEST-WHT-L', variantName: 'White / 38 (L)', size: '38 (L)', color: 'White', costPrice: 260, sellingPrice: 420, stock: 35, threshold: 6 },
      { sku: 'CLOTH-VEST-WHT-XL', variantName: 'White / 40 (XL)', size: '40 (XL)', color: 'White', costPrice: 260, sellingPrice: 420, stock: 25, threshold: 5 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Women\'s Ready-to-Wear Digital Printed Lawn Kurti',
    description: 'Stitched single-piece premium lawn kurti with lace neck detailing',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-KURTI-EMR-S', variantName: 'Emerald Floral / Small', size: 'Small', color: 'Emerald Green', costPrice: 1150, sellingPrice: 1950, stock: 12, threshold: 3 },
      { sku: 'CLOTH-KURTI-EMR-M', variantName: 'Emerald Floral / Medium', size: 'Medium', color: 'Emerald Green', costPrice: 1150, sellingPrice: 1950, stock: 15, threshold: 3 },
      { sku: 'CLOTH-KURTI-EMR-L', variantName: 'Emerald Floral / Large', size: 'Large', color: 'Emerald Green', costPrice: 1150, sellingPrice: 1950, stock: 10, threshold: 2 },
      { sku: 'CLOTH-KURTI-AMB-M', variantName: 'Sunset Amber / Medium', size: 'Medium', color: 'Sunset Amber', costPrice: 1150, sellingPrice: 1950, stock: 14, threshold: 3 },
      { sku: 'CLOTH-KURTI-AMB-L', variantName: 'Sunset Amber / Large', size: 'Large', color: 'Sunset Amber', costPrice: 1150, sellingPrice: 1950, stock: 12, threshold: 3 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Women\'s Unstitched 3-Piece Lawn Embroidered Suit',
    description: 'Embroidered lawn shirt, dyed cambric trouser, and voile dupatta',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-3PC-MAG-UN', variantName: 'Royal Magenta / Unstitched', size: 'Unstitched', color: 'Magenta', costPrice: 2400, sellingPrice: 3850, stock: 20, threshold: 4 },
      { sku: 'CLOTH-3PC-MNT-UN', variantName: 'Pastel Mint / Unstitched', size: 'Unstitched', color: 'Mint Green', costPrice: 2400, sellingPrice: 3850, stock: 18, threshold: 4 },
      { sku: 'CLOTH-3PC-GLD-UN', variantName: 'Mustard Gold / Unstitched', size: 'Unstitched', color: 'Mustard Gold', costPrice: 2400, sellingPrice: 3850, stock: 15, threshold: 3 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Women\'s Four-Way Stretchable Lycra Tights / Leggings',
    description: 'Ankle length opaque soft cotton-lycra daily wear tights',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-TIGHTS-BLK-FS', variantName: 'Jet Black / Free Size', size: 'Free Size', color: 'Black', costPrice: 340, sellingPrice: 580, stock: 35, threshold: 6 },
      { sku: 'CLOTH-TIGHTS-WHT-FS', variantName: 'Milk White / Free Size', size: 'Free Size', color: 'White', costPrice: 340, sellingPrice: 580, stock: 25, threshold: 5 },
      { sku: 'CLOTH-TIGHTS-SKN-FS', variantName: 'Skin (Beige) / Free Size', size: 'Free Size', color: 'Beige', costPrice: 340, sellingPrice: 580, stock: 25, threshold: 5 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Women\'s Chiffon Plain Dyed Dupatta (2.5 Meters)',
    description: 'Lightweight flowy crushed chiffon dupatta with picot edges',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-DUPATTA-BLK', variantName: 'Jet Black / Free Size', size: 'Free Size', color: 'Black', costPrice: 280, sellingPrice: 460, stock: 25, threshold: 5 },
      { sku: 'CLOTH-DUPATTA-RED', variantName: 'Crimson Red / Free Size', size: 'Free Size', color: 'Red', costPrice: 280, sellingPrice: 460, stock: 20, threshold: 4 },
      { sku: 'CLOTH-DUPATTA-NVY', variantName: 'Royal Navy / Free Size', size: 'Free Size', color: 'Navy', costPrice: 280, sellingPrice: 460, stock: 20, threshold: 4 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Kids\' Boys Graphic Pure Cotton T-Shirt',
    description: 'Fun superhero printed round neck soft t-shirt for children',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-KIDS-TEE-BLU-6', variantName: 'Royal Blue / Age 5-6', size: 'Age 5-6', color: 'Royal Blue', costPrice: 420, sellingPrice: 750, stock: 15, threshold: 3 },
      { sku: 'CLOTH-KIDS-TEE-BLU-8', variantName: 'Royal Blue / Age 7-8', size: 'Age 7-8', color: 'Royal Blue', costPrice: 420, sellingPrice: 750, stock: 18, threshold: 4 },
      { sku: 'CLOTH-KIDS-TEE-RED-6', variantName: 'Fire Red / Age 5-6', size: 'Age 5-6', color: 'Red', costPrice: 420, sellingPrice: 750, stock: 15, threshold: 3 },
      { sku: 'CLOTH-KIDS-TEE-RED-8', variantName: 'Fire Red / Age 7-8', size: 'Age 7-8', color: 'Red', costPrice: 420, sellingPrice: 750, stock: 18, threshold: 4 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Unisex Winter Fleece Pullover Hoodie',
    description: 'Heavy 320 GSM brushed inner fleece warm winter hoodie with kangaroo pocket',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-HOODIE-CHR-M', variantName: 'Heather Charcoal / M', size: 'M', color: 'Charcoal', costPrice: 1100, sellingPrice: 1850, stock: 14, threshold: 3 },
      { sku: 'CLOTH-HOODIE-CHR-L', variantName: 'Heather Charcoal / L', size: 'L', color: 'Charcoal', costPrice: 1100, sellingPrice: 1850, stock: 16, threshold: 3 },
      { sku: 'CLOTH-HOODIE-BLK-M', variantName: 'Solid Black / M', size: 'M', color: 'Black', costPrice: 1100, sellingPrice: 1850, stock: 18, threshold: 4 },
      { sku: 'CLOTH-HOODIE-BLK-L', variantName: 'Solid Black / L', size: 'L', color: 'Black', costPrice: 1100, sellingPrice: 1850, stock: 20, threshold: 4 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Men\'s Formal Ribbed Cotton Socks (Pack of 3 Pairs)',
    description: 'Breathable reinforced toe and heel business dress socks',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-SOCKS-BLK-3PK', variantName: 'Black & Charcoal / Free Size', size: 'Free Size', color: 'Black/Grey', costPrice: 240, sellingPrice: 420, stock: 40, threshold: 8 },
      { sku: 'CLOTH-SOCKS-NVY-3PK', variantName: 'Navy & Slate / Free Size', size: 'Free Size', color: 'Navy/Slate', costPrice: 240, sellingPrice: 420, stock: 35, threshold: 8 },
    ],
  },

  // ==========================================
  // GARMENT ACCESSORIES & TAILORING PARTS
  // ==========================================
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Tailoring Spool Sewing Thread (Box of 12 Assorted Colors)',
    description: 'High tenacity 2-ply spun polyester sewing machine thread spools',
    isClothing: false,
    variants: [
      { sku: 'PART-THREAD-BOX-12', barcode: '896400070015', costPrice: 240, sellingPrice: 380, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'White Sewing Thread Spool (Large 1000m Industrial Reel)',
    description: 'Smooth lint-free white polyester sewing thread spool',
    isClothing: false,
    variants: [
      { sku: 'PART-THREAD-WHT-1000M', barcode: '896400070022', costPrice: 90, sellingPrice: 150, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Black Sewing Thread Spool (Large 1000m Industrial Reel)',
    description: 'Colorfast deep black sewing thread spool',
    isClothing: false,
    variants: [
      { sku: 'PART-THREAD-BLK-1000M', barcode: '896400070039', costPrice: 90, sellingPrice: 150, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Shirt & Kurta Plastic Pearl Buttons (Pack of 100 Pieces)',
    description: '14L glossy round 4-hole buttons for kurtas and shirts',
    isClothing: false,
    variants: [
      { sku: 'PART-BUTTONS-PEARL-100', barcode: '896400070046', costPrice: 110, sellingPrice: 190, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Metal Pant Zippers 7-Inch Brass Finish (Pack of 10)',
    description: 'Durable #4 brass metal teeth locking fly zippers for jeans and trousers',
    isClothing: false,
    variants: [
      { sku: 'PART-ZIP-METAL-7IN', barcode: '896400070053', costPrice: 170, sellingPrice: 280, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Invisible Nylon Dress Zippers 18-Inch (Pack of 5 Assorted)',
    description: 'Concealed nylon coil zippers for ladies suits, frocks, and skirts',
    isClothing: false,
    variants: [
      { sku: 'PART-ZIP-INVIS-18IN', barcode: '896400070060', costPrice: 120, sellingPrice: 200, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Heavy Shalwar & Trouser Elastic Band 1.5-Inch (Roll of 10 Meters)',
    description: 'High elasticity knit stretch band for waistbands and pajamas',
    isClothing: false,
    variants: [
      { sku: 'PART-ELASTIC-1.5IN-10M', barcode: '896400070077', costPrice: 220, sellingPrice: 360, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Tailor Hand Sewing Needles (Assorted Compact Dial Box of 30)',
    description: 'Sharp nickel-plated steel hand embroidery and repair needles',
    isClothing: false,
    variants: [
      { sku: 'PART-NEEDLES-BOX-30', barcode: '896400070084', costPrice: 50, sellingPrice: 90, stock: 80, threshold: 15 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Tailor Chalk Triangles (Box of 4 Colors for Fabric Marking)',
    description: 'Erasable colored tailor chalk for pattern drafting and alterations',
    isClothing: false,
    variants: [
      { sku: 'PART-CHALK-4PK', barcode: '896400070091', costPrice: 70, sellingPrice: 120, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Fiberglass Tailor Measuring Tape (60-Inch / 150cm)',
    description: 'Non-stretch dual-scale inches and centimeters flexible measuring tape',
    isClothing: false,
    variants: [
      { sku: 'PART-MEASURE-TAPE-60IN', barcode: '896400070107', costPrice: 55, sellingPrice: 95, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Safety Pins Nickel Plated (Card of 48 Assorted Sizes)',
    description: 'Rust-resistant clasp safety pins for clothing fitting and drapery',
    isClothing: false,
    variants: [
      { sku: 'PART-SAFETY-PINS-48PK', barcode: '896400070114', costPrice: 40, sellingPrice: 75, stock: 70, threshold: 15 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Tailoring Fabric Cutting Scissors 9-Inch Stainless Steel',
    description: 'Heavy duty ergonomic razor-sharp fabric shears for cloth cutting',
    isClothing: false,
    variants: [
      { sku: 'PART-SCISSORS-9IN', barcode: '896400070121', costPrice: 380, sellingPrice: 560, stock: 25, threshold: 5 },
    ],
  },

  // ==========================================
  // ADDITIONAL GROCERIES & PANTRY STAPLES
  // ==========================================
  {
    categoryKey: 'GROCERIES',
    name: 'Dalda Banaspati Ghee 2.5kg Tin Can',
    description: 'Traditional tin can hydrogenated cooking ghee with vitamin A & D',
    isClothing: false,
    variants: [
      { sku: 'GROC-DALDA-TIN-2.5KG', barcode: '896400010202', costPrice: 1220, sellingPrice: 1350, stock: 25, threshold: 5 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Mehran Ginger Garlic Paste (Adrak Lehsan) 330g Jar',
    description: 'Fresh prepared aromatic kitchen cooking paste in glass jar',
    isClothing: false,
    variants: [
      { sku: 'GROC-GINGER-GARLIC-330G', barcode: '896400010219', costPrice: 160, sellingPrice: 210, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Shan Special Chaat Masala 100g Box',
    description: 'Tangy and spicy sprinkle seasoning for fruit chaat and snacks',
    isClothing: false,
    variants: [
      { sku: 'GROC-SHAN-CHAAT-100G', barcode: '896400010226', costPrice: 90, sellingPrice: 120, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Ahmed Mixed Pickle in Oil (Mix Achar) 1kg Glass Jar',
    description: 'Traditional spiced mango, lime, and chilli pickle in mustard oil',
    isClothing: false,
    variants: [
      { sku: 'GROC-AHMED-ACHAR-1KG', barcode: '896400010233', costPrice: 320, sellingPrice: 395, stock: 30, threshold: 6 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Knorr Chicken Instant Noodles (Family Pack of 4)',
    description: 'Quick cooking wheat noodles with savory chicken soup seasoning',
    isClothing: false,
    variants: [
      { sku: 'GROC-KNORR-NOODLE-4PK', barcode: '896400010240', costPrice: 210, sellingPrice: 260, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Kolson Elbow Macaroni Pasta 400g Pack',
    description: '100% durum wheat semolina Italian style elbow macaroni',
    isClothing: false,
    variants: [
      { sku: 'GROC-KOLSON-MAC-400G', barcode: '896400010257', costPrice: 130, sellingPrice: 170, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Nurpur Pure Salted Table Butter 200g Pack',
    description: 'Fresh pasteurized pure dairy cream salted table butter',
    isClothing: false,
    variants: [
      { sku: 'GROC-NURPUR-BUTTER-200G', barcode: '896400010264', costPrice: 280, sellingPrice: 340, stock: 35, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Nestle Everyday Dairy Powder Milk 375g Pouch',
    description: 'Special tea creamer spray dried powdered dairy milk',
    isClothing: false,
    variants: [
      { sku: 'GROC-EVERYDAY-375G', barcode: '896400010271', costPrice: 420, sellingPrice: 485, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Bake Parlor Synthetic White Cooking Vinegar 800ml Bottle',
    description: 'All-purpose pickling, dressing, and culinary white vinegar',
    isClothing: false,
    variants: [
      { sku: 'GROC-VINEGAR-800ML', barcode: '896400010288', costPrice: 85, sellingPrice: 120, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Bake Parlor Naturally Brewed Soy Sauce 800ml Bottle',
    description: 'Savory Chinese cuisine seasoning and marinating dark soy sauce',
    isClothing: false,
    variants: [
      { sku: 'GROC-SOYSAUCE-800ML', barcode: '896400010295', costPrice: 120, sellingPrice: 165, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Shangrila Hot & Spicy Chilli Garlic Sauce 800g Pouch',
    description: 'Tangy red chilli and crushed garlic dipping table sauce',
    isClothing: false,
    variants: [
      { sku: 'GROC-CHILLI-GARLIC-800G', barcode: '896400010301', costPrice: 290, sellingPrice: 350, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Daal Mash Washed (White Urad Lentils) 1kg',
    description: 'Dehusked white whole pulse for Pakistani dhaba style daal mash',
    isClothing: false,
    variants: [
      { sku: 'GROC-DAAL-MASH-1KG', barcode: '896400010318', costPrice: 380, sellingPrice: 450, stock: 35, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Safed Chana (White Chickpeas / Kabuli) 1kg',
    description: 'Premium jumbo white chickpeas for chana chaat and curry',
    isClothing: false,
    variants: [
      { sku: 'GROC-SAFED-CHANA-1KG', barcode: '896400010325', costPrice: 320, sellingPrice: 380, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Kala Chana (Black Chickpeas) 1kg',
    description: 'High protein natural black desi chickpeas',
    isClothing: false,
    variants: [
      { sku: 'GROC-KALA-CHANA-1KG', barcode: '896400010332', costPrice: 230, sellingPrice: 280, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Besan (100% Pure Gram Flour) 1kg Pouch',
    description: 'Fine ground chana daal gram flour for pakoras and sweets',
    isClothing: false,
    variants: [
      { sku: 'GROC-BESAN-1KG', barcode: '896400010349', costPrice: 250, sellingPrice: 300, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Maida (Fine Refined White Flour) 1kg Pouch',
    description: 'Double refined all-purpose flour for baking, samosas, and parathas',
    isClothing: false,
    variants: [
      { sku: 'GROC-MAIDA-1KG', barcode: '896400010356', costPrice: 130, sellingPrice: 160, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GROCERIES',
    name: 'Suji (Semolina Wheat Granules) 1kg Pouch',
    description: 'Coarse purified wheat semolina for halwa, panjiri, and porridge',
    isClothing: false,
    variants: [
      { sku: 'GROC-SUJI-1KG', barcode: '896400010363', costPrice: 140, sellingPrice: 175, stock: 40, threshold: 8 },
    ],
  },

  // ==========================================
  // ADDITIONAL SNACKS & DRINKS
  // ==========================================
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Pakola Carbonated Cream Soda 1.5 Litre PET Bottle',
    description: 'Original patriotic green vanilla ice-cream flavored soda',
    isClothing: false,
    variants: [
      { sku: 'BEV-PAKOLA-1.5L', barcode: '896400020140', costPrice: 165, sellingPrice: 195, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: '7UP Crisp Lemon Soda 1.5 Litre PET Bottle',
    description: 'Caffeine-free refreshing clear citrus carbonated soft drink',
    isClothing: false,
    variants: [
      { sku: 'BEV-7UP-1.5L', barcode: '896400020157', costPrice: 170, sellingPrice: 200, stock: 55, threshold: 10 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Mountain Dew Citrus Soda 1.5 Litre PET Bottle',
    description: 'Bold high-energy citrus charged soft drink',
    isClothing: false,
    variants: [
      { sku: 'BEV-MTDEW-1.5L', barcode: '896400020164', costPrice: 170, sellingPrice: 200, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Bisconni Cocomo Chocolate Filled Snacks 50g Box',
    description: 'Crispy printed biscuit bites filled with creamy melted chocolate',
    isClothing: false,
    variants: [
      { sku: 'SNAK-COCOMO-50G', barcode: '896400020171', costPrice: 40, sellingPrice: 50, stock: 120, threshold: 24 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Bisconni Chocolatto Rich Chocolate Biscuits Half-Roll',
    description: 'Dark crunchy chocolate biscuits with liquid chocolate center',
    isClothing: false,
    variants: [
      { sku: 'SNAK-CHOCOLATTO-HR', barcode: '896400020188', costPrice: 45, sellingPrice: 60, stock: 80, threshold: 15 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Peek Freans Rio Strawberry Cream Biscuits Half-Roll',
    description: 'Fun crunchy sandwich biscuits filled with fruity strawberry cream',
    isClothing: false,
    variants: [
      { sku: 'SNAK-RIO-HR', barcode: '896400020195', costPrice: 40, sellingPrice: 50, stock: 90, threshold: 18 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Peek Freans Traditional Nan Khatai Bakery Biscuits 200g',
    description: 'Authentic crumbly cardamom and pistachio Pakistani bakery biscuits',
    isClothing: false,
    variants: [
      { sku: 'SNAK-NANKHATAI-200G', barcode: '896400020201', costPrice: 150, sellingPrice: 195, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Wavy Barbecue Crinkle Cut Potato Chips 50g Bag',
    description: 'Thick ridged potato crisps with smoky BBQ spice seasoning',
    isClothing: false,
    variants: [
      { sku: 'SNAK-WAVY-BBQ-50G', barcode: '896400020218', costPrice: 65, sellingPrice: 80, stock: 70, threshold: 15 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Slanty Salted Potato Rings Snack 40g Bag',
    description: 'Crispy salted ring puffs favorite snack for kids and adults',
    isClothing: false,
    variants: [
      { sku: 'SNAK-SLANTY-40G', barcode: '896400020225', costPrice: 32, sellingPrice: 40, stock: 85, threshold: 15 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Candyland Chilli Milli Tangy Jelly (Box of 24 Packets)',
    description: 'Hot, sweet, and tamarind sour chewy candy jellies',
    isClothing: false,
    variants: [
      { sku: 'CONF-CHILLIMILLI-24PK', barcode: '896400020232', costPrice: 200, sellingPrice: 260, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'SNACKS_BEVERAGES',
    name: 'Ding Dong Sweet Tutti Frutti Bubble Gum (Box of 24)',
    description: 'Classic bubble gum with sweet fruity flavor and collectible stickers',
    isClothing: false,
    variants: [
      { sku: 'CONF-DINGDONG-24PK', barcode: '896400020249', costPrice: 180, sellingPrice: 240, stock: 45, threshold: 10 },
    ],
  },

  // ==========================================
  // ADDITIONAL PERSONAL CARE & BABY CARE
  // ==========================================
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Dettol Skincare Antibacterial Liquid Hand Wash Pump 250ml',
    description: 'Moisturizing germ defense hand hygiene liquid soap with pump',
    isClothing: false,
    variants: [
      { sku: 'PC-DETTOL-HW-250ML', barcode: '896400030125', costPrice: 240, sellingPrice: 310, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Pampers Baby Dry Diapers Size 3 Midi (Pack of 32)',
    description: '12-hour leak lock magic gel absorbent disposable baby diapers',
    isClothing: false,
    variants: [
      { sku: 'PC-PAMPERS-SZ3-32PK', barcode: '896400030132', costPrice: 1450, sellingPrice: 1750, stock: 20, threshold: 4 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Johnson\'s Baby Powder Pure Cornstarch 200g Bottle',
    description: 'Gentle talc for baby soft skin comfort and moisture absorption',
    isClothing: false,
    variants: [
      { sku: 'PC-JOHNSON-POWDER-200G', barcode: '896400030149', costPrice: 320, sellingPrice: 410, stock: 30, threshold: 6 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Johnson\'s Baby Shampoo No More Tears Formula 200ml',
    description: 'Hypoallergenic tear-free gentle cleansing baby hair shampoo',
    isClothing: false,
    variants: [
      { sku: 'PC-JOHNSON-SHAMPOO-200ML', barcode: '896400030156', costPrice: 390, sellingPrice: 480, stock: 25, threshold: 5 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Vaseline Pure Petroleum Jelly Original Healing 100ml Jar',
    description: 'Triple-purified skin protectant for dry skin and chapped lips',
    isClothing: false,
    variants: [
      { sku: 'PC-VASELINE-100ML', barcode: '896400030163', costPrice: 180, sellingPrice: 235, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Glow & Lovely Advanced Multivitamin Daily Glow Cream 50g',
    description: 'Vitamin B3, C, and E brightening daily face moisturizer',
    isClothing: false,
    variants: [
      { sku: 'PC-GLOWLOVELY-50G', barcode: '896400030170', costPrice: 220, sellingPrice: 280, stock: 45, threshold: 8 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Colgate ZigZag Flexible Soft Bristle Toothbrush (Pack of 3)',
    description: 'Multi-angle cross bristles with tongue cleaner for deep plaque removal',
    isClothing: false,
    variants: [
      { sku: 'PC-BRUSH-ZIGZAG-3PK', barcode: '896400030187', costPrice: 190, sellingPrice: 260, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Medicam Dental Herbal Protective Toothpaste 100g',
    description: 'Traditional clove and mint herbal formula for gum ache and sensitivity',
    isClothing: false,
    variants: [
      { sku: 'PC-MEDICAM-100G', barcode: '896400030194', costPrice: 110, sellingPrice: 150, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'PERSONAL_CARE',
    name: 'Everyday Pure Cotton Ear Buds (Plastic Jar of 100 Stems)',
    description: 'Sterilized dual tipped soft natural cotton swabs for grooming',
    isClothing: false,
    variants: [
      { sku: 'PC-EARBUDS-100JAR', barcode: '896400030200', costPrice: 65, sellingPrice: 100, stock: 60, threshold: 12 },
    ],
  },

  // ==========================================
  // ADDITIONAL HOUSEHOLD & CLEANING
  // ==========================================
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Robin Liquid Fabric Whitening Blue 100ml Bottle',
    description: 'Ultramarine fabric brightener for dazzling white shalwar kameez and shirts',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-ROBIN-BLUE-100ML', barcode: '896400040100', costPrice: 75, sellingPrice: 110, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Bonus Tristar Detergent Washing Powder 1kg Pouch',
    description: 'Triple enzyme active power washing powder for everyday laundry',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-BONUS-1KG', barcode: '896400040117', costPrice: 320, sellingPrice: 380, stock: 45, threshold: 10 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Glint Glass & Shiny Surface Cleaner Spray 500ml',
    description: 'Streak-free sparkling shine spray for glass windows, mirrors, and screens',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-GLINT-500ML', barcode: '896400040124', costPrice: 190, sellingPrice: 250, stock: 35, threshold: 8 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Kiwi Quality Shoe Polish Paste (Black 50ml Metal Tin)',
    description: 'Carnauba wax leather nourishing waterproof black shoe polish',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-KIWI-TIN-BLK', barcode: '896400040131', costPrice: 95, sellingPrice: 140, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Tiger Mosquito Repellent Burning Coils (Pack of 10 Coils with Stand)',
    description: 'Smokeless active d-trans allethrin mosquito knockdown coils',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-COILS-TIGER-10PK', barcode: '896400040148', costPrice: 65, sellingPrice: 95, stock: 70, threshold: 15 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Heavy Duty Black Garbage Trash Bags 30-Gallon (Roll of 20)',
    description: 'Tear-resistant leak-proof biodegradable bin liner waste bags',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-TRASHBAG-30GAL', barcode: '896400040155', costPrice: 160, sellingPrice: 240, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'HOUSEHOLD_CLEANING',
    name: 'Rose Petal Maxima 2-Ply Kitchen Towel Rolls (Twin Pack)',
    description: 'Extra absorbent embossed paper towels for spills and oil wiping',
    isClothing: false,
    variants: [
      { sku: 'CLEAN-TOWEL-TWIN-ROLL', barcode: '896400040162', costPrice: 180, sellingPrice: 245, stock: 40, threshold: 8 },
    ],
  },

  // ==========================================
  // ADDITIONAL ELECTRICAL & HARDWARE ("ELECTRICITY & PARTS")
  // ==========================================
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Philips 7 Watt LED Bulb Pin Base (B22) Warm White (Yellow)',
    description: 'Cozy 3000K soft warm golden glow energy saver pin bulb',
    isClothing: false,
    variants: [
      { sku: 'ELEC-LED-7W-B22-WARM', barcode: '896400050208', costPrice: 220, sellingPrice: 310, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Philips 9 Watt LED Bulb Pin Base (B22) Cool Daylight',
    description: 'Standard domestic room lighting 6500K bright white LED bulb',
    isClothing: false,
    variants: [
      { sku: 'ELEC-LED-9W-B22-DAY', barcode: '896400050215', costPrice: 240, sellingPrice: 340, stock: 55, threshold: 10 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Osaka 24 Watt High-Lumen Round Surface LED Ceiling Lamp',
    description: 'Slim flush-mount surface ceiling light for drawing rooms and kitchens',
    isClothing: false,
    variants: [
      { sku: 'ELEC-CEILING-LED-24W', barcode: '896400050222', costPrice: 750, sellingPrice: 1050, stock: 20, threshold: 4 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Rotary Ceiling Fan Speed Dimmer Switch (Flush Wall Mount 400W)',
    description: 'Smooth hum-free step-less rotary fan speed controller',
    isClothing: false,
    variants: [
      { sku: 'ELEC-DIMMER-FAN-400W', barcode: '896400050239', costPrice: 150, sellingPrice: 240, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Heavy Duty 2-Pin Electric Power Plug Top (White) 10A',
    description: 'Shockproof polycarbonate casing plug for irons, lamps, and chargers',
    isClothing: false,
    variants: [
      { sku: 'ELEC-PLUG-2PIN-10A', barcode: '896400050246', costPrice: 40, sellingPrice: 75, stock: 90, threshold: 20 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Heavy Duty 3-Pin Power Plug Top (15A High-Load for AC/Heaters)',
    description: 'Brass earthed heavy gauge plug top for refrigerators and air conditioners',
    isClothing: false,
    variants: [
      { sku: 'ELEC-PLUG-3PIN-15A', barcode: '896400050253', costPrice: 90, sellingPrice: 150, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Brass Pin Pendant Hanging Lamp Bulb Holder (B22)',
    description: 'Heat resistant bakelite and brass threaded suspended ceiling holder',
    isClothing: false,
    variants: [
      { sku: 'ELEC-HOLDER-B22-PEND', barcode: '896400050260', costPrice: 50, sellingPrice: 90, stock: 70, threshold: 15 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Electric Soldering Iron 40W with Nickel Plated Tip',
    description: 'Fast heating pencil iron for repairing electronics, wires, and appliances',
    isClothing: false,
    variants: [
      { sku: 'ELEC-SOLDER-IRON-40W', barcode: '896400050277', costPrice: 260, sellingPrice: 390, stock: 25, threshold: 5 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Rosin Core Solder Wire 60/40 (50g Spool Dispenser)',
    description: 'High purity tin-lead alloy with flux core for clean electrical joints',
    isClothing: false,
    variants: [
      { sku: 'ELEC-SOLDER-WIRE-50G', barcode: '896400050284', costPrice: 180, sellingPrice: 280, stock: 35, threshold: 8 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Wire Stripper and Cable Cutter Plier Tool 7-Inch',
    description: 'Precision wire gauge stripping notches and wire looping holes',
    isClothing: false,
    variants: [
      { sku: 'ELEC-WIRE-STRIPPER-7IN', barcode: '896400050291', costPrice: 210, sellingPrice: 340, stock: 30, threshold: 6 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Plastic Wall Rawl Plugs (Gitti) with Steel Screws (Pack of 50)',
    description: 'Masonry wall anchor fixings for hanging mirrors, boards, and holders',
    isClothing: false,
    variants: [
      { sku: 'HARD-RAWL-PLUGS-50PK', barcode: '896400050307', costPrice: 70, sellingPrice: 120, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'PTFE Teflon Thread Seal Plumbing Tape 12mm x 10m Roll',
    description: 'Waterproof white plumber tape for sealing pipe threads and taps',
    isClothing: false,
    variants: [
      { sku: 'HARD-TEFLON-TAPE-12MM', barcode: '896400050314', costPrice: 35, sellingPrice: 60, stock: 100, threshold: 20 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Dual-USB Fast Wall Travel Charger Adapter (2.4A Output)',
    description: 'Universal mobile phone charging adapter with overload safety chip',
    isClothing: false,
    variants: [
      { sku: 'ELEC-CHARGER-DUAL-USB', barcode: '896400050321', costPrice: 240, sellingPrice: 380, stock: 35, threshold: 8 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Braided Fast Charging USB Type-C Data Cable (1-Meter)',
    description: 'Heavy duty nylon braided copper wire fast charging cable for Android',
    isClothing: false,
    variants: [
      { sku: 'ELEC-CABLE-TYPEC-1M', barcode: '896400050338', costPrice: 120, sellingPrice: 220, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'ELECTRICAL_HARDWARE',
    name: 'Stereo In-Ear Handsfree Earphones with Mic (3.5mm Audio Jack)',
    description: 'Clear bass sound earphones with call answer microphone button',
    isClothing: false,
    variants: [
      { sku: 'ELEC-HANDSFREE-3.5MM', barcode: '896400050345', costPrice: 140, sellingPrice: 250, stock: 45, threshold: 10 },
    ],
  },

  // ==========================================
  // ADDITIONAL CLOTHING & GARMENTS
  // ==========================================
  {
    categoryKey: 'CLOTHING',
    name: 'Men\'s Stretch Cotton Chino Casual Trousers',
    description: 'Soft washed cotton-spandex casual trousers with slant pockets',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-CHINO-KHK-32', variantName: 'Khaki / 32', size: '32', color: 'Khaki', costPrice: 1350, sellingPrice: 2350, stock: 16, threshold: 4 },
      { sku: 'CLOTH-CHINO-KHK-34', variantName: 'Khaki / 34', size: '34', color: 'Khaki', costPrice: 1350, sellingPrice: 2350, stock: 18, threshold: 4 },
      { sku: 'CLOTH-CHINO-OLV-32', variantName: 'Olive Green / 32', size: '32', color: 'Olive', costPrice: 1350, sellingPrice: 2350, stock: 14, threshold: 3 },
      { sku: 'CLOTH-CHINO-NVY-34', variantName: 'Navy / 34', size: '34', color: 'Navy', costPrice: 1350, sellingPrice: 2350, stock: 16, threshold: 4 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Boys White Cotton School Uniform Shirt',
    description: 'Standard white school uniform short sleeve shirt with chest pocket',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-SCHOOL-SHT-28', variantName: 'White / Size 28 (Age 7-8)', size: '28', color: 'White', costPrice: 480, sellingPrice: 850, stock: 20, threshold: 5 },
      { sku: 'CLOTH-SCHOOL-SHT-30', variantName: 'White / Size 30 (Age 9-10)', size: '30', color: 'White', costPrice: 480, sellingPrice: 850, stock: 22, threshold: 5 },
      { sku: 'CLOTH-SCHOOL-SHT-32', variantName: 'White / Size 32 (Age 11-12)', size: '32', color: 'White', costPrice: 480, sellingPrice: 850, stock: 18, threshold: 4 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Boys Grey School Uniform Trousers',
    description: 'Durable stain resistant grey school uniform pant with elastic back',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-SCHOOL-TR-28', variantName: 'Grey / Size 28 (Age 7-8)', size: '28', color: 'Grey', costPrice: 550, sellingPrice: 950, stock: 18, threshold: 4 },
      { sku: 'CLOTH-SCHOOL-TR-30', variantName: 'Grey / Size 30 (Age 9-10)', size: '30', color: 'Grey', costPrice: 550, sellingPrice: 950, stock: 20, threshold: 5 },
      { sku: 'CLOTH-SCHOOL-TR-32', variantName: 'Grey / Size 32 (Age 11-12)', size: '32', color: 'Grey', costPrice: 550, sellingPrice: 950, stock: 16, threshold: 4 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Women\'s Stitched Cambric Cotton Shalwar / Trouser',
    description: 'Ready-to-wear tailored cambric cotton bottom with pin-tuck cuff',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-SHALWAR-WHT-M', variantName: 'Off-White / Medium', size: 'Medium', color: 'Off-White', costPrice: 650, sellingPrice: 1100, stock: 25, threshold: 5 },
      { sku: 'CLOTH-SHALWAR-WHT-L', variantName: 'Off-White / Large', size: 'Large', color: 'Off-White', costPrice: 650, sellingPrice: 1100, stock: 25, threshold: 5 },
      { sku: 'CLOTH-SHALWAR-BLK-M', variantName: 'Jet Black / Medium', size: 'Medium', color: 'Black', costPrice: 650, sellingPrice: 1100, stock: 25, threshold: 5 },
      { sku: 'CLOTH-SHALWAR-BLK-L', variantName: 'Jet Black / Large', size: 'Large', color: 'Black', costPrice: 650, sellingPrice: 1100, stock: 25, threshold: 5 },
    ],
  },
  {
    categoryKey: 'CLOTHING',
    name: 'Women\'s Pashmina Woolen Embroidered Winter Shawl',
    description: 'Fine blended warm pashmina fabric winter shawl with kashmiri tilla border',
    isClothing: true,
    variants: [
      { sku: 'CLOTH-SHAWL-BLK-FS', variantName: 'Charcoal Black / Free Size', size: 'Free Size', color: 'Black', costPrice: 1400, sellingPrice: 2450, stock: 15, threshold: 3 },
      { sku: 'CLOTH-SHAWL-MRN-FS', variantName: 'Deep Maroon / Free Size', size: 'Free Size', color: 'Maroon', costPrice: 1400, sellingPrice: 2450, stock: 14, threshold: 3 },
    ],
  },

  // ==========================================
  // ADDITIONAL TAILORING & GARMENT PARTS
  // ==========================================
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Pure White Sewing Machine Mineral Lubricant Oil 100ml',
    description: 'High viscosity rust preventive smooth lubricant for sewing machine gears',
    isClothing: false,
    variants: [
      { sku: 'PART-MACHINE-OIL-100ML', barcode: '896400070138', costPrice: 65, sellingPrice: 110, stock: 60, threshold: 12 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Organ Japanese Domestic Sewing Machine Needles #14 (Pack of 10)',
    description: 'Standard flat shank HAx1 high speed sewing machine needles',
    isClothing: false,
    variants: [
      { sku: 'PART-MACHINE-NEEDLE-14', barcode: '896400070145', costPrice: 110, sellingPrice: 190, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Metal Shalwar & Pant Waistband Hooks (Box of 50 Pairs)',
    description: 'Rustproof nickel plated interlocking waist closure pant hooks',
    isClothing: false,
    variants: [
      { sku: 'PART-HOOKS-WAIST-50PR', barcode: '896400070152', costPrice: 90, sellingPrice: 160, stock: 50, threshold: 10 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Blazer & Coat Metal Buttons 24L Antique Gold (Pack of 20)',
    description: 'Embossed crest vintage shank metal buttons for men suits and coats',
    isClothing: false,
    variants: [
      { sku: 'PART-BUTTONS-COAT-20PK', barcode: '896400070169', costPrice: 140, sellingPrice: 240, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Jacket Separating Heavy Duty Metal Zipper 24-Inch (Black)',
    description: 'Open-end brass metal teeth zipper for hoodies, winter jackets, and coats',
    isClothing: false,
    variants: [
      { sku: 'PART-ZIP-JACKET-24IN', barcode: '896400070176', costPrice: 110, sellingPrice: 190, stock: 40, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Cotton Bias Binding Folded Ribbon Tape 0.5-Inch (Roll of 25m)',
    description: 'Fabric edging bias tape for piping neckline and cuffs',
    isClothing: false,
    variants: [
      { sku: 'PART-BIAS-TAPE-25M', barcode: '896400070183', costPrice: 130, sellingPrice: 220, stock: 35, threshold: 8 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Tailoring Pearl Head Pin Wheel (Wheel of 40 Colored Pins)',
    description: 'Sharp stainless steel dressmaking pins with pearl ball heads',
    isClothing: false,
    variants: [
      { sku: 'PART-PINS-WHEEL-40PK', barcode: '896400070190', costPrice: 40, sellingPrice: 75, stock: 70, threshold: 15 },
    ],
  },
  {
    categoryKey: 'GARMENT_PARTS',
    name: 'Seam Ripper Thread Stitch Cutter Tool with Safety Ball (Pack of 2)',
    description: 'Sharp hardened steel stitch unpicker tool for alterations',
    isClothing: false,
    variants: [
      { sku: 'PART-SEAM-RIPPER-2PK', barcode: '896400070206', costPrice: 60, sellingPrice: 110, stock: 55, threshold: 10 },
    ],
  },
];

/**
 * Seed all categories, products, variants, and stock movement logs
 */
async function seedCatalog({ quiet = false } = {}) {
  const log = (...args) => {
    if (!quiet) console.log(...args);
  };

  log('📦 Populating comprehensive ShopEase retail catalog...');

  // 1. Seed or retrieve categories
  const categoryMap = {}; // key -> category document
  for (const catData of CATEGORIES_DATA) {
    let cat = await Category.findOne({ name: catData.name });
    if (!cat) {
      cat = await Category.create({
        name: catData.name,
        description: catData.description,
        isSystemDefault: catData.isSystemDefault,
        isActive: catData.isActive,
      });
      log(`   ✅ Created Category: "${cat.name}"`);
    } else {
      categoryMap[catData.key] = cat;
    }
    categoryMap[catData.key] = cat;
  }

  let createdProductCount = 0;
  let createdVariantCount = 0;
  let totalInventoryUnits = 0;

  // 2. Seed products and variants
  for (const prodData of PRODUCTS_DATA) {
    const category = categoryMap[prodData.categoryKey] || categoryMap['GENERAL_STORE'];
    if (!category) continue;

    let product = await Product.findOne({
      name: prodData.name,
      categoryId: category._id,
    });

    if (!product) {
      product = await Product.create({
        name: prodData.name,
        categoryId: category._id,
        categoryName: category.name,
        description: prodData.description,
        isClothing: prodData.isClothing,
        trackStock: true,
        isActive: true,
      });
      createdProductCount++;
    }

    // Process Variants
    for (const vData of prodData.variants) {
      let variant = await ProductVariant.findOne({ sku: vData.sku });
      const initialStock = vData.stock || 0;
      const threshold = vData.threshold || 5;

      if (!variant) {
        variant = await ProductVariant.create({
          productId: product._id,
          sku: vData.sku,
          barcode: vData.barcode || undefined,
          variantName: vData.variantName || 'Default',
          size: vData.size || '',
          color: vData.color || '',
          costPrice: vData.costPrice,
          sellingPrice: vData.sellingPrice,
          stockQuantity: initialStock,
          currentStock: initialStock,
          lowStockThreshold: threshold,
          minStockAlert: threshold,
          isActive: true,
        });

        createdVariantCount++;
        totalInventoryUnits += initialStock;

        // Record opening stock movement
        if (initialStock > 0) {
          await StockMovement.create({
            variantId: variant._id,
            productId: product._id,
            productName: product.name,
            sku: variant.sku,
            type: STOCK_MOVEMENT_TYPE.OPENING_STOCK,
            quantityChange: initialStock,
            previousStock: 0,
            newStock: initialStock,
            reason: 'Initial retail inventory opening stock',
            createdByName: 'ShopEase Catalog Seeder',
          });
        }
      }
    }
  }

  log(`🎉 Catalog Population Completed:`);
  log(`   📁 Total Categories: ${Object.keys(categoryMap).length}`);
  log(`   🏷️  New Products Added: ${createdProductCount}`);
  log(`   🔢 New Variants Added: ${createdVariantCount}`);
  log(`   📦 Inventory Units Seeded: ${totalInventoryUnits}`);

  return {
    categoriesCount: Object.keys(categoryMap).length,
    createdProductCount,
    createdVariantCount,
    totalInventoryUnits,
  };
}

module.exports = {
  CATEGORIES_DATA,
  PRODUCTS_DATA,
  seedCatalog,
};
