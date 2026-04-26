/**
 * Seed script: creates mock users in auth DB and links them to existing properties.
 * Run from monorepo root:  node scripts/seed-users.js
 */
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

const MONGO_URI = 'mongodb://localhost:27017/homeseek';

const SEED_USERS = [
    { firstName: 'דנה', lastName: 'כהן', email: 'dana@test.com' },
    { firstName: 'יוסי', lastName: 'לוי', email: 'yossi@test.com' },
    { firstName: 'מיכל', lastName: 'אברהם', email: 'michal@test.com' },
    { firstName: 'אורי', lastName: 'גולן', email: 'ori@test.com' },
    { firstName: 'נועה', lastName: 'שרון', email: 'noa@test.com' },
    { firstName: 'עמית', lastName: 'דוד', email: 'amit@test.com' },
    { firstName: 'שירה', lastName: 'פרץ', email: 'shira@test.com' },
    { firstName: 'רון', lastName: 'ביטון', email: 'ron@test.com' },
];

// Simple bcrypt-compatible hash using the built-in bcrypt from the project
async function hashPassword(password) {
    // We'll use a simple approach - create the hash via the app's bcrypt
    const bcrypt = require(require('path').join(__dirname, '..', 'node_modules', 'bcrypt'));
    return bcrypt.hash(password, 10);
}

async function main() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('homeseek');
    const usersCol = db.collection('users');
    const propertiesCol = db.collection('properties');

    // Check if seed users already exist
    const existing = await usersCol.findOne({ email: 'dana@test.com' });
    if (existing) {
        console.log('Seed users already exist. Updating property owners...');
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
            ...u,
            password: hashedPw,
            picture: null,
            googleId: null,
            facebookId: null,
            currentHashedRefreshToken: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        userIds.push(result.insertedId.toString());
        console.log(`Created user: ${u.firstName} ${u.lastName} (${u.email})`);
    }

    await assignOwnersToProperties(propertiesCol, userIds);

    console.log('\n=== Seed Complete ===');
    console.log('All users have password: Test1234!');
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

    console.log(`Assigned ${updated} properties to ${userIds.length} users`);
}

main().catch(console.error);
