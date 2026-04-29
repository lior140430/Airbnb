/**
 * Seed script: creates 8 mock users in the DB and links properties to them round-robin.
 * Run from monorepo root:  node scripts/seed-users.js
 */
const { MongoClient } = require('mongodb');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI ||
    'mongodb://server:e5f5c26a7580f0bac585c1d50369c1227114184f9c92f048@localhost:21771/homeseek';

const SEED_USERS = [
    {
        firstName: 'דנה', lastName: 'כהן', email: 'dana@test.com',
        picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    },
    {
        firstName: 'יוסי', lastName: 'לוי', email: 'yossi@test.com',
        picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    },
    {
        firstName: 'מיכל', lastName: 'אברהם', email: 'michal@test.com',
        picture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    },
    {
        firstName: 'אורי', lastName: 'גולן', email: 'ori@test.com',
        picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    },
    {
        firstName: 'נועה', lastName: 'שרון', email: 'noa@test.com',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    },
    {
        firstName: 'עמית', lastName: 'דוד', email: 'amit@test.com',
        picture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
    },
    {
        firstName: 'שירה', lastName: 'פרץ', email: 'shira@test.com',
        picture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
    },
    {
        firstName: 'רון', lastName: 'ביטון', email: 'ron@test.com',
        picture: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&q=80',
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
    const usersCol = db.collection('users');
    const propertiesCol = db.collection('properties');

    // Check if seed users already exist — if yes just re-link properties
    const existing = await usersCol.findOne({ email: 'dana@test.com' });
    if (existing) {
        console.log('Seed users already exist. Re-linking properties to users...');
        const userIds = [];
        for (const u of SEED_USERS) {
            const doc = await usersCol.findOne({ email: u.email });
            if (doc) userIds.push(doc._id.toString());
        }
        await assignOwnersToProperties(propertiesCol, userIds);
        await client.close();
        return;
    }

    // Create users with password "Test1234!"
    const hashedPw = await hashPassword('Test1234!');
    const userIds = [];

    for (const u of SEED_USERS) {
        const result = await usersCol.insertOne({
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            password: hashedPw,
            picture: u.picture,
            googleId: null,
            facebookId: null,
            currentHashedRefreshToken: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        userIds.push(result.insertedId.toString());
        console.log(`✔ Created: ${u.firstName} ${u.lastName} (${u.email})`);
    }

    await assignOwnersToProperties(propertiesCol, userIds);

    console.log('\n=== Seed Complete ===');
    console.log('Password for all users: Test1234!');
    console.log('Emails:', SEED_USERS.map(u => u.email).join(', '));

    await client.close();
}

async function assignOwnersToProperties(propertiesCol, userIds) {
    const properties = await propertiesCol.find({}).toArray();
    let updated = 0;
    for (let i = 0; i < properties.length; i++) {
        const ownerId = userIds[i % userIds.length];
        await propertiesCol.updateOne(
            { _id: properties[i]._id },
            { $set: { ownerId } },
        );
        updated++;
    }
    console.log(`✔ Assigned ${updated} properties to ${userIds.length} users (round-robin)`);
}

main().catch(err => { console.error(err); process.exit(1); });
