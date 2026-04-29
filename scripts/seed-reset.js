/**
 * Full DB reset + seed:
 *  - Clears users, properties, likes, comments, conversations, messages
 *  - Creates lior (lior@test.com) and rony (rony@test.com)  — password: Test1234!
 *  - Creates 10 properties: 5 per user, ALL with images
 *
 * Run from monorepo root:  node scripts/seed-reset.js
 */
const { MongoClient } = require('mongodb');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI ||
    'mongodb://server:e5f5c26a7580f0bac585c1d50369c1227114184f9c92f048@localhost:21771/homeseek';

const IMG = (id) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const PROPERTIES = [
    // ── Lior's 5 properties ──────────────────────────────────────────────
    {
        title: 'דירת גן יוקרתית בתל אביב',
        description: 'דירת גן מרוהטת ברמה גבוהה עם גינה פרטית ובריכה. שקט, מרווח ובמרחק הליכה מהים.',
        price: 850,
        location: { city: 'תל אביב', street: 'דיזנגוף 45' },
        images: [
            IMG('1502672260266-1c1ef2d93688'),
            IMG('1556909114-f6e7ad7d3136'),
            IMG('1560448204-e02f11c3d0e2'),
        ],
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'pool', 'parking', 'ac'],
        coordinates: { lat: 32.0853, lng: 34.7818 },
    },
    {
        title: 'סטודיו מודרני במרכז תל אביב',
        description: 'סטודיו עיצובי ומאובזר מלא. אידיאלי לזוג או יחיד שרוצה לחיות בלב תל אביב.',
        price: 450,
        location: { city: 'תל אביב', street: 'רוטשילד 12' },
        images: [
            IMG('1545324418-cc1a3fa10c00'),
            IMG('1484154133-5be7c1b22d11'),
            IMG('1584622650111-993a426fbf0a'),
        ],
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'ac'],
        coordinates: { lat: 32.0641, lng: 34.7741 },
    },
    {
        title: 'דירה בחיפה עם נוף לים',
        description: 'דירה מרווחת בכרמל עם מרפסת ונוף פתוח לים התיכון. רגיעה מוחלטת.',
        price: 600,
        location: { city: 'חיפה', street: 'הכרמל 7' },
        images: [
            IMG('1571508601891-ca5e7a713859'),
            IMG('1554995207-c9d0f5a5d62f'),
            IMG('1600566752355-35792bedcfea'),
        ],
        maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2,
        amenities: ['wifi', 'parking', 'ac'],
        coordinates: { lat: 32.7940, lng: 34.9896 },
    },
    {
        title: 'בית כפרי בגליל',
        description: 'בית אבן מקסים בלב הגליל. טבע, שקט ואוויר צח. מתאים למשפחות.',
        price: 700,
        location: { city: 'ראש פינה', street: 'הגפן 3' },
        images: [
            IMG('1586023492125-27264fee2e32'),
            IMG('1598928506311-c55ded91a20c'),
            IMG('1600573472591-b69e62aca5d7'),
        ],
        maxGuests: 8, bedrooms: 4, beds: 5, bathrooms: 2,
        amenities: ['wifi', 'parking', 'pets'],
        coordinates: { lat: 32.9758, lng: 35.5678 },
    },
    {
        title: 'אוהל גלאמפינג בנגב',
        description: 'חוויית לינה ייחודית תחת כיפת השמיים הנגבית. שמי לילה מדהימים וארוחת בוקר כלולה.',
        price: 380,
        location: { city: 'מצפה רמון', street: 'דרך הנחל 1' },
        images: [
            IMG('1613241399954-be9b00e18a20'),
            IMG('1565182999-41fa53c76b45'),
            IMG('1600210492493-0fe1a60480c8'),
        ],
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['breakfast'],
        coordinates: { lat: 30.6105, lng: 34.8017 },
    },

    // ── Rony's 5 properties ──────────────────────────────────────────────
    {
        title: 'פנטהאוז בירושלים עם נוף לעיר',
        description: 'פנטהאוז מעוצב ברמה הגבוהה ביותר. נוף פנורמי לעיר העתיקה ושקיעות מרהיבות.',
        price: 1200,
        location: { city: 'ירושלים', street: 'המלך דוד 5' },
        images: [
            IMG('1600585154526-58884b39c4ea'),
            IMG('1555041469-eade50a31b06'),
            IMG('1493809842364-78817add7ffb'),
        ],
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
        amenities: ['wifi', 'parking', 'ac', 'gym'],
        coordinates: { lat: 31.7767, lng: 35.2345 },
    },
    {
        title: 'וילה עם בריכה באילת',
        description: 'וילה מפוארת קרובה לחוף עם בריכה פרטית וגינה. חופשת חלומות בדרום.',
        price: 1500,
        location: { city: 'אילת', street: 'תרשיש 8' },
        images: [
            IMG('1616594039964-ae485a617a19'),
            IMG('1560185893-c12829ea7b62'),
            IMG('1558618666-fcd25c85cd64'),
        ],
        maxGuests: 10, bedrooms: 5, beds: 6, bathrooms: 3,
        amenities: ['wifi', 'pool', 'parking', 'ac', 'bbq'],
        coordinates: { lat: 29.5577, lng: 34.9519 },
    },
    {
        title: 'דירה קלאסית בנתניה',
        description: 'דירה נעימה 200 מטר מהים. מרפסת עם נוף לגינה שקטה. אזור שקט ומרכזי.',
        price: 520,
        location: { city: 'נתניה', street: 'הרצל 22' },
        images: [
            IMG('1583845112203-29329902332e'),
            IMG('1512917774080-9991f1c4c750'),
            IMG('1582268611-4266d27571bd'),
        ],
        maxGuests: 4, bedrooms: 2, beds: 3, bathrooms: 1,
        amenities: ['wifi', 'ac'],
        coordinates: { lat: 32.3226, lng: 34.8533 },
    },
    {
        title: 'בית בוטיק בצפת',
        description: 'בית עתיק ומחודש בלב הרובע האמנותי של צפת. אווירה מיסטית ובלתי נשכחת.',
        price: 650,
        location: { city: 'צפת', street: 'אלכסנדר זייד 4' },
        images: [
            IMG('1554995207-c9d0f5a5d62f'),
            IMG('1588854337115-1c67d9247e4d'),
            IMG('1631049307264-da0ec9d70304'),
        ],
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'parking'],
        coordinates: { lat: 32.9647, lng: 35.4975 },
    },
    {
        title: 'דירת חדר בבאר שבע',
        description: 'דירה פרקטית ונוחה קרוב לאוניברסיטה ולמרכז העיר. מתאים לתלמידים ועסקים.',
        price: 280,
        location: { city: 'באר שבע', street: 'רגר 10' },
        images: [
            IMG('1564078516393-cf04bd966897'),
            IMG('1600607688969-0bf6d93a32fe'),
            IMG('1541123437800-36e3e30b0ef7'),
        ],
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi'],
        coordinates: { lat: 31.2518, lng: 34.7913 },
    },
];

