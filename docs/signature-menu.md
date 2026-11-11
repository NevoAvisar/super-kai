# Super-Kai · Signature Menu & AI Photo Prompts

> Generated from `src/data/gourmet-sample.json` by `npm run menu:export`. Edit the JSON, not this file.

**15 signature dishes** across 5 categories. KG dishes are sold in 0.25 kg steps; soups, quiches, strudels and jars are sold per unit. Meat dishes contain no dairy.

## How to use the photo prompts

1. Paste a dish's prompt into your image generator.
   - **Midjourney:** append this suffix:
     ```text
     --ar 4:3 --style raw --no text, letters, watermark, logo, label, hands, people
     ```
   - **DALL·E / ChatGPT:** Request a landscape image (1792x1024) and crop to 4:3.
2. Save the result as `public/products/<slug>.jpg` (or `.webp` / `.png`). The site picks it up automatically, no code change.
3. Every prompt shares one visual language: warm natural window light, artisanal ceramics / wood / glass jars, shallow depth of field, DSLR look, and **no text, labels, watermarks or hands**.

## Overview

| # | Dish | English | Category | Sold as | Per 100 g | Serving guideline |
|---|------|---------|----------|---------|-----------|-------------------|
| 1 | סלט שובה בצנצנת אישית | Shuba Salad in a Personal Jar | ראשונות וסלטים | ₪34.00 / צנצנת 280 גרם | ₪12.14 | One jar per guest as a first course, or one jar per 2–3 guests as part of a salad spread (~50 g per guest per salad). |
| 2 | פטה כבדי עוף בקוניאק | Chicken Liver Pâté with Cognac | ראשונות וסלטים | ₪159.00 / kg | ₪15.90 | 50–60 g per guest as part of a first-course spread; 0.25 kg serves about 4–5 guests. |
| 3 | חציל שרוף בטחינה ורימונים | Fire-Charred Eggplant with Tahini & Pomegranate | ראשונות וסלטים | ₪89.00 / kg | ₪8.90 | 150–200 g per guest as a single first course; ~50 g per guest in a salad spread. |
| 4 | בריסקט בבישול איטי עם ירקות שורש | Slow-Braised Beef Brisket with Root Vegetables | מנות עיקריות | ₪249.00 / kg | ₪24.90 | 150 g per guest (boneless); 1 kg serves about 6–7 guests. |
| 5 | עוף צלוי בלימון כבוש, זיתים ושום | Roast Chicken with Preserved Lemon, Olives & Garlic | מנות עיקריות | ₪109.00 / kg | ₪10.90 | 300 g per guest (bone-in); 1 kg serves about 3–4 guests. |
| 6 | פילה סלמון בקרום פיסטוקים ועשבים | Pistachio & Herb Crusted Salmon Fillet | מנות עיקריות | ₪219.00 / kg | ₪21.90 | 150 g per guest; 1 kg serves about 6–7 guests. |
| 7 | מרק ארטישוק קרמי | Creamy Artichoke Soup | מרקים | ₪38.00 / מיכל 400 גרם | ₪9.50 | One 400 g container serves 2 as a starter, or 1 as a light main. |
| 8 | מרק ירקות שורש חורפי | Winter Root Vegetable Soup | מרקים | ₪29.00 / מיכל 400 גרם | ₪7.25 | One 400 g container serves 2 as a starter. |
| 9 | מרק עוף צלול עם קניידלך | Clear Chicken Soup with Matzo Balls | מרקים | ₪34.00 / מיכל 400 גרם | ₪8.50 | One 400 g container serves 2 as a starter, or 1 as a meal. |
| 10 | שטרודל בשר וצנוברים | Savory Beef & Pine Nut Strudel | טארטים, פיצות ומאפים | ₪139.00 / שטרודל שלם · 10 פרוסות | ₪13.90 | One slice (~100 g) per guest as a first course; a whole strudel serves 10. |
| 11 | קיש בטטה וגבינת עיזים | Sweet Potato & Goat Cheese Quiche | טארטים, פיצות ומאפים | ₪98.00 / קיש שלם · 8 מנות | ₪10.89 | One wedge (~110 g) per guest; a whole quiche serves 8. |
| 12 | פאי עוף ופטריות יער אישי | Individual Chicken & Wild Mushroom Pot Pie | טארטים, פיצות ומאפים | ₪32.00 / פאי אישי · 300 גרם | ₪10.67 | One pie per guest as a main course. |
| 13 | גזר צבעוני מזוגג בדבש וכמון | Honey & Cumin Glazed Heirloom Carrots | ירקות ותוספות | ₪69.00 / kg | ₪6.90 | 100–150 g per guest as a side; 1 kg serves about 7–8 guests. |
| 14 | פריקה עם פטריות יער ועשבי תיבול | Freekeh with Wild Mushrooms & Herbs | ירקות ותוספות | ₪65.00 / kg | ₪6.50 | 100–150 g per guest as a side; 1 kg serves about 7–8 guests. |
| 15 | תפוחי אדמה קטנים פריכים בשום ורוזמרין | Crispy Baby Potatoes with Garlic & Rosemary | ירקות ותוספות | ₪59.00 / kg | ₪5.90 | 100–150 g per guest as a side; 1 kg serves about 7–8 guests. |

