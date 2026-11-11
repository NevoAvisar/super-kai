/**
 * Seed catalog: 7 deli-style categories, ~72 products.
 *  • gourmet-sample.json → 15 signature products (bilingual, ingredients,
 *                          serving guide, hand-written aiImagePrompt)
 *  • the lists below      → the rest of the menu; each aiImagePrompt is a
 *                          dish-specific scene wrapped by shot() (photo-style.ts)
 * Used by prisma/seed.ts, and served directly when CATALOG_SOURCE="mock".
 * price = ₪ per kg (KG) or ₪ per item (UNIT).
 */
import sample from "./gourmet-sample.json";
import { shot } from "./photo-style";

export type DietaryTag = "VEGETARIAN" | "VEGAN" | "GLUTEN_FREE" | "SPICY" | "KIDS_FAVORITE";
export type PortionGroup = "FIRSTS" | "MAINS" | "SIDES" | "SOUPS" | "OTHER";

export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  icon: string;
  portionGroup: PortionGroup;
}

export interface SeedProduct {
  slug?: string;
  name: string;
  description?: string;
  categorySlug: string;
  saleUnit?: "KG" | "UNIT";
  price: number;
  unitWeightGrams?: number;
  unitLabel?: string;
  hasBones?: boolean;
  dietary?: DietaryTag[];
  featured?: boolean;
  outOfStock?: boolean;
  promoPercent?: number;
  imageUrl?: string | null;
  // Signature-menu extras (gourmet-sample.json)
  nameEn?: string;
  descriptionEn?: string;
  ingredients?: string[];
  servingGuide?: string;
  servingGuideEn?: string;
  /** Photorealistic prompt for DALL·E / Midjourney. Required for every product (tested). */
  aiImagePrompt?: string;
}

export const seedCategories: SeedCategory[] = [
  { slug: "first-courses", name: "ראשונות וסלטים", icon: "🥗", portionGroup: "FIRSTS", description: "סלטים אישיים ומשפחתיים, כבד קצוץ, פטה וסלטים בצנצנת" },
  { slug: "main-courses", name: "מנות עיקריות", icon: "🍖", portionGroup: "MAINS", description: "בשר בבישול איטי, דגים ועוף" },
  { slug: "sides", name: "ירקות ותוספות", icon: "🥕", portionGroup: "SIDES", description: "ירקות קלויים, פחמימות ודגנים" },
  { slug: "soups", name: "מרקים", icon: "🍲", portionGroup: "SOUPS", description: "מרקים עונתיים וקלאסיים במיכלי 400 גרם" },
  { slug: "bakes", name: "טארטים, פיצות ומאפים", icon: "🥧", portionGroup: "OTHER", description: "קישים, פשטידות, מאפי בשר ופיצות" },
  { slug: "spreads", name: "ממרחים ורטבים", icon: "🫙", portionGroup: "OTHER", description: "ממרחים, מטבלים ורטבים ביתיים בצנצנות" },
  { slug: "meals", name: "ארוחות שלמות", icon: "🍱", portionGroup: "OTHER", description: "ארוחות אישיות מלאות – לקחת ולחמם" },
];

const jar = (grams: number) => ({ saleUnit: "UNIT" as const, unitWeightGrams: grams, unitLabel: `צנצנת ${grams} גרם` });
const soup = { saleUnit: "UNIT" as const, unitWeightGrams: 400, unitLabel: "מיכל 400 גרם" };
const meal = (grams: number) => ({ saleUnit: "UNIT" as const, unitWeightGrams: grams, unitLabel: "ארוחה אישית" });
const V: DietaryTag = "VEGAN", VG: DietaryTag = "VEGETARIAN", GF: DietaryTag = "GLUTEN_FREE", HOT: DietaryTag = "SPICY", KIDS: DietaryTag = "KIDS_FAVORITE";

const c = (categorySlug: string, items: Omit<SeedProduct, "categorySlug">[]) =>
  items.map((p) => ({ ...p, categorySlug }));