async function hashPassword(password) {
    const bcrypt = require(path.join(__dirname, '..', 'node_modules', 'bcrypt'));
    return bcrypt.hash(password, 10);
}

async function main() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✔ Connected to MongoDB');
    const db = client.db('homeseek');

    // ── 1. Clear all collections ─────────────────────────────────────────
    const toDrop = ['users', 'properties', 'likes', 'comments', 'conversations', 'messages'];
    for (const col of toDrop) {
        const result = await db.collection(col).deleteMany({});
        console.log(`🗑  Cleared ${col} (${result.deletedCount} docs)`);
    }

    // ── 2. Create lior + rony ─────────────────────────────────────────────
    const hashedPw = await hashPassword('Test1234!');
    const now = new Date();

    const liorResult = await db.collection('users').insertOne({
        firstName: 'ליאור', lastName: 'שוורץ', email: 'lior@test.com',
        password: hashedPw,
        picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
        googleId: null, facebookId: null, currentHashedRefreshToken: null,
        createdAt: now, updatedAt: now,
    });
    const liorId = liorResult.insertedId.toString();
    console.log(`✔ Created user: ליאור שוורץ (${liorId})`);

    const ronyResult = await db.collection('users').insertOne({
        firstName: 'רוני', lastName: 'לוי', email: 'rony@test.com',
        password: hashedPw,
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
        googleId: null, facebookId: null, currentHashedRefreshToken: null,
        createdAt: now, updatedAt: now,
    });
    const ronyId = ronyResult.insertedId.toString();
    console.log(`✔ Created user: רוני לוי (${ronyId})`);

    // ── 3. Insert 10 properties (5 lior, 5 rony) ─────────────────────────
    const ownerIds = [liorId, liorId, liorId, liorId, liorId, ronyId, ronyId, ronyId, ronyId, ronyId];

    for (let i = 0; i < PROPERTIES.length; i++) {
        const p = PROPERTIES[i];
        await db.collection('properties').insertOne({
            ...p,
            ownerId: ownerIds[i],
            likesCount: 0,
            commentsCount: 0,
            averageRating: null,
            createdAt: now,
            updatedAt: now,
        });
        console.log(`  [${i + 1}] ${p.title} → ${i < 5 ? 'ליאור' : 'רוני'} (${p.images.length} photos)`);
    }

    console.log('\n✅ Seed complete!');
    console.log('──────────────────────────────');
    console.log('lior@test.com  / Test1234!');
    console.log('rony@test.com  / Test1234!');
    console.log('──────────────────────────────');

    await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