---

## ראשונות וסלטים

### 1. Shuba Salad in a Personal Jar
**סלט שובה בצנצנת אישית** · `shuba-jar`

The classic 'herring under a fur coat' layered in a personal glass jar: cured herring, potato, carrot, egg and a deep-magenta beet top.

השכבות הקלאסיות של ״הרינג מתחת למעיל פרווה״ – דג מלוח, תפוחי אדמה, גזר וסלק – בצנצנת אישית מוכנה להגשה.

| | |
|---|---|
| **Price** | ₪34.00 / צנצנת 280 גרם |
| **Per 100 g** | ₪12.14 |
| **Serving** | One jar per guest as a first course, or one jar per 2–3 guests as part of a salad spread (~50 g per guest per salad). |
| **הנחיית הגשה** | צנצנת אחת לסועד כמנה ראשונה, או צנצנת לכל 2–3 סועדים כחלק ממגוון סלטים (כ-50 גרם לסועד מכל סלט). |
| **Ingredients** | הרינג מלוח, תפוחי אדמה, גזר, סלק אפוי, ביצה קשה, בצל סגול, מיונז ביתי, שמיר |
| **Badges** | ללא גלוטן |

**Image prompt** → save as `public/products/shuba-jar.jpg`
```text
Professional food photography of a layered Shuba salad in a clean, unlabeled clear glass jar, side view showing crisp distinct layers of pale boiled potato, flaked cured herring, orange carrot and chopped egg beneath a glossy vivid pink beetroot top, garnished with a feathery sprig of fresh dill and thin red onion rings. The jar stands on a rustic weathered wooden table beside a linen napkin and a vintage silver spoon. Warm natural window light from the left, high-end restaurant plating, rustic yet modern deli aesthetic, shallow depth of field with creamy bokeh background, shot on a full-frame DSLR with a 100mm macro lens at f/2.8, eye-level angle, ultra-realistic textures with moisture glistening on the beetroot. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

### 2. Chicken Liver Pâté with Cognac
**פטה כבדי עוף בקוניאק** · `chicken-liver-pate`

Seared chicken livers with caramelized shallots and cognac, blended silky-smooth and sealed with a thin layer of schmaltz and thyme.

כבדי עוף צרובים, שאלוט מקורמל וקוניאק, טחונים למרקם משיי ונחתמים בשכבת שמאלץ ותימין.

| | |
|---|---|
| **Price** | ₪159.00 / kg |
| **Per 100 g** | ₪15.90 |
| **Serving** | 50–60 g per guest as part of a first-course spread; 0.25 kg serves about 4–5 guests. |
| **הנחיית הגשה** | 50–60 גרם לסועד כחלק ממגוון ראשונות; 0.25 ק״ג מספיק לכ-4–5 סועדים. |
| **Ingredients** | כבדי עוף, שאלוט, קוניאק, שמאלץ (שומן עוף), שמן זית, תימין טרי, פלפל שחור גרוס, מלח ים |
| **Badges** | ללא גלוטן |

**Image prompt** → save as `public/products/chicken-liver-pate.jpg`
```text
Professional food photography of a silky smooth chicken liver pâté in a small rustic cream-glazed ceramic terrine, the surface sealed with a thin golden layer of schmaltz, topped with fresh thyme sprigs and crushed pink peppercorns. Next to it, a smear of pâté on a slice of toasted sourdough, a small heap of fig jam and a few cornichons on a dark walnut cutting board. Natural warm golden-hour window light, gentle highlights on the glossy fat layer, rustic yet modern deli aesthetic, shallow depth of field with soft bokeh of a blurred kitchen shelf, shot on a full-frame DSLR with a 90mm lens at f/2.5, 45-degree angle, ultra-realistic creamy texture. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

