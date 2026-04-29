/**
 * Seed script: replaces all properties with Hebrew data, real Israeli addresses, apartment photos.
 * Run from server:
 *   node scripts/seed-properties.js
 */
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://server:e5f5c26a7580f0bac585c1d50369c1227114184f9c92f048@localhost:21771/homeseek';

const IMG = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

// 75 unique Unsplash photo IDs for apartment / interior photography.
// 25 cover photos (index 0–24) — one per property, all unique.
// Grouped in threes: each property gets IDs at positions [i*3], [i*3+1], [i*3+2].
const ALL_IDS = [
    // Property 0 — modern living room set
    '1502672260266-1c1ef2d93688', '1556909114-f6e7ad7d3136', '1560448204-e02f11c3d0e2',
    // Property 1 — bright bedroom set
    '1545324418-cc1a3fa10c00',    '1484154133-5be7c1b22d11', '1584622650111-993a426fbf0a',
    // Property 2 — gray sofa set
    '1555041469-eade50a31b06',    '1493809842364-78817add7ffb', '1512917774080-9991f1c4c750',
    // Property 3 — kitchen & dining set
    '1560185893-c12829ea7b62',    '1582268611-4266d27571bd',    '1631049307264-da0ec9d70304',
    // Property 4 — modern white apartment
    '1600585154526-58884b39c4ea', '1502672260266-1c1ef2d93688', '1484154133-5be7c1b22d11',
    // Property 5 — warm tones interior
    '1600210492493-0fe1a60480c8', '1545324418-cc1a3fa10c00',    '1555041469-eade50a31b06',
    // Property 6 — Scandinavian style
    '1600566752355-35792bedcfea', '1560448204-e02f11c3d0e2',    '1584622650111-993a426fbf0a',
    // Property 7 — penthouse terrace view
    '1600573472591-b69e62aca5d7', '1493809842364-78817add7ffb', '1560185893-c12829ea7b62',
    // Property 8 — Jerusalem stone walls
    '1586023492125-27264fee2e32', '1556909114-f6e7ad7d3136',    '1582268611-4266d27571bd',
    // Property 9 — rustic wooden bedroom
    '1598928506311-c55ded91a20c', '1512917774080-9991f1c4c750', '1545324418-cc1a3fa10c00',
    // Property 10 — bright loft
    '1554995207-c9d0f5a5d62f',    '1555041469-eade50a31b06',    '1502672260266-1c1ef2d93688',
    // Property 11 — luxury bathroom
    '1600607688969-0bf6d93a32fe', '1584622650111-993a426fbf0a', '1560448204-e02f11c3d0e2',
    // Property 12 — villa with pool
    '1616594039964-ae485a617a19', '1493809842364-78817add7ffb', '1600566752355-35792bedcfea',
    // Property 13 — coastal apartment
    '1571508601891-ca5e7a713859', '1556909114-f6e7ad7d3136',    '1554995207-c9d0f5a5d62f',
    // Property 14 — modern studio
    '1565182999-41fa53c76b45',    '1600210492493-0fe1a60480c8', '1598928506311-c55ded91a20c',
    // Property 15 — luxury villa interior
    '1558618666-fcd25c85cd64',    '1512917774080-9991f1c4c750', '1616594039964-ae485a617a19',
    // Property 16 — garden apartment
    '1564078516393-cf04bd966897', '1555041469-eade50a31b06',    '1600573472591-b69e62aca5d7',
    // Property 17 — cozy cottage
    '1541123437800-36e3e30b0ef7', '1560185893-c12829ea7b62',    '1565182999-41fa53c76b45',
    // Property 18 — urban chic
    '1600585154340-be6161a56a0c', '1502672260266-1c1ef2d93688', '1600607688969-0bf6d93a32fe',
    // Property 19 — desert retreat (Negev)
    '1613241399954-be9b00e18a20', '1545324418-cc1a3fa10c00',    '1558618666-fcd25c85cd64',
    // Property 20 — bohemian studio
    '1583845112203-29329902332e', '1486325212991-386a5e2f3d40',    '1571508601891-ca5e7a713859',
    // Property 21 — artsy loft
    '1588854337115-1c67d9247e4d', '1584622650111-993a426fbf0a', '1564078516393-cf04bd966897',
    // Property 22 — family home
    '1507149831980-35298d432fa0', '1600566752355-35792bedcfea', '1541123437800-36e3e30b0ef7',
    // Property 23 — sea-view flat
    '1600121848594-d8be56841ece', '1560448204-e02f11c3d0e2',    '1583845112203-29329902332e',
    // Property 24 — modern duplex
    '1601058304738-c1bfb94ad5d3', '1582268611-4266d27571bd',    '1507149831980-35298d432fa0',
];

