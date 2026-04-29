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

// AI-generated images via Pollinations.ai
// Same prompt + seed always produces the same image — no 404s, no duplicates
const AI = (prompt, seed) =>
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=800&height=600&nologo=true&model=flux`;

const PROPERTIES = [
    // ── Lior's 5 properties ──────────────────────────────────────────────
    {
        title: 'דירת גן יוקרתית בתל אביב',
        description: 'דירת גן מרוהטת ברמה גבוהה עם גינה פרטית ובריכה. שקט, מרווח ובמרחק הליכה מהים.',
        price: 850,
        location: { city: 'תל אביב', street: 'דיזנגוף 45' },
        images: [
            AI('luxury garden apartment Tel Aviv private pool terrace sunlight modern', 101),
            AI('elegant living room white sofa large windows garden view Tel Aviv', 102),
            AI('private swimming pool luxury garden apartment Israel sunny day', 103),
        ],
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        amenities: ['wifi', 'pool', 'parking', 'airConditioning'],
        coordinates: { lat: 32.0853, lng: 34.7818 },
    },
    {
        title: 'סטודיו מודרני במרכז תל אביב',
        description: 'סטודיו עיצובי ומאובזר מלא. אידיאלי לזוג או יחיד שרוצה לחיות בלב תל אביב.',
        price: 450,
        location: { city: 'תל אביב', street: 'רוטשילד 12' },
        images: [
            AI('modern studio apartment interior design Tel Aviv minimalist chic', 201),
            AI('stylish studio loft open plan kitchen living area city view', 202),
            AI('cozy studio apartment bedroom workspace city skyline window', 203),
        ],
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        amenities: ['wifi', 'airConditioning'],
        coordinates: { lat: 32.0641, lng: 34.7741 },
    },
    {
        title: 'דירה בחיפה עם נוף לים',
        description: 'דירה מרווחת בכרמל עם מרפסת ונוף פתוח לים התיכון. רגיעה מוחלטת.',
        price: 600,
        location: { city: 'חיפה', street: 'הכרמל 7' },
        images: [
            AI('spacious apartment balcony Mediterranean sea view Haifa Carmel Israel blue sky', 301),
            AI('bright apartment living room panoramic sea view large windows', 302),
            AI('master bedroom sea view balcony Mediterranean coast morning light', 303),
        ],
        maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2,
        amenities: ['wifi', 'parking', 'airConditioning'],
        coordinates: { lat: 32.7940, lng: 34.9896 },
    },
    {
        title: 'בית כפרי בגליל',
        description: 'בית אבן מקסים בלב הגליל. טבע, שקט ואוויר צח. מתאים למשפחות.',
        price: 700,
        location: { city: 'ראש פינה', street: 'הגפן 3' },
        images: [
            AI('charming stone house Galilee Israel green hills vineyard rustic exterior', 401),
            AI('rustic stone house interior wooden beams cozy living room fireplace Galilee', 402),
            AI('stone house garden vineyard Galilee sunset Israel countryside quiet', 403),
        ],
        maxGuests: 8, bedrooms: 4, beds: 5, bathrooms: 2,
        amenities: ['wifi', 'parking', 'petFriendly'],
        coordinates: { lat: 32.9758, lng: 35.5678 },
    },
    {
        title: 'אוהל גלאמפינג בנגב',
        description: 'חוויית לינה ייחודית תחת כיפת השמיים הנגבית. שמי לילה מדהימים וארוחת בוקר כלולה.',
        price: 380,
        location: { city: 'מצפה רמון', street: 'דרך הנחל 1' },
        images: [
            AI('luxury glamping tent desert Israel Negev Mitzpe Ramon starry night sky', 501),
            AI('glamping tent interior cozy bed fairy lights desert night', 502),
            AI('Ramon crater desert landscape Israel Negev sunrise dramatic', 503),
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
            AI('luxury penthouse Jerusalem panoramic view Old City golden dome sunset', 601),
            AI('penthouse rooftop terrace Jerusalem stone walls old city view evening', 602),
            AI('modern penthouse interior Jerusalem Jerusalem stone walls high ceiling luxury', 603),
        ],
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
        amenities: ['wifi', 'parking', 'airConditioning', 'gym'],
        coordinates: { lat: 31.7767, lng: 35.2345 },
    },
    {
        title: 'וילה עם בריכה באילת',
        description: 'וילה מפוארת קרובה לחוף עם בריכה פרטית וגינה. חופשת חלומות בדרום.',
        price: 1500,
        location: { city: 'אילת', street: 'תרשיש 8' },
        images: [
            AI('luxury villa private swimming pool Eilat Israel Red Sea view palm trees', 701),
            AI('villa pool terrace Eilat sunny day turquoise water outdoor lounge', 702),
            AI('luxury villa interior spacious living room Eilat modern design sea view', 703),
        ],
        maxGuests: 10, bedrooms: 5, beds: 6, bathrooms: 3,
        amenities: ['wifi', 'pool', 'parking', 'airConditioning'],
        coordinates: { lat: 29.5577, lng: 34.9519 },
    },
    {
        title: 'דירה קלאסית בנתניה',
        description: 'דירה נעימה 200 מטר מהים. מרפסת עם נוף לגינה שקטה. אזור שקט ומרכזי.',
        price: 520,
        location: { city: 'נתניה', street: 'הרצל 22' },
        images: [
            AI('classic apartment Netanya Israel balcony garden quiet neighborhood', 801),
            AI('cozy apartment bedroom Israel natural light wardrobe classic style', 802),
            AI('apartment living room balcony sea glimpse Netanya Israel afternoon light', 803),
        ],
        maxGuests: 4, bedrooms: 2, beds: 3, bathrooms: 1,
        amenities: ['wifi', 'airConditioning'],
        coordinates: { lat: 32.3226, lng: 34.8533 },
    },
    {
        title: 'בית בוטיק בצפת',
        description: 'בית עתיק ומחודש בלב הרובע האמנותי של צפת. אווירה מיסטית ובלתי נשכחת.',
        price: 650,
        location: { city: 'צפת', street: 'אלכסנדר זייד 4' },
        images: [
            AI('ancient boutique house Safed Tzfat Israel artists quarter mystical stone', 901),
            AI('renovated old stone house interior Safed Israel artistic warm lighting', 902),
            AI('stone alley Safed Israel old city boutique house arched door blue', 903),
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
            AI('clean modern studio apartment Beer Sheva Israel university area', 1001),
            AI('functional studio bedroom desk workspace Israel minimalist', 1002),
            AI('compact apartment living area Israel city modern practical', 1003),
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