### 3. Fire-Charred Eggplant with Tahini & Pomegranate
**חציל שרוף בטחינה ורימונים** · `charred-eggplant-tahini-pomegranate`

Eggplant charred over an open flame, raw tahini, a drizzle of date silan, pomegranate seeds, olive oil and parsley.

חציל שנשרף על להבה פתוחה, טחינה גולמית, סילאן, גרגירי רימון, שמן זית ועלי פטרוזיליה.

| | |
|---|---|
| **Price** | ₪89.00 / kg |
| **Per 100 g** | ₪8.90 |
| **Serving** | 150–200 g per guest as a single first course; ~50 g per guest in a salad spread. |
| **הנחיית הגשה** | 150–200 גרם לסועד כמנה ראשונה יחידה; כ-50 גרם לסועד במגוון סלטים. |
| **Ingredients** | חציל, טחינה גולמית, לימון, שום, סילאן, רימון, שמן זית, פטרוזיליה, מלח ים |
| **Badges** | טבעוני · ללא גלוטן |

**Image prompt** → save as `public/products/charred-eggplant-tahini-pomegranate.jpg`
```text
Professional food photography of smoky fire-charred eggplant flesh spread across a wide hand-thrown speckled ceramic plate, swirled with ivory raw tahini, drizzled with dark glossy date silan and golden olive oil, scattered with jewel-like ruby pomegranate seeds and fresh flat-leaf parsley leaves, a few charred eggplant skin edges visible. Plate on a light travertine stone surface with a linen cloth and half a lemon. Natural soft daylight from a side window, warm earthy tones, rustic-modern Mediterranean deli styling, shallow depth of field with gentle bokeh at the edges, shot on a full-frame DSLR with a 50mm lens at f/3.2, top-down overhead angle, ultra-realistic glistening textures. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

---

## מנות עיקריות

### 4. Slow-Braised Beef Brisket with Root Vegetables
**בריסקט בבישול איטי עם ירקות שורש** · `slow-braised-brisket`

Braised for 14 hours in red wine with whole garlic and thyme until fork-tender, served with the carrots, parsnips and shallots from the pot.

14 שעות בתנור ביין אדום, שום שלם ותימין, עד שהבשר מתפרק במזלג. מוגש עם גזר, פטרוזיליה ושאלוט מהתבשיל.

| | |
|---|---|
| **Price** | ₪249.00 / kg |
| **Per 100 g** | ₪24.90 |
| **Serving** | 150 g per guest (boneless); 1 kg serves about 6–7 guests. |
| **הנחיית הגשה** | 150 גרם בשר לסועד (ללא עצם); 1 ק״ג מספיק לכ-6–7 סועדים. |
| **Ingredients** | בריסקט בקר, יין אדום יבש, גזר, שורש פטרוזיליה, שאלוט, שום שלם, רסק עגבניות, תימין, עלי דפנה |
| **Badges** | ללא גלוטן |

**Image prompt** → save as `public/products/slow-braised-brisket.jpg`
```text
Professional food photography of tender thick-sliced slow-cooked beef brisket drenched in a rich, glossy brown gravy that pools around the meat, the fibers visibly soft and pulling apart, garnished with caramelized roasted baby carrots with their green tops and fresh thyme sprigs, served on a dark matte artisanal ceramic plate, a wisp of steam rising. Plate on a scarred wooden farmhouse table with a cast-iron pot blurred behind. Warm natural window light with deep moody shadows, high-end restaurant plating, rustic yet modern deli aesthetic, shallow depth of field with rich bokeh, shot on a full-frame DSLR with an 85mm lens at f/2.2, 30-degree angle, ultra-realistic juicy textures. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