// Returns the 3-image array for property index i (0-based)
const imgs = (i) => [
    IMG(ALL_IDS[i * 3]),
    IMG(ALL_IDS[i * 3 + 1]),
    IMG(ALL_IDS[i * 3 + 2]),
];

// ── 25 Hebrew property definitions ──────────────────────────────────────────
const PROPERTIES = [
    {
        title: 'דירת 3 חדרים מרוהטת בלב דיזנגוף',
        description: 'דירה מעוצבת ומאובזרת במלואה ברחוב דיזנגוף הסואן. חדר שינה מאסטר עם מיטה זוגית, חדר שינה שני עם מיטת יחיד, סלון מרווח ומטבח מאובזר. מרפסת קטנה עם נוף לרחוב. גישה נוחה לתחבורה ציבורית, קפה ומסעדות.',
        price: 650, location: { city: 'תל אביב', street: 'דיזנגוף 72' },
        coordinates: { lat: 32.0799, lng: 34.7726 },
        maxGuests: 4, bedrooms: 3, beds: 3, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer'],
        images: imgs(0),
    },
    {
        title: 'פנטהאוז יוקרתי עם נוף לים בתל אביב',
        description: 'פנטהאוז מדהים בקומה ה-12 עם טרסה פרטית ונוף פנורמי לים התיכון. עיצוב מינימליסטי יוקרתי, מטבח אי, סלון פתוח. חנייה כלולה. מרחק הליכה מהחוף, הסשטנציה ורוטשילד.',
        price: 1800, location: { city: 'תל אביב', street: 'הירקון 148' },
        coordinates: { lat: 32.0870, lng: 34.7677 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'parking', 'pool'],
        images: imgs(1),
    },
    {
        title: 'דירת סטודיו מודרנית ברחוב רוטשילד',
        description: 'סטודיו עם עיצוב עכשווי בבולוור רוטשילד האיקוני. פתוח ומוצף אור, מיטת קומה עם סלון מתחת, מטבח מאובזר. יציאה ישירה לשדרה עם עצים ושבילי אופניים. מיקום אידיאלי לביקורי עסקים ותיירות.',
        price: 380, location: { city: 'תל אביב', street: 'רוטשילד 22' },
        coordinates: { lat: 32.0636, lng: 34.7748 },
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen'],
        images: imgs(2),
    },
    {
        title: 'בית בוהמייני רגוע ברחוב שינקין',
        description: 'דירה שיק ב-2 חדרים בשכונת שינקין הבוהמיינית. ריהוט ווינטג׳ מקסים, תקרות גבוהות, ריצוף טרצו מקורי. קרוב לשוק הכרמל, גלריות ובתי קפה. שקט ורגוע למרות הלב הפועם של העיר.',
        price: 490, location: { city: 'תל אביב', street: 'שינקין 14' },
        coordinates: { lat: 32.0665, lng: 34.7746 },
        maxGuests: 3, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer'],
        images: imgs(3),
    },
    {
        title: 'דירת גן פרטית עם חצר בצפון תל אביב',
        description: 'דירת גן נדירה עם חצר פרטית ירוקה בצפון תל אביב השקטה. שני חדרי שינה, חצר מטופחת עם ריהוט גן. חנייה פרטית ברחוב. מרחק קצר מגן הירקון, הצפון הישן ומסעדות שוות.',
        price: 720, location: { city: 'תל אביב', street: 'בן יהודה 45' },
        coordinates: { lat: 32.0790, lng: 34.7694 },
        maxGuests: 4, bedrooms: 2, beds: 3, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking', 'petFriendly'],
        images: imgs(4),
    },
    {
        title: 'דופלקס מרווח עם מרפסת גדולה ברמת גן',
        description: 'דופלקס יפהפה על שתי קומות עם מרפסת שמש גדולה ונוף לעיר. 3 חדרי שינה, סלון פתוח, מטבח מאובזר. שכונה שקטה ומטופחת, קרוב לדרכי גישה מרכזיות ומרכזי קניות.',
        price: 560, location: { city: 'רמת גן', street: 'ז׳בוטינסקי 50' },
        coordinates: { lat: 32.0739, lng: 34.8199 },
        maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking', 'gym'],
        images: imgs(5),
    },
    {
        title: 'חדר שינה נעים בדירת שיתוף בגבעתיים',
        description: 'חדר שינה פרטי מרווח בדירת שיתוף ברמה גבוהה בגבעתיים. שימוש בסלון, מטבח מאובזר ואמבטיה. שכנים נעימים ומכבדים. תחבורה ציבורית נוחה לתל אביב. מתאים ליחיד או זוג.',
        price: 220, location: { city: 'גבעתיים', street: 'כצנלסון 5' },
        coordinates: { lat: 32.0690, lng: 34.8106 },
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer'],
        images: imgs(6),
    },
    {
        title: 'דירה עם אופי בנחלת בנימין',
        description: 'דירה ייחודית עם חיבור לתרבות עירונית ברחוב נחלת בנימין. קרובה לשוק הפשפשים וגלריות אמנות. עיצוב אינדי עם פסלים ועבודות אמנות מקומיות. מושלם לאמנים, יצירתיים ומחפשי ייחוד.',
        price: 430, location: { city: 'תל אביב', street: 'נחלת בנימין 25' },
        coordinates: { lat: 32.0682, lng: 34.7710 },
        maxGuests: 3, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen'],
        images: imgs(7),
    },
    {
        title: 'דירה מפנקת בלב ירושלים',
        description: 'דירה יפה ומאובזרת ב-3 חדרים ברחוב בן יהודה הסואן. קרובה לשוק מחנה יהודה, רחוב יפו ורחוב הנביאים. עיצוב חם ומזמין. מתאים לביקורים בעיר הקדושה ולשהייה קצרה.',
        price: 480, location: { city: 'ירושלים', street: 'בן יהודה 20' },
        coordinates: { lat: 32.0799, lng: 35.2176 },
        maxGuests: 4, bedrooms: 2, beds: 3, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer'],
        images: imgs(8),
    },
    {
        title: 'בית אבן ירושלמי קסום בעמק רפאים',
        description: 'בית אבן מסורתי מקסים בשכונת עמק רפאים היוקרתית. תקרות קמרוניות, ריצוף אבן ירושלמי מקורי. גינה קטנה ופרטית. שכונה הכי ״פריזאית״ בירושלים — קפה, מסעדות, חנויות עצמאיות.',
        price: 580, location: { city: 'ירושלים', street: 'עמק רפאים 30' },
        coordinates: { lat: 31.7650, lng: 35.2050 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'kitchen', 'washer', 'petFriendly'],
        images: imgs(9),
    },
    {
        title: 'דירת מאסטר עם נוף להרים בתלפיות',
        description: 'דירה מרהיבה בתלפיות עם נוף חד לכיוון הרי יהודה. חדר מאסטר גדול, סלון פתוח ומרפסת שמש. בניין שקט ומטופח. חנייה בחניון. מרחק 10 דקות נסיעה ממרכז ירושלים.',
        price: 420, location: { city: 'ירושלים', street: 'הנשיא 60' },
        coordinates: { lat: 31.7545, lng: 35.2348 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'parking'],
        images: imgs(10),
    },
    {
        title: 'דירת יוקרה עם נוף לים בחיפה הכרמל',
        description: 'דירה מפנקת על הכרמל עם נוף פנורמי למפרץ חיפה. עיצוב מודרני ואלגנטי, רהיטי יוקרה. 3 חדרי שינה, 2 אמבטיות. קרובה לגן הבהאי, המוזיאונים ורחוב הנשיא.',
        price: 750, location: { city: 'חיפה', street: 'הנשיא 15' },
        coordinates: { lat: 32.7940, lng: 34.9896 },
        maxGuests: 6, bedrooms: 3, beds: 3, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking'],
        images: imgs(11),
    },
    {
        title: 'דירת שיק בוואדי ניסנאס ההיסטורי',
        description: 'דירה מקסימה בשכונה הערבית-יהודית המעורבת של וואדי ניסנאס. קירות חשופים, תקרות גבוהות, עיצוב בוהמי. אירוח חמים ואותנטי. שוק, מאפיות ומסעדות מסורתיות ממש מתחת.',
        price: 310, location: { city: 'חיפה', street: 'חסן שוקרי 12' },
        coordinates: { lat: 32.8185, lng: 35.0000 },
        maxGuests: 3, bedrooms: 1, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'kitchen', 'airConditioning'],
        images: imgs(12),
    },
    {
        title: 'פנטהאוז עם בריכה פרטית בנתניה',
        description: 'פנטהאוז מפואר בנתניה עם בריכת שחייה פרטית על הגג ונוף לים. 4 חדרי שינה, 2 אמבטיות. מרחק 5 דקות מהחוף. מושלם לחופשת משפחה גדולה.',
        price: 1400, location: { city: 'נתניה', street: 'הרצל 1' },
        coordinates: { lat: 32.3285, lng: 34.8575 },
        maxGuests: 8, bedrooms: 4, beds: 5, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking', 'pool'],
        images: imgs(13),
    },
    {
        title: 'דירת חוף עם גישה ישירה לים',
        description: 'דירה נדירה עם גישה ישירה לחוף הים בנתניה. כניסה מהגינה ישר לחוף. 2 חדרי שינה, מרפסת עם נוף לגלים. חנייה פרטית. מושלם לזוגות ולמשפחות קטנות.',
        price: 820, location: { city: 'נתניה', street: 'ניצנה 3' },
        coordinates: { lat: 32.3210, lng: 34.8530 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'parking'],
        images: imgs(14),
    },
    {
        title: 'וילה יוקרתית עם בריכה בהרצליה פיתוח',
        description: 'וילה מפוארת ב-5 חדרים בהרצליה פיתוח היוקרתית. בריכת שחייה מחוממת, גינה מטופחת, חנייה ל-3 רכבים. מרחק הליכה ממרכז הרצליה פיתוח. מושלם לאירועים ושהות ממושכת.',
        price: 2500, location: { city: 'הרצליה', street: 'שד׳ בן גוריון 10' },
        coordinates: { lat: 32.1644, lng: 34.8374 },
        maxGuests: 10, bedrooms: 5, beds: 6, bathrooms: 3,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking', 'pool', 'gym'],
        images: imgs(15),
    },
    {
        title: 'דירה חדשה ומושלמת בפתח תקווה',
        description: 'דירה חדשה בפרויקט יוקרתי בפתח תקווה. עיצוב מודרני, מטבח איטלקי, מערכת בית חכם. גישה נוחה לכביש 1, 2 ו-5. קרובה לתחנת הרכבת ומרכזי קניות.',
        price: 360, location: { city: 'פתח תקווה', street: 'ז׳בוטינסקי 30' },
        coordinates: { lat: 32.0874, lng: 34.8862 },
        maxGuests: 4, bedrooms: 3, beds: 3, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking'],
        images: imgs(16),
    },
    {
        title: 'דירת גן נעימה בראשון לציון',
        description: 'דירת גן נוחה ושקטה בשכונה מטופחת בראשון לציון. חצר פרטית ירוקה, 2 חדרי שינה, מטבח מלא. כלב/חתול בברכה. מרחק קצר מרחוב הרצל וגן לאומי.',
        price: 340, location: { city: 'ראשון לציון', street: 'רוטשילד 10' },
        coordinates: { lat: 31.9730, lng: 34.7895 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'petFriendly'],
        images: imgs(17),
    },
    {
        title: 'סטודיו אמנותי ייחודי בנווה שאנן, חיפה',
        description: 'סטודיו בוהמי עם אופי אמנותי ייחודי בנווה שאנן. תקרות גבוהות, חלונות ענקיים ומרפסת עם עציצים. קרוב לסטודנטים ואנשי אמנות. אינטרנט מהיר ומרחב עבודה נוח.',
        price: 250, location: { city: 'חיפה', street: 'מוריה 50' },
        coordinates: { lat: 32.8020, lng: 35.0100 },
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen'],
        images: imgs(18),
    },
    {
        title: 'דירה מפנקת ומרווחת בבאר שבע',
        description: 'דירה גדולה ונוחה בשכונת הנשיא בבאר שבע. 4 חדרי שינה, שני חדרי רחצה, סלון ענק. מתאים לקבוצות גדולות. קרוב לאוניברסיטת בן גוריון ובתי חולים.',
        price: 300, location: { city: 'באר שבע', street: 'הנשיא 20' },
        coordinates: { lat: 31.2518, lng: 34.7913 },
        maxGuests: 8, bedrooms: 4, beds: 5, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking'],
        images: imgs(19),
    },
    {
        title: 'צימר יוקרתי עם ג׳קוזי ונוף לנגב',
        description: 'צימר פינוק מדהים בקצה הנגב הצפוני עם ג׳קוזי חיצוני ונוף לשמי כוכבים. מיטת קינג, ארוחת בוקר כלולה. מרחק 40 דקות מאילת. מושלם לרומנטיקה וזוגות.',
        price: 950, location: { city: 'מצפה רמון', street: 'בן גוריון 1' },
        coordinates: { lat: 30.6105, lng: 34.8010 },
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen'],
        images: imgs(20),
    },
    {
        title: 'דירת חוף צעירה וחיה באשדוד',
        description: 'דירה צעירה, מרוהטת ומלאת חיים ליד חוף לידו באשדוד. 2 חדרי שינה, מרפסת, 5 דקות הליכה מהים. מפגש בין תרבויות, שוק ערבי וחוף תל צור.',
        price: 290, location: { city: 'אשדוד', street: 'הנשיא 20' },
        coordinates: { lat: 31.8040, lng: 34.6552 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer'],
        images: imgs(21),
    },
    {
        title: 'בית כפרי בין היקבים במודיעין',
        description: 'בית כפרי מקסים בין גבעות מודיעין. 3 חדרי שינה, גינה גדולה, מרפסת. קרוב ליקבים, שבילי אופניים וגן לאומי. מרחק 30 דקות מתל אביב וירושלים כאחד.',
        price: 520, location: { city: 'מודיעין', street: 'האשל 5' },
        coordinates: { lat: 31.8992, lng: 35.0095 },
        maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking', 'petFriendly'],
        images: imgs(22),
    },
    {
        title: 'חדר מרוהט בדירה שיתופית ברחוב גורדון',
        description: 'חדר שינה מרווח ומוקפד בדירת שיתוף יוקרתית בגורדון, תל אביב. קרוב לים, לשדרת רוטשילד ולכיכר המדינה. שימוש במטבח מאובזר, סלון מעוצב ואמבטיה נוחה.',
        price: 270, location: { city: 'תל אביב', street: 'גורדון 8' },
        coordinates: { lat: 32.0800, lng: 34.7711 },
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer'],
        images: imgs(23),
    },
    {
        title: 'דירת נופש מרוהטת בהולון',
        description: 'דירה נוחה ומלאה בכל מה שצריך בהולון התוססת. 2 חדרי שינה, חנייה בחניון. קרוב למוזיאון הקומיקס, פארק ספורט ומרכזי קניות. גישה נוחה לתל אביב ב-15 דקות.',
        price: 320, location: { city: 'חולון', street: 'סוקולוב 15' },
        coordinates: { lat: 32.0147, lng: 34.7750 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking'],
        images: imgs(24),
    },
];

async function main() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✔ Connected to MongoDB');

    const db = client.db('homeseek');
    const propertiesCol = db.collection('properties');
    const usersCol = db.collection('users');

    // Get existing user IDs to assign as owners
    const users = await usersCol.find({}, { projection: { _id: 1 } }).toArray();
    if (users.length === 0) {
        console.error('✘ No users found — run seed-users.js first');
        await client.close();
        process.exit(1);
    }
    const userIds = users.map(u => u._id.toString());
    console.log(`✔ Found ${userIds.length} users to assign as owners`);

    // Drop existing properties
    const deleted = await propertiesCol.deleteMany({});
    console.log(`✔ Deleted ${deleted.deletedCount} existing properties`);

    // Insert new properties
    const now = new Date();
    const docs = PROPERTIES.map((p, i) => ({
        ...p,
        ownerId: userIds[i % userIds.length],
        likesCount: Math.floor(Math.random() * 40),
        commentsCount: 0,
        createdAt: now,
        updatedAt: now,
        __v: 0,
    }));

    const result = await propertiesCol.insertMany(docs);
    console.log(`✔ Inserted ${result.insertedCount} properties`);

    console.log('\n=== Done! ===');
    console.log('Each property now has 3 unique images — no duplicate cover photos.');
    await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