const menu: SeedProduct[] = [
  ...c("first-courses", [
    { name: "כבד קצוץ עם בצל מטוגן", price: 119, description: "כבדי עוף צרובים, ביצה קשה ובצל מקורמל לאט – כמו של סבתא.", dietary: [GF],
      aiImagePrompt: shot("a generous quenelle of coarse chopped chicken liver on a cream-glazed stoneware plate, topped with a tangle of deep-golden crispy fried onions, grated hard-boiled egg and chopped chives, a few slices of rye toast and pickled cucumbers alongside, on a dark walnut board.") },
    { name: "סלט סלק, תפוזים ואגוזי מלך", price: 79, description: "סלק אפוי, פלחי תפוז, אגוזי מלך קלויים ורוטב הדרים.", dietary: [V, GF],
      aiImagePrompt: shot("a vibrant salad of roasted ruby and golden beet wedges with bright orange segments and toasted walnuts on a wide speckled ceramic plate, glistening with citrus vinaigrette, scattered with microgreens and flaky sea salt, on a light travertine surface.", "overhead") },
    { name: "חומוס ביתי עם שמן זית", price: 49, dietary: [V, GF],
      aiImagePrompt: shot("a silky swirl of creamy hummus in a shallow hand-made ceramic bowl, a well of golden olive oil in the center, whole chickpeas, paprika and chopped parsley on top, warm pita torn beside it, on a rustic olive-wood table.", "overhead") },
    { name: "טחינה ירוקה", price: 49, dietary: [V, GF],
      aiImagePrompt: shot("a smooth, vivid green herb tahini in a small rustic ceramic bowl, swirled with the back of a spoon, drizzled with olive oil and topped with parsley leaves and a lemon wedge, fresh bunches of herbs blurred behind, on a pale linen cloth.") },
    { name: "סלט חצילים במיונז", price: 69, dietary: [VG, GF],
      aiImagePrompt: shot("creamy smoky roasted eggplant salad with mayonnaise and garlic in an unlabeled glass deli jar and a small spooned portion on a white ceramic dish, flecks of charred eggplant and chopped parsley visible, on a weathered wooden board.") },
    { name: "טבולה עם רימונים", price: 69, dietary: [V],
      aiImagePrompt: shot("a bright, herb-heavy tabbouleh of finely chopped parsley, mint, bulgur, tomato and spring onion in a wide matte ceramic bowl, studded with jewel-like pomegranate seeds and glistening with lemon and olive oil, on a light stone countertop.", "overhead") },
    { name: "סלט כרוב סגול ואגסים", price: 55, dietary: [V, GF],
      aiImagePrompt: shot("a crisp slaw of finely shredded purple cabbage with thin slices of pear, toasted sunflower seeds and fresh mint in a white enamel bowl, glistening with a light vinaigrette, vivid purple and green colors, on a pale wooden table.") },
    { name: "פלפלים קלויים בשום", price: 69, dietary: [V, GF],
      aiImagePrompt: shot("glossy fire-roasted red and yellow bell pepper strips marinated in olive oil with thinly sliced garlic and fresh basil, layered in an unlabeled clear glass jar with a few strips laid on a small ceramic plate, oil glistening, on a rustic wooden board.") },
    { name: "סלט גזר מרוקאי", price: 49, dietary: [V, GF, HOT],
      aiImagePrompt: shot("a spicy Moroccan carrot salad of cooked carrot coins coated in a glossy red paprika, cumin and garlic dressing, scattered with chopped cilantro and chili flakes, in a hand-painted terracotta bowl on a warm wooden table.") },
    { name: "סלט ביצים עם בצל ירוק", price: 65, dietary: [VG, GF],
      aiImagePrompt: shot("a creamy chunky egg salad with visible egg white pieces and bright yellow yolk, sliced spring onion and cracked black pepper in a small rustic ceramic bowl, with a slice of toasted challah beside it, on a light linen cloth.") },
    { name: "סלט טונה ים-תיכוני", price: 89, dietary: [GF], outOfStock: true,
      aiImagePrompt: shot("a Mediterranean tuna salad with flaked tuna, Kalamata olives, capers, red onion, cherry tomatoes and parsley in a shallow blue-rimmed ceramic bowl, glistening with olive oil and lemon, on a sun-washed wooden table.", "overhead") },
  ]),
  ...c("main-courses", [
    { name: "אסאדו בבישול איטי ביין אדום", price: 229, hasBones: true, description: "12 שעות בתנור עם יין אדום, שום שלם ועשבי תיבול. נמס מהעצם.", dietary: [GF],
      aiImagePrompt: shot("glistening slow-braised beef short ribs on the bone in a dark red-wine reduction, the meat falling off the bone, with confit garlic bulbs and thyme on a deep charcoal stoneware platter, steam rising, on a dark wooden table.", "30") },
    { name: "חריימה פילה דניס", price: 189, description: "פילה דניס ברוטב פלפלים אדומים, שום וכוסברה, בסגנון לובי.", dietary: [GF, HOT],
      aiImagePrompt: shot("sea bream fillets simmered in a fiery, glossy red pepper and garlic chraime sauce in a shallow black cast-iron pan, sprinkled with fresh cilantro and lemon slices, oil bubbling at the edges, on a rustic wooden board.") },
    { name: "צלי בקר ברוטב יין ופטריות", price: 219, dietary: [GF],
      aiImagePrompt: shot("thin slices of rosy roast beef fanned on a dark ceramic platter, drenched in a glossy red-wine and mushroom sauce with sautéed button and cremini mushrooms and fresh rosemary, steam rising, on a dark walnut table.", "30") },
    { name: "שניצל עוף ביתי", price: 129, dietary: [KIDS],
      aiImagePrompt: shot("golden, crunchy homemade chicken schnitzels with a craggy panko crust stacked on a white rustic ceramic plate, lemon wedges and a sprinkle of flaky salt and parsley, one schnitzel cut to reveal juicy white meat, on a light wooden table.") },
    { name: "קציצות בקר ברוטב עגבניות", price: 139, dietary: [KIDS],
      aiImagePrompt: shot("tender beef meatballs simmering in a thick, glossy tomato sauce in a shallow terracotta casserole, sprinkled with chopped parsley and a drizzle of olive oil, sauce bubbling gently, steam rising, on a rustic wooden table.") },
    { name: "עוף שלם בתנור עם לימון ושום", price: 99, hasBones: true, dietary: [GF],
      aiImagePrompt: shot("a whole golden roast chicken with crisp blistered skin in an enamel roasting pan, surrounded by roasted lemon halves, whole garlic heads and rosemary, pan juices glistening, on a warm oak table.", "30") },
    { name: "שוקיים בטריאקי", price: 105, hasBones: true, dietary: [KIDS],
      aiImagePrompt: shot("sticky lacquered teriyaki chicken drumsticks with a deep amber glaze, sprinkled with sesame seeds and sliced spring onion on an oval speckled ceramic platter, glaze glistening, on a dark slate surface.") },
    { name: "חזה עוף בגריל עם עשבים", price: 139, dietary: [GF],
      aiImagePrompt: shot("juicy grilled chicken breast slices with charred grill marks fanned on a white artisanal plate, glistening with herb oil, topped with chopped parsley, thyme and lemon zest, on a light stone countertop.") },
    { name: "אוסובוקו בבישול איטי", price: 239, hasBones: true, dietary: [GF],
      aiImagePrompt: shot("a thick cross-cut braised beef osso buco with the marrow bone visible, in a rich glossy tomato and wine sauce with carrots and celery, topped with bright gremolata, in a wide rustic ceramic bowl, steam rising, on a dark wooden table.", "30") },
    { name: "פילה מושט בחמאת עשבים", price: 159, dietary: [GF],
      aiImagePrompt: shot("two delicate pan-seared tilapia fillets with a golden crust on a pale ceramic plate, glistening with a green herb oil and lemon slices, scattered with dill and parsley, on a light linen tablecloth.") },
    { name: "קציצות דג ברוטב חריף", price: 139, dietary: [HOT],
      aiImagePrompt: shot("tender white fish balls in a spicy, glossy red pepper and tomato sauce in a shallow cast-iron skillet, sprinkled with fresh cilantro and chili slices, sauce bubbling, on a rustic wooden board.") },
    { name: "סלמון בטריאקי ושומשום", price: 199,
      aiImagePrompt: shot("a thick salmon fillet with a sticky, glossy teriyaki glaze and caramelized edges on a matte black ceramic plate, sprinkled with toasted sesame seeds and sliced spring onion, the coral flesh flaking at the side, on a dark slate surface.") },
    { name: "מוסקה בשרית", price: 129,
      aiImagePrompt: shot("a thick square of beef moussaka lifted from a rustic baking dish, showing distinct layers of roasted eggplant, spiced ground beef in tomato sauce and a golden-brown potato topping, steam rising, on a weathered wooden table.") },
    { name: "תבשיל עוף בשזיפים וערמונים", price: 119, hasBones: true, dietary: [GF],
      aiImagePrompt: shot("chicken pieces braised in a dark, glossy sauce with soft prunes and roasted chestnuts in a heavy cast-iron pot, sprinkled with fresh parsley, sauce glistening, steam rising, on a rustic wooden table.") },
  ]),
  ...c("sides", [
    { name: "אורז לבן אוורירי", price: 45, dietary: [V, GF, KIDS],
      aiImagePrompt: shot("a fluffy mound of perfectly cooked white basmati rice with separate glistening grains in a simple white ceramic bowl, topped with a sprig of parsley, steam rising, on a pale linen cloth.") },
    { name: "מג׳דרה עם בצל מטוגן", price: 55, dietary: [V],
      aiImagePrompt: shot("fragrant mujaddara of brown lentils and rice in a wide hand-made ceramic bowl, piled high with deeply caramelized crispy fried onions and chopped parsley, a dollop of tahini on the side, on a rustic olive-wood table.") },
    { name: "פירה תפוחי אדמה חמאתי", price: 52, dietary: [VG, GF, KIDS],
      aiImagePrompt: shot("silky, buttery mashed potatoes swirled in a rustic ceramic bowl with a pool of melted butter in the center, cracked black pepper and chives on top, steam rising, on a light wooden table.") },
    { name: "שעועית ירוקה מוקפצת בשום", price: 65, dietary: [V, GF],
      aiImagePrompt: shot("bright green sautéed green beans with golden garlic slivers and toasted almonds on an oval white ceramic platter, glistening with olive oil and flaky salt, on a light stone countertop.", "overhead") },
    { name: "פתיתים ברוטב עגבניות", price: 49, dietary: [V, KIDS],
      aiImagePrompt: shot("pearl couscous (ptitim) in a rich tomato sauce in a deep ceramic bowl, glossy and comforting, topped with chopped parsley, steam rising, on a warm wooden table.") },
    { name: "קוסקוס עם ירקות", price: 55, dietary: [V],
      aiImagePrompt: shot("fluffy homemade couscous in a wide earthenware dish topped with a colorful stew of carrots, zucchini, pumpkin and chickpeas in golden broth, sprinkled with cilantro, steam rising, on a rustic wooden table.") },
    { name: "קוגל ירושלמי", price: 59, dietary: [VG],
      aiImagePrompt: shot("a square slice of caramelized Jerusalem kugel with dark-golden glossy noodles and a peppery crust on a vintage ceramic plate, the rest of the round kugel blurred behind in its pan, on a dark wooden table.") },
    { name: "כרובית צלויה בטחינה", price: 69, dietary: [V, GF],
      aiImagePrompt: shot("a whole golden-roasted cauliflower head with charred edges on a speckled ceramic platter, drizzled with ivory tahini, scattered with pomegranate seeds, parsley and sumac, on a light travertine surface.") },
  ]),
  ...c("soups", [
    { name: "מרק קובה סלק", price: 36, ...soup,
      aiImagePrompt: shot("a vibrant magenta beetroot kubbeh soup in a deep white ceramic bowl, with plump semolina dumplings, chunks of beet and zucchini floating in the sour broth, topped with fresh mint, steam rising, on a rustic wooden table.") },
    { name: "מרק בטטה וג׳ינג׳ר", price: 29, ...soup, dietary: [V, GF],
      aiImagePrompt: shot("a velvety bright orange sweet potato and ginger soup in a matte stoneware bowl, swirled with coconut cream and olive oil, sprinkled with toasted pumpkin seeds and chili flakes, steam rising, on a pale linen cloth.") },
    { name: "מרק אפונה עם קרוטונים", price: 29, ...soup, dietary: [VG],
      aiImagePrompt: shot("a thick, vivid green split pea soup in a rustic ceramic bowl, topped with golden crunchy croutons, a drizzle of olive oil and fresh mint leaves, steam rising, on a warm wooden table.") },
    { name: "מרק גולאש הונגרי", price: 42, ...soup, dietary: [GF, HOT],
      aiImagePrompt: shot("a rich, deep-red Hungarian goulash soup with tender beef chunks, potatoes and peppers in a heavy enamel bowl, dusted with paprika and parsley, glistening with spiced oil, steam rising, on a dark wooden table.") },
    { name: "מרק פטריות שמנת", price: 34, ...soup, dietary: [VG, GF],
      aiImagePrompt: shot("a creamy mushroom soup in a rustic stoneware bowl, topped with golden sautéed wild mushroom slices, a swirl of cream, fresh thyme and cracked pepper, steam rising, on a pale oak table.") },
  ]),
  ...c("bakes", [
    { name: "קיש פטריות ובצל", price: 92, saleUnit: "UNIT", unitWeightGrams: 900, unitLabel: "קיש שלם · 8 מנות", dietary: [VG],
      aiImagePrompt: shot("a golden mushroom and caramelized onion quiche in a fluted tart tin with a crisp buttery crust, sliced mushrooms and thyme on the set custard, one wedge cut out to show the creamy interior, on a light marble counter.") },
    { name: "פשטידת תרד וגבינות", price: 88, saleUnit: "UNIT", unitWeightGrams: 1000, unitLabel: "תבנית · 8 מנות", dietary: [VG],
      aiImagePrompt: shot("a generous square of spinach and cheese pie with a golden bubbling top, showing a creamy deep-green spinach and feta interior, lifted from a rustic ceramic baking dish, on a light wooden table.") },
    { name: "פשטידת ברוקולי", price: 82, saleUnit: "UNIT", unitWeightGrams: 1000, unitLabel: "תבנית · 8 מנות", dietary: [VG, KIDS],
      aiImagePrompt: shot("a fluffy golden broccoli pie slice with visible bright green broccoli florets and a lightly browned top on a white ceramic plate, the rest of the bake in a glass dish blurred behind, on a pale linen cloth.") },
    { name: "בורקס בשר אישי", price: 14, saleUnit: "UNIT", unitWeightGrams: 150, unitLabel: "יחידה",
      aiImagePrompt: shot("golden flaky puff-pastry meat bourekas shaped as triangles, sprinkled with sesame and nigella seeds, one broken open to reveal the spiced ground beef filling, on a rustic wooden board.") },
    { name: "פיצה מרגריטה ביתית", price: 59, saleUnit: "UNIT", unitWeightGrams: 700, unitLabel: "מגש 30 ס״מ", dietary: [VG, KIDS],
      aiImagePrompt: shot("a rustic homemade margherita pizza with a blistered golden crust, bubbling mozzarella, bright tomato sauce and fresh basil leaves on a wooden pizza peel, a slice slightly pulled away with a cheese stretch, on a floured wooden table.", "overhead") },
    { name: "טארט עגבניות ופסטו", price: 89, saleUnit: "UNIT", unitWeightGrams: 800, unitLabel: "טארט שלם · 8 מנות", dietary: [VG],
      aiImagePrompt: shot("a free-form tart with a golden flaky crust topped with colorful heirloom cherry tomatoes, swirls of bright basil pesto and fresh basil leaves, glistening with olive oil, on a rustic wooden board.", "overhead") },
    { name: "סיגרים במילוי בשר", price: 139, dietary: [],
      aiImagePrompt: shot("a pile of golden, crispy fried phyllo cigars filled with spiced ground beef on a small hand-painted ceramic plate, one cut open to show the filling, with a little bowl of tahini and parsley, on a dark wooden table.") },
  ]),
  ...c("spreads", [
    { name: "מטבוחה ביתית", price: 28, ...jar(250), description: "עגבניות ופלפלים בבישול של 4 שעות עם שום ופלפל חריף.", dietary: [V, GF, HOT],
      aiImagePrompt: shot("a deep red, slow-cooked matbucha of tomatoes and roasted peppers in an unlabeled clear glass jar with a spoonful on a small ceramic dish, glistening with olive oil and flecked with garlic and chili, on a rustic wooden board.") },
    { name: "סחוג ירוק", price: 22, ...jar(200), dietary: [V, GF, HOT],
      aiImagePrompt: shot("vibrant green zhug made of cilantro, parsley and green chilies in a small unlabeled glass jar with a wooden spoon, a few whole chilies and cilantro leaves scattered beside, on a light stone countertop.") },
    { name: "פסטו בזיליקום", price: 34, ...jar(200), dietary: [VG, GF],
      aiImagePrompt: shot("bright green basil pesto with visible pine nuts and grated cheese in an unlabeled glass jar, a spoon resting on top, fresh basil leaves and a few pine nuts scattered on a pale wooden board.") },
    { name: "איולי שום קלוי", price: 26, ...jar(200), dietary: [VG, GF],
      aiImagePrompt: shot("a thick, creamy roasted garlic aioli in a small unlabeled glass jar and a swoosh on a ceramic dish, with whole golden roasted garlic heads beside it, drizzled with olive oil, on a light linen cloth.") },
    { name: "ממרח פלפלים קלויים ואגוזים", price: 32, ...jar(250), dietary: [V],
      aiImagePrompt: shot("a rich, deep-red muhammara spread of roasted peppers and walnuts in a shallow ceramic bowl, drizzled with pomegranate molasses and olive oil, topped with chopped walnuts and parsley, on a rustic wooden table.", "overhead") },
    { name: "חריף תימני – זחוג אדום", price: 22, ...jar(200), dietary: [V, GF, HOT],
      aiImagePrompt: shot("a fiery red zhug paste of red chilies, garlic and spices in an unlabeled glass jar with a spoonful on a small ceramic dish, dried red chilies and garlic cloves scattered beside, on a dark wooden board.") },
    { name: "רוטב צ׳ימיצ׳ורי", price: 29, ...jar(200), dietary: [V, GF],
      aiImagePrompt: shot("a fresh chimichurri sauce of finely chopped parsley, oregano, garlic and red chili in olive oil in a small rustic ceramic bowl, oil glistening, a few herb sprigs beside it, on a dark wooden board.", "overhead") },
  ]),
  ...c("meals", [
    { name: "ארוחה שלמה: שניצל, פירה וסלט", price: 62, ...meal(550), description: "שניצל עוף פריך, פירה ביתי וסלט ירקות קצוץ – ארוחה אישית מלאה.", dietary: [KIDS],
      aiImagePrompt: shot("a complete plated meal of a golden crunchy chicken schnitzel, a scoop of buttery mashed potatoes and a fresh chopped Israeli salad of cucumber and tomato on a large white ceramic plate, lemon wedge on the side, on a light wooden table.") },
    { name: "ארוחה שלמה: אסאדו, אורז וירקות", price: 79, ...meal(600), dietary: [GF],
      aiImagePrompt: shot("a complete plated meal of glossy slow-braised beef short rib, fluffy white rice and roasted root vegetables on a wide dark ceramic plate, garnished with thyme, steam rising, on a dark wooden table.") },
    { name: "ארוחה שלמה: סלמון, פריקה וסלט", price: 76, ...meal(550),
      aiImagePrompt: shot("a complete plated meal of a pistachio-herb salmon fillet, smoky freekeh with mushrooms and a crisp green salad on a wide white ceramic plate, lemon wedge on the side, on a light stone countertop.") },
    { name: "ארוחה צמחונית: קיש, סלט ומרק", price: 58, ...meal(650), dietary: [VG],
      aiImagePrompt: shot("a vegetarian lunch spread of a wedge of golden quiche, a fresh leafy salad and a small bowl of velvety orange soup arranged on a rustic wooden tray, on a pale linen tablecloth.", "overhead") },
    { name: "ארוחת ילדים: קציצות, פתיתים ותירס", price: 42, ...meal(400), dietary: [KIDS],
      aiImagePrompt: shot("a cheerful kids' meal of small beef meatballs in tomato sauce, pearl couscous and buttered sweet corn kernels in a white ceramic divided plate, bright and colorful, on a light wooden table.", "overhead") },
    { name: "ארוחה טבעונית: מג׳דרה, כרובית וטחינה", price: 52, ...meal(550), dietary: [V],
      aiImagePrompt: shot("a vegan plated meal of mujaddara topped with crispy fried onions, golden roasted cauliflower florets and a generous swirl of tahini with parsley on a wide speckled ceramic plate, on a rustic olive-wood table.") },
  ]),
];

export const seedProducts: SeedProduct[] = [...(sample.products as SeedProduct[]), ...menu];

/**
 * Stable slug: explicit for signature products, `<category>-<n>` for the rest
 * (n counts only auto-slugged items, so adding signatures never shifts them).
 */
export function withSlugs(products: SeedProduct[]): (SeedProduct & { slug: string; sortOrder: number })[] {
  const auto = new Map<string, number>();
  const order = new Map<string, number>();
  return products.map((p) => {
    const sortOrder = (order.get(p.categorySlug) ?? 0) + 1;
    order.set(p.categorySlug, sortOrder);
    if (p.slug) return { ...p, slug: p.slug, sortOrder };
    const n = (auto.get(p.categorySlug) ?? 0) + 1;
    auto.set(p.categorySlug, n);
    return { ...p, slug: `${p.categorySlug}-${n}`, sortOrder };
  });
}