### 5. Roast Chicken with Preserved Lemon, Olives & Garlic
**עוף צלוי בלימון כבוש, זיתים ושום** · `preserved-lemon-roast-chicken` · 🏷️ 15% off

Bone-in chicken pieces with crackling skin, roasted over preserved lemon, green olives, garlic and herbs.

חלקי עוף עם עור פריך, צלויים על מצע לימון כבוש, זיתים ירוקים, שום ועשבי תיבול.

| | |
|---|---|
| **Price** | ₪109.00 / kg |
| **Per 100 g** | ₪10.90 |
| **Serving** | 300 g per guest (bone-in); 1 kg serves about 3–4 guests. |
| **הנחיית הגשה** | 300 גרם לסועד (כולל עצם); 1 ק״ג מספיק לכ-3–4 סועדים. |
| **Ingredients** | עוף (חלקים עם עצם), לימון כבוש, זיתים ירוקים, שום, בצל, פפריקה מתוקה, כורכום, שמן זית, כוסברה |
| **Badges** | ללא גלוטן |

**Image prompt** → save as `public/products/preserved-lemon-roast-chicken.jpg`
```text
Professional food photography of golden-brown roast chicken thighs and drumsticks with blistered crispy skin, nestled in a well-used enamel roasting pan among bright preserved lemon wedges, plump green olives, whole roasted garlic cloves and torn cilantro, pan juices bubbling and glistening with saffron-yellow oil, light steam rising. Pan rests on a folded striped linen towel on a warm oak table. Natural warm side light from a kitchen window, rustic-modern deli styling, shallow depth of field with soft bokeh, shot on a full-frame DSLR with a 70mm lens at f/2.8, 40-degree angle, ultra-realistic crackling skin texture. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

### 6. Pistachio & Herb Crusted Salmon Fillet
**פילה סלמון בקרום פיסטוקים ועשבים** · `pistachio-crusted-salmon`

Norwegian salmon baked under a crust of toasted pistachios, dill, parsley and lemon zest.

סלמון נורווגי אפוי בקרום פיסטוקים קלויים, שמיר, פטרוזיליה וגרידת לימון.

| | |
|---|---|
| **Price** | ₪219.00 / kg |
| **Per 100 g** | ₪21.90 |
| **Serving** | 150 g per guest; 1 kg serves about 6–7 guests. |
| **הנחיית הגשה** | 150 גרם לסועד; 1 ק״ג מספיק לכ-6–7 סועדים. |
| **Ingredients** | פילה סלמון, פיסטוקים קלויים, שמיר, פטרוזיליה, גרידת לימון, שום, חרדל דיז׳ון, שמן זית |
| **Badges** | ללא גלוטן |

**Image prompt** → save as `public/products/pistachio-crusted-salmon.jpg`
```text
Professional food photography of a whole side of baked salmon fillet with a vivid emerald-green crust of chopped pistachios and fresh herbs, the coral-pink flesh flaking slightly at a cut edge to reveal a moist interior, served on a long white handmade ceramic platter with charred lemon halves and dill fronds. Background of a light linen tablecloth and a blurred carafe of water. Bright natural morning window light, warm and fresh tones, rustic-modern deli aesthetic, shallow depth of field with creamy bokeh, shot on a full-frame DSLR with a 100mm lens at f/2.8, 35-degree angle, ultra-realistic flaky fish texture and glistening oil. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

