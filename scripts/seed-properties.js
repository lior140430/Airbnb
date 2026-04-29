/**
 * Seed script: replaces all properties with Hebrew data, real Israeli addresses, apartment photos.
 * Run from server:
 *   node scripts/seed-properties.js
 */
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://server:e5f5c26a7580f0bac585c1d50369c1227114184f9c92f048@localhost:21771/homeseek';

// ── Apartment image sets (Unsplash) ──────────────────────────────────────────
// Each set = 3-4 images for one property
const IMG = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const IMAGE_SETS = [
    [ IMG('1502672260266-1c1ef2d93688'), IMG('1556909114-f6e7ad7d3136'), IMG('1560448204-e02f11c3d0e2') ],
    [ IMG('1545324418-cc1a3fa10c00'),    IMG('1484154133-5be7c1b22d11'), IMG('1584622650111-993a426fbf0a') ],
    [ IMG('1555041469-eade50a31b06'),    IMG('1522771739-8b9b8d5b9c8e'), IMG('1493809842364-78817add7ffb') ],
    [ IMG('1512917774080-9991f1c4c750'), IMG('1560185893-c12829ea7b62'), IMG('1556909114-f6e7ad7d3136') ],
    [ IMG('1582268611-4266d27571bd'),    IMG('1630699144-8dd60a3oba99'), IMG('1560448204-e02f11c3d0e2') ],
    [ IMG('1631049307264-da0ec9d70304'), IMG('1502672260266-1c1ef2d93688'), IMG('1545324418-cc1a3fa10c00') ],
    [ IMG('1484154133-5be7c1b22d11'),    IMG('1555041469-eade50a31b06'), IMG('1522771739-8b9b8d5b9c8e') ],
    [ IMG('1560185893-c12829ea7b62'),    IMG('1556909114-f6e7ad7d3136'), IMG('1584622650111-993a426fbf0a') ],
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
        images: IMAGE_SETS[0],
    },
    {
        title: 'פנטהאוז יוקרתי עם נוף לים בתל אביב',
        description: 'פנטהאוז מדהים בקומה ה-12 עם טרסה פרטית ונוף פנורמי לים התיכון. עיצוב מינימליסטי יוקרתי, מטבח אי, סלון פתוח. חנייה כלולה. מרחק הליכה מהחוף, הסשטנציה ורוטשילד.',
        price: 1800, location: { city: 'תל אביב', street: 'הירקון 148' },
        coordinates: { lat: 32.0870, lng: 34.7677 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'parking', 'pool'],
        images: IMAGE_SETS[1],
    },
    {
        title: 'דירת סטודיו מודרנית ברחוב רוטשילד',
        description: 'סטודיו עם עיצוב עכשווי בבולוור רוטשילד האיקוני. פתוח ומוצף אור, מיטת קומה עם סלון מתחת, מטבח מאובזר. יציאה ישירה לשדרה עם עצים ושבילי אופניים. מיקום אידיאלי לביקורי עסקים ותיירות.',
        price: 380, location: { city: 'תל אביב', street: 'רוטשילד 22' },
        coordinates: { lat: 32.0636, lng: 34.7748 },
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen'],
        images: IMAGE_SETS[2],
    },
    {
        title: 'בית בוהמייני רגוע ברחוב שינקין',
        description: 'דירה שיק ב-2 חדרים בשכונת שינקין הבוהמיינית. ריהוט ווינטג׳ מקסים, תקרות גבוהות, ריצוף טרצו מקורי. קרוב לשוק הכרמל, גלריות ובתי קפה. שקט ורגוע למרות הלב הפועם של העיר.',
        price: 490, location: { city: 'תל אביב', street: 'שינקין 14' },
        coordinates: { lat: 32.0665, lng: 34.7746 },
        maxGuests: 3, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer'],
        images: IMAGE_SETS[3],
    },
    {
        title: 'דירת גן פרטית עם חצר בצפון תל אביב',
        description: 'דירת גן נדירה עם חצר פרטית ירוקה בצפון תל אביב השקטה. שני חדרי שינה, חצר מטופחת עם ריהוט גן. חנייה פרטית ברחוב. מרחק קצר מגן הירקון, הצפון הישן ומסעדות שוות.',
        price: 720, location: { city: 'תל אביב', street: 'בן יהודה 45' },
        coordinates: { lat: 32.0790, lng: 34.7694 },
        maxGuests: 4, bedrooms: 2, beds: 3, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking', 'petFriendly'],
        images: IMAGE_SETS[4],
    },
    {
        title: 'דופלקס מרווח עם מרפסת גדולה ברמת גן',
        description: 'דופלקס יפהפה על שתי קומות עם מרפסת שמש גדולה ונוף לעיר. 3 חדרי שינה, סלון פתוח, מטבח מאובזר. שכונה שקטה ומטופחת, קרוב לדרכי גישה מרכזיות ומרכזי קניות.',
        price: 560, location: { city: 'רמת גן', street: 'ז׳בוטינסקי 50' },
        coordinates: { lat: 32.0739, lng: 34.8199 },
        maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking', 'gym'],
        images: IMAGE_SETS[5],
    },
    {
        title: 'חדר שינה נעים בדירת שיתוף בגבעתיים',
        description: 'חדר שינה פרטי מרווח בדירת שיתוף ברמה גבוהה בגבעתיים. שימוש בסלון, מטבח מאובזר ואמבטיה. שכנים נעימים ומכבדים. תחבורה ציבורית נוחה לתל אביב. מתאים ליחיד או זוג.',
        price: 220, location: { city: 'גבעתיים', street: 'כצנלסון 5' },
        coordinates: { lat: 32.0690, lng: 34.8106 },
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer'],
        images: IMAGE_SETS[6],
    },
    {
        title: 'דירה עם אופי בנחלת בנימין',
        description: 'דירה ייחודית עם חיבור לתרבות עירונית ברחוב נחלת בנימין. קרובה לשוק הפשפשים וגלריות אמנות. עיצוב אינדי עם פסלים ועבודות אמנות מקומיות. מושלם לאמנים, יצירתיים ומחפשי ייחוד.',
        price: 430, location: { city: 'תל אביב', street: 'נחלת בנימין 25' },
        coordinates: { lat: 32.0682, lng: 34.7710 },
        maxGuests: 3, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen'],
        images: IMAGE_SETS[7],
    },
    {
        title: 'דירה מפנקת בלב ירושלים',
        description: 'דירה יפה ומאובזרת ב-3 חדרים ברחוב בן יהודה הסואן. קרובה לשוק מחנה יהודה, רחוב יפו ורחוב הנביאים. עיצוב חם ומזמין. מתאים לבקרים בעיר הקדושה ולשהייה קצרה.',
        price: 480, location: { city: 'ירושלים', street: 'בן יהודה 20' },
        coordinates: { lat: 32.0799, lng: 35.2176 },
        maxGuests: 4, bedrooms: 2, beds: 3, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer'],
        images: IMAGE_SETS[0],
    },
    {
        title: 'בית אבן ירושלמי קסום בעמק רפאים',
        description: 'בית אבן מסורתי מקסים בשכונת עמק רפאים היוקרתית. תקרות קמרוניות, ריצוף אבן ירושלמי מקורי. גינה קטנה ופרטית. שכונה הכי ״פריזאית״ בירושלים — קפה, מסעדות, חנויות עצמאיות.',
        price: 580, location: { city: 'ירושלים', street: 'עמק רפאים 30' },
        coordinates: { lat: 31.7650, lng: 35.2050 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'kitchen', 'washer', 'petFriendly'],
        images: IMAGE_SETS[1],
    },
    {
        title: 'דירת מאסטר עם נוף להרים בתלפיות',
        description: 'דירה מרהיבה בתלפיות עם נוף חד לכיוון הרי יהודה. חדר מאסטר גדול, סלון פתוח ומרפסת שמש. בניין שקט ומטופח. חנייה בחניון. מרחק 10 דקות נסיעה ממרכז ירושלים.',
        price: 420, location: { city: 'ירושלים', street: 'הנשיא 60' },
        coordinates: { lat: 31.7545, lng: 35.2348 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'parking'],
        images: IMAGE_SETS[2],
    },
    {
        title: 'דירת יוקרה עם נוף לים בחיפה הכרמל',
        description: 'דירה מפנקת על הכרמל עם נוף פנורמי למפרץ חיפה. עיצוב מודרני ואלגנטי, רהיטי יוקרה. 3 חדרי שינה, 2 אמבטיות. קרובה לגן הבהאי, המוזיאונים ורחוב הנשיא.',
        price: 750, location: { city: 'חיפה', street: 'הנשיא 15' },
        coordinates: { lat: 32.7940, lng: 34.9896 },
        maxGuests: 6, bedrooms: 3, beds: 3, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking'],
        images: IMAGE_SETS[3],
    },
    {
        title: 'דירת שיק בוואדי ניסנאס ההיסטורי',
        description: 'דירה מקסימה בשכונה הערבית-יהודית המעורבת של וואדי ניסנאס. קירות חשופים, תקרות גבוהות, עיצוב בוהמי. אירוח חמים ואותנטי. שוק, מאפיות ומסעדות מסורתיות ממש מתחת.',
        price: 310, location: { city: 'חיפה', street: 'חסן שוקרי 12' },
        coordinates: { lat: 32.8185, lng: 35.0000 },
        maxGuests: 3, bedrooms: 1, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'kitchen', 'airConditioning'],
        images: IMAGE_SETS[4],
    },
    {
        title: 'פנטהאוז עם בריכה פרטית בנתניה',
        description: 'פנטהאוז מפואר בנתניה עם בריכת שחייה פרטית על הגג ונוף לים. 4 חדרי שינה, 2 אמבטיות. מרחק 5 דקות מהחוף. מושלם לחופשת משפחה גדולה.',
        price: 1400, location: { city: 'נתניה', street: 'הרצל 1' },
        coordinates: { lat: 32.3285, lng: 34.8575 },
        maxGuests: 8, bedrooms: 4, beds: 5, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking', 'pool'],
        images: IMAGE_SETS[5],
    },
    {
        title: 'דירת חוף עם גישה ישירה לים',
        description: 'דירה נדירה עם גישה ישירה לחוף הים בנתניה. כניסה מהגינה ישר לחוף. 2 חדרי שינה, מרפסת עם נוף לגלים. חנייה פרטית. מושלם לזוגות ולמשפחות קטנות.',
        price: 820, location: { city: 'נתניה', street: 'ניצנה 3' },
        coordinates: { lat: 32.3210, lng: 34.8530 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'parking'],
        images: IMAGE_SETS[6],
    },
    {
        title: 'וילה יוקרתית עם בריכה בהרצליה פיתוח',
        description: 'וילה מפוארת ב-5 חדרים בהרצליה פיתוח היוקרתית. בריכת שחייה מחוממת, גינה מטופחת, חנייה ל-3 רכבים. מרחק הליכה ממרכז הרצליה פיתוח. מושלם לאירועים ושהות ממושכת.',
        price: 2500, location: { city: 'הרצליה', street: 'שד׳ בן גוריון 10' },
        coordinates: { lat: 32.1644, lng: 34.8374 },
        maxGuests: 10, bedrooms: 5, beds: 6, bathrooms: 3,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking', 'pool', 'gym'],
        images: IMAGE_SETS[7],
    },
    {
        title: 'דירה חדשה ומושלמת בפתח תקווה',
        description: 'דירה חדשה בפרויקט יוקרתי בפתח תקווה. עיצוב מודרני, מטבח איטלקי, מערכת בית חכם. גישה נוחה לכביש 1, 2 ו-5. קרובה לתחנת הרכבת ומרכזי קניות.',
        price: 360, location: { city: 'פתח תקווה', street: 'ז׳בוטינסקי 30' },
        coordinates: { lat: 32.0874, lng: 34.8862 },
        maxGuests: 4, bedrooms: 3, beds: 3, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking'],
        images: IMAGE_SETS[0],
    },
    {
        title: 'דירת גן נעימה בראשון לציון',
        description: 'דירת גן נוחה ושקטה בשכונה מטופחת בראשון לציון. חצר פרטית ירוקה, 2 חדרי שינה, מטבח מלא. כלב/חתול בברכה. מרחק קצר מרחוב הרצל וגן לאומי.',
        price: 340, location: { city: 'ראשון לציון', street: 'רוטשילד 10' },
        coordinates: { lat: 31.9730, lng: 34.7895 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'petFriendly'],
        images: IMAGE_SETS[1],
    },
    {
        title: 'סטודיו אמנותי ייחודי בנווה שאנן, חיפה',
        description: 'סטודיו בוהמי עם אופי אמנותי ייחודי בנווה שאנן. תקרות גבוהות, חלונות ענקיים ומרפסת עם עציצים. קרוב לסטודנטים ואנשי אמנות. אינטרנט מהיר ומרחב עבודה נוח.',
        price: 250, location: { city: 'חיפה', street: 'מוריה 50' },
        coordinates: { lat: 32.8020, lng: 35.0100 },
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen'],
        images: IMAGE_SETS[2],
    },
    {
        title: 'דירה מפנקת ומרווחת בבאר שבע',
        description: 'דירה גדולה ונוחה בשכונת הנשיא בבאר שבע. 4 חדרי שינה, שני חדרי רחצה, סלון ענק. מתאים לקבוצות גדולות. קרוב לאוניברסיטת בן גוריון ובתי חולים.',
        price: 300, location: { city: 'באר שבע', street: 'הנשיא 20' },
        coordinates: { lat: 31.2518, lng: 34.7913 },
        maxGuests: 8, bedrooms: 4, beds: 5, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking'],
        images: IMAGE_SETS[3],
    },
    {
        title: 'צימר יוקרתי עם ג׳קוזי ונוף לנגב',
        description: 'צימר פינוק מדהים בקצה הנגב הצפוני עם ג׳קוזי חיצוני ונוף לשמי כוכבים. מיטת קינג, ארוחת בוקר כלולה. מרחק 40 דקות מאילת. מושלם לרומנטיקה וזוגות.',
        price: 950, location: { city: 'מצפה רמון', street: 'בן גוריון 1' },
        coordinates: { lat: 30.6105, lng: 34.8010 },
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen'],
        images: IMAGE_SETS[4],
    },
    {
        title: 'דירת חוף צעירה וחיה באשדוד',
        description: 'דירה צעירה, מרוהטת ומלאת חיים ליד חוף לידו באשדוד. 2 חדרי שינה, מרפסת, 5 דקות הליכה מהים. מפגש בין תרבויות, שוק ערבי וחוף תל צור.',
        price: 290, location: { city: 'אשדוד', street: 'הנשיא 20' },
        coordinates: { lat: 31.8040, lng: 34.6552 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer'],
        images: IMAGE_SETS[5],
    },
    {
        title: 'בית כפרי בין היקבים במודיעין',
        description: 'בית כפרי מקסים בין גבעות מודיעין. 3 חדרי שינה, גינה גדולה, מרפסת. קרוב ליקבים, שבילי אופניים וגן לאומי. מרחק 30 דקות מתל אביב וירושלים כאחד.',
        price: 520, location: { city: 'מודיעין', street: 'האשל 5' },
        coordinates: { lat: 31.8992, lng: 35.0095 },
        maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking', 'petFriendly'],
        images: IMAGE_SETS[6],
    },
    {
        title: 'חדר מרוהט בדירה שיתופית ברחוב גורדון',
        description: 'חדר שינה מרווח ומוקפד בדירת שיתוף יוקרתית בגורדון, תל אביב. קרוב לים, לשדרת רוטשילד ולכיכר המדינה. שימוש במטבח מאובזר, סלון מעוצב ואמבטיה נוחה.',
        price: 270, location: { city: 'תל אביב', street: 'גורדון 8' },
        coordinates: { lat: 32.0800, lng: 34.7711 },
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer'],
        images: IMAGE_SETS[7],
    },
    {
        title: 'דירת נופש מרוהטת בהולון',
        description: 'דירה נוחה ומלאה בכל מה שצריך בהולון התוססת. 2 חדרי שינה, חנייה בחניון. קרוב למוזיאון הקומיקס, פארק ספורט ומרכזי קניות. גישה נוחה לתל אביב ב-15 דקות.',
        price: 320, location: { city: 'חולון', street: 'סוקולוב 15' },
        coordinates: { lat: 32.0147, lng: 34.7750 },
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'airConditioning', 'kitchen', 'washer', 'parking'],
        images: IMAGE_SETS[0],
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
    console.log('Properties are now in Hebrew with real Israeli addresses and apartment images.');
    await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