---

## ירקות ותוספות

### 7. Honey & Cumin Glazed Heirloom Carrots
**גזר צבעוני מזוגג בדבש וכמון** · `honey-cumin-glazed-carrots` · 🏷️ 10% off

Whole heirloom carrots roasted in a honey, toasted cumin and orange glaze, finished with dukkah and fresh dill.

גזרים צבעוניים שלמים צלויים בזיגוג דבש, כמון קלוי ותפוז, עם דוקה פריכה ושמיר.

| | |
|---|---|
| **Price** | ₪69.00 / kg |
| **Per 100 g** | ₪6.90 |
| **Serving** | 100–150 g per guest as a side; 1 kg serves about 7–8 guests. |
| **הנחיית הגשה** | 100–150 גרם לסועד כתוספת; 1 ק״ג מספיק לכ-7–8 סועדים. |
| **Ingredients** | גזר צבעוני, דבש, כמון קלוי, מיץ תפוזים, שמן זית, דוקה (אגוזי לוז, שומשום, כוסברה), שמיר, מלח ים |
| **Badges** | צמחוני · ללא גלוטן |

**Image prompt** → save as `public/products/honey-cumin-glazed-carrots.jpg`
```text
Professional food photography of whole roasted heirloom carrots in purple, orange and yellow, with their trimmed green tops, arranged diagonally on a long oval speckled stoneware platter, lacquered with a sticky glistening honey-cumin glaze, caramelized edges, sprinkled with crunchy dukkah, flaky sea salt and feathery dill. Platter on a warm-toned linen tablecloth with a small bowl of honey and a wooden spoon at the edge. Natural soft golden window light, rustic-modern deli aesthetic, shallow depth of field with gentle bokeh at the corners, shot on a full-frame DSLR with a 50mm lens at f/3.5, top-down overhead angle, ultra-realistic glossy textures. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

### 8. Freekeh with Wild Mushrooms & Herbs
**פריקה עם פטריות יער ועשבי תיבול** · `freekeh-wild-mushrooms`

Smoky freekeh cooked in vegetable broth with seared wild mushrooms, spring onion, mint and parsley.

פריקה מעושנת שמתבשלת בציר ירקות, עם פטריות יער צרובות, בצל ירוק, נענע ופטרוזיליה.

| | |
|---|---|
| **Price** | ₪65.00 / kg |
| **Per 100 g** | ₪6.50 |
| **Serving** | 100–150 g per guest as a side; 1 kg serves about 7–8 guests. |
| **הנחיית הגשה** | 100–150 גרם לסועד כתוספת; 1 ק״ג מספיק לכ-7–8 סועדים. |
| **Ingredients** | פריקה, פטריות יער, בצל, בצל ירוק, ציר ירקות, נענע, פטרוזיליה, שמן זית, פלפל אנגלי |
| **Badges** | טבעוני |

**Image prompt** → save as `public/products/freekeh-wild-mushrooms.jpg`
```text
Professional food photography of a generous heap of smoky green freekeh grains in a shallow rustic olive-wood bowl, topped with golden seared wild mushrooms (oyster and shiitake), sliced spring onion, torn mint and parsley leaves and a drizzle of olive oil, individual grains glistening and distinct. Bowl on a dark textured stone surface with scattered herbs and a small dish of olive oil, warm earthy palette. Natural warm side window light with soft shadows, rustic-modern deli aesthetic, shallow depth of field with creamy bokeh, shot on a full-frame DSLR with a 60mm lens at f/2.8, 45-degree angle, ultra-realistic textures. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

### 9. Crispy Baby Potatoes with Garlic & Rosemary
**תפוחי אדמה קטנים פריכים בשום ורוזמרין** · `crispy-garlic-rosemary-potatoes`

Baby potatoes boiled, lightly smashed and roasted in olive oil with whole garlic and rosemary until crisp outside and fluffy inside.

תפוחי אדמה קטנים מבושלים, נמעכים קלות ונצלים בשמן זית, שום שלם ורוזמרין עד שהם פריכים מבחוץ ורכים מבפנים.

| | |
|---|---|
| **Price** | ₪59.00 / kg |
| **Per 100 g** | ₪5.90 |
| **Serving** | 100–150 g per guest as a side; 1 kg serves about 7–8 guests. |
| **הנחיית הגשה** | 100–150 גרם לסועד כתוספת; 1 ק״ג מספיק לכ-7–8 סועדים. |
| **Ingredients** | תפוחי אדמה קטנים, שמן זית, שום שלם, רוזמרין, מלח ים גס, פלפל שחור |
| **Badges** | טבעוני · ללא גלוטן · אהוב על ילדים |

**Image prompt** → save as `public/products/crispy-garlic-rosemary-potatoes.jpg`
```text
Professional food photography of crispy smashed baby potatoes in a well-seasoned black cast-iron skillet, golden crackling edges and fluffy cracked centers, tossed with whole roasted garlic cloves, fresh rosemary sprigs and coarse flaky sea salt, glistening with olive oil, light steam rising. Skillet on a rustic wooden table with a folded linen towel and a small bowl of salt. Warm natural window light with soft highlights, rustic-modern deli aesthetic, shallow depth of field with soft bokeh, shot on a full-frame DSLR with a 50mm lens at f/2.8, 40-degree angle, ultra-realistic crunchy textures. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

---

## מרקים

### 10. Creamy Artichoke Soup
**מרק ארטישוק קרמי** · `creamy-artichoke-soup`

Artichoke hearts, shallots and potato blended with cream into a velvety pale-green soup, finished with olive oil and fresh thyme.

לבבות ארטישוק, שאלוט ותפוח אדמה, טחונים עם שמנת למרקם קטיפתי בגוון ירוק חיוור. מוגש עם שמן זית ועלי תימין.

| | |
|---|---|
| **Price** | ₪38.00 / מיכל 400 גרם |
| **Per 100 g** | ₪9.50 |
| **Serving** | One 400 g container serves 2 as a starter, or 1 as a light main. |
| **הנחיית הגשה** | מיכל אחד (400 גרם) ל-2 סועדים כמנה ראשונה, או לסועד אחד כמנה עיקרית קלה. |
| **Ingredients** | לבבות ארטישוק, שאלוט, תפוח אדמה, ציר ירקות, שמנת מתוקה, חמאה, לימון, תימין |
| **Badges** | צמחוני · ללא גלוטן |

**Image prompt** → save as `public/products/creamy-artichoke-soup.jpg`
```text
Professional food photography of a velvety pale green artichoke soup in a rustic hand-thrown ceramic bowl with an uneven glaze, drizzled with a glossy ribbon of golden-green olive oil and a sprinkle of fresh thyme leaves and cracked black pepper, a few grilled artichoke heart quarters resting on top, gentle steam curling upward. The bowl sits on a rough linen napkin on a pale oak table, a whole fresh artichoke and a torn piece of crusty bread blurred in the background. Soft warm natural window light, high-end restaurant plating, rustic yet modern deli aesthetic, shallow depth of field with creamy bokeh, shot on a full-frame DSLR with a 50mm lens at f/2.0, 45-degree angle, ultra-realistic silky texture. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

### 11. Winter Root Vegetable Soup
**מרק ירקות שורש חורפי** · `winter-root-soup`

Hearty chunks of carrot, celeriac, parsley root, pumpkin and sweet potato in a clear herb-scented vegetable broth.

קוביות של גזר, שורש סלרי, פטרוזיליה, דלעת ובטטה בציר ירקות צלול עם עשבי תיבול.

| | |
|---|---|
| **Price** | ₪29.00 / מיכל 400 גרם |
| **Per 100 g** | ₪7.25 |
| **Serving** | One 400 g container serves 2 as a starter. |
| **הנחיית הגשה** | מיכל אחד (400 גרם) ל-2 סועדים כמנה ראשונה. |
| **Ingredients** | גזר, שורש סלרי, שורש פטרוזיליה, דלעת, בטטה, בצל, שום, שמיר, שמן זית |
| **Badges** | טבעוני · ללא גלוטן |

**Image prompt** → save as `public/products/winter-root-soup.jpg`
```text
Professional food photography of a rustic winter root vegetable soup in a deep hand-glazed terracotta bowl, colorful chunks of orange carrot, golden pumpkin, sweet potato, celeriac and parsley root in a clear amber broth glistening with olive oil, topped with chopped dill and parsley, steam rising visibly. Bowl on a dark wooden board with a ladle and a small dish of flaky salt, fresh root vegetables with green tops blurred behind. Warm natural window light on a cold-day mood, rustic-modern deli aesthetic, shallow depth of field with soft bokeh, shot on a full-frame DSLR with a 60mm lens at f/2.8, 40-degree angle, ultra-realistic textures. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

### 12. Clear Chicken Soup with Matzo Balls
**מרק עוף צלול עם קניידלך** · `chicken-soup-kneidlach`

Golden chicken broth simmered overnight with root vegetables and light, fluffy matzo balls.

ציר עוף זהוב שמתבשל כל הלילה, ירקות שורש וקניידלך אווריריים.

| | |
|---|---|
| **Price** | ₪34.00 / מיכל 400 גרם |
| **Per 100 g** | ₪8.50 |
| **Serving** | One 400 g container serves 2 as a starter, or 1 as a meal. |
| **הנחיית הגשה** | מיכל אחד (400 גרם) ל-2 סועדים כמנה ראשונה, או לסועד אחד כארוחה. |
| **Ingredients** | עוף, גזר, סלרי, שורש פטרוזיליה, בצל, שמיר, קמח מצה, ביצים, שמאלץ |
| **Badges** | אהוב על ילדים |

**Image prompt** → save as `public/products/chicken-soup-kneidlach.jpg`
```text
Professional food photography of a clear golden chicken soup in a wide white enamel bowl with a thin blue rim, two large fluffy matzo balls floating among sliced carrots, celery and tender shredded chicken, tiny glistening droplets of fat on the surface, sprinkled with fresh dill, wisps of steam rising. The bowl sits on an embroidered linen cloth over a worn wooden table, a blurred vintage soup pot in the background. Warm nostalgic natural window light, rustic-modern deli aesthetic, shallow depth of field with creamy bokeh, shot on a full-frame DSLR with a 50mm lens at f/2.2, 45-degree angle, ultra-realistic textures. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

---

## טארטים, פיצות ומאפים

### 13. Savory Beef & Pine Nut Strudel
**שטרודל בשר וצנוברים** · `beef-pine-nut-strudel`

Flaky puff pastry rolled around spiced ground beef, caramelized onion and toasted pine nuts, baked until deep golden.

בצק עלים פריך ממולא בבשר בקר טחון, בצל מקורמל, צנוברים קלויים ובהרט – נאפה עד הזהבה.

| | |
|---|---|
| **Price** | ₪139.00 / שטרודל שלם · 10 פרוסות |
| **Per 100 g** | ₪13.90 |
| **Serving** | One slice (~100 g) per guest as a first course; a whole strudel serves 10. |
| **הנחיית הגשה** | פרוסה אחת (כ-100 גרם) לסועד כמנה ראשונה; שטרודל שלם ל-10 סועדים. |
| **Ingredients** | בצק עלים (פרווה), בשר בקר טחון, בצל מקורמל, צנוברים, בהרט, פטרוזיליה, ביצה להברשה, שומשום |
| **Badges** | — |

**Image prompt** → save as `public/products/beef-pine-nut-strudel.jpg`
```text
Professional food photography of a long golden savory strudel on a rustic floured wooden board, the puff pastry shattering into delicate flaky layers, brushed with egg wash and sprinkled with sesame seeds, two thick slices cut at the front revealing a juicy spiced ground beef filling studded with toasted pine nuts and caramelized onion, fresh parsley scattered around, a few flakes of pastry on the board. Warm natural window light from the side with soft shadows, bakery-deli atmosphere, rustic-modern styling, shallow depth of field with soft bokeh of a blurred oven tray, shot on a full-frame DSLR with a 85mm lens at f/2.5, 30-degree angle, ultra-realistic crisp pastry texture. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

### 14. Sweet Potato & Goat Cheese Quiche
**קיש בטטה וגבינת עיזים** · `sweet-potato-goat-cheese-quiche`

Buttery shortcrust filled with roasted sweet potato, tangy goat cheese, caramelized red onion and thyme.

בצק פריך חמאתי, בטטה צלויה, גבינת עיזים, בצל סגול מקורמל ותימין.

| | |
|---|---|
| **Price** | ₪98.00 / קיש שלם · 8 מנות |
| **Per 100 g** | ₪10.89 |
| **Serving** | One wedge (~110 g) per guest; a whole quiche serves 8. |
| **הנחיית הגשה** | משולש אחד (כ-110 גרם) לסועד; קיש שלם ל-8 סועדים. |
| **Ingredients** | קמח, חמאה, בטטה, גבינת עיזים, ביצים, שמנת, בצל סגול, תימין, אגוז מוסקט |
| **Badges** | צמחוני |

**Image prompt** → save as `public/products/sweet-potato-goat-cheese-quiche.jpg`
```text
Professional food photography of a rustic round quiche in a fluted tart tin, golden buttery crust with crisp edges, the custard surface dotted with caramelized orange sweet potato cubes, crumbled white goat cheese, ribbons of jammy red onion and fresh thyme sprigs, one wedge slightly pulled out to show the creamy set interior. Placed on a vintage wire cooling rack over a light marble counter with a linen towel. Soft warm natural window light, French-bistro meets modern deli aesthetic, shallow depth of field with creamy bokeh, shot on a full-frame DSLR with a 50mm lens at f/2.8, 45-degree angle, ultra-realistic textures. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```

### 15. Individual Chicken & Wild Mushroom Pot Pie
**פאי עוף ופטריות יער אישי** · `chicken-mushroom-pot-pie`

Tender chicken and wild mushrooms in a white-wine herb sauce under a golden puff-pastry lid. Heat and serve.

נתחי עוף ופטריות יער ברוטב יין לבן ועשבים, מתחת למכסה בצק עלים זהוב. מחממים ומגישים.

| | |
|---|---|
| **Price** | ₪32.00 / פאי אישי · 300 גרם |
| **Per 100 g** | ₪10.67 |
| **Serving** | One pie per guest as a main course. |
| **הנחיית הגשה** | פאי אחד לסועד כמנה עיקרית. |
| **Ingredients** | חזה וירכיים עוף, פטריות יער, שאלוט, יין לבן, ציר עוף, טרגון, בצק עלים (פרווה), ביצה להברשה |
| **Badges** | — |

**Image prompt** → save as `public/products/chicken-mushroom-pot-pie.jpg`
```text
Professional food photography of an individual chicken and wild mushroom pot pie in a small round cream-colored ceramic ramekin, a puffed, deeply golden, flaky pastry lid with a crack where a spoon has broken through to reveal steaming creamy chicken, chanterelle and porcini mushrooms and tarragon in a glossy sauce, a few mushrooms and a sprig of thyme beside it. Set on a dark slate board with a folded linen napkin and a vintage spoon. Warm cozy natural window light, rustic-modern deli aesthetic, shallow depth of field with soft bokeh, shot on a full-frame DSLR with a 100mm macro lens at f/2.8, 35-degree angle, ultra-realistic steam and flaky texture. No text, no lettering, no labels, no watermark, no logos, no people, no hands.
```
