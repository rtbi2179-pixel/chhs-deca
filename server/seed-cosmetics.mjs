import { drizzle } from 'drizzle-orm/mysql2';
import { cosmetics } from '../drizzle/schema.ts';
import mysql from 'mysql2/promise';

import { config } from 'dotenv';
config();

const DATABASE_URL = process.env.DATABASE_URL;

async function seedCosmetics() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const defaultCosmetics = [
    // Profile Frames - Common
    { name: 'Silver Frame', type: 'profile_frame', rarity: 'common', cost: 100, imageUrl: 'https://via.placeholder.com/200?text=Silver+Frame', schoolCode: 'CHHS' },
    { name: 'Bronze Frame', type: 'profile_frame', rarity: 'common', cost: 100, imageUrl: 'https://via.placeholder.com/200?text=Bronze+Frame', schoolCode: 'CHHS' },
    
    // Profile Frames - Rare
    { name: 'Gold Frame', type: 'profile_frame', rarity: 'rare', cost: 250, imageUrl: 'https://via.placeholder.com/200?text=Gold+Frame', schoolCode: 'CHHS' },
    { name: 'Crystal Frame', type: 'profile_frame', rarity: 'rare', cost: 250, imageUrl: 'https://via.placeholder.com/200?text=Crystal+Frame', schoolCode: 'CHHS' },
    
    // Profile Frames - Epic
    { name: 'Diamond Frame', type: 'profile_frame', rarity: 'epic', cost: 500, imageUrl: 'https://via.placeholder.com/200?text=Diamond+Frame', schoolCode: 'CHHS' },
    { name: 'Platinum Frame', type: 'profile_frame', rarity: 'epic', cost: 500, imageUrl: 'https://via.placeholder.com/200?text=Platinum+Frame', schoolCode: 'CHHS' },
    
    // Profile Frames - Legendary
    { name: 'Cosmic Frame', type: 'profile_frame', rarity: 'legendary', cost: 1000, imageUrl: 'https://via.placeholder.com/200?text=Cosmic+Frame', schoolCode: 'CHHS' },
    { name: 'Aurora Frame', type: 'profile_frame', rarity: 'legendary', cost: 1000, imageUrl: 'https://via.placeholder.com/200?text=Aurora+Frame', schoolCode: 'CHHS' },
    
    // Banners - Common
    { name: 'Simple Banner', type: 'banner', rarity: 'common', cost: 100, imageUrl: 'https://via.placeholder.com/400x100?text=Simple+Banner', schoolCode: 'CHHS' },
    { name: 'Blue Banner', type: 'banner', rarity: 'common', cost: 100, imageUrl: 'https://via.placeholder.com/400x100?text=Blue+Banner', schoolCode: 'CHHS' },
    
    // Banners - Rare
    { name: 'Gradient Banner', type: 'banner', rarity: 'rare', cost: 250, imageUrl: 'https://via.placeholder.com/400x100?text=Gradient+Banner', schoolCode: 'CHHS' },
    { name: 'Neon Banner', type: 'banner', rarity: 'rare', cost: 250, imageUrl: 'https://via.placeholder.com/400x100?text=Neon+Banner', schoolCode: 'CHHS' },
    
    // Banners - Epic
    { name: 'Galaxy Banner', type: 'banner', rarity: 'epic', cost: 500, imageUrl: 'https://via.placeholder.com/400x100?text=Galaxy+Banner', schoolCode: 'CHHS' },
    { name: 'Fire Banner', type: 'banner', rarity: 'epic', cost: 500, imageUrl: 'https://via.placeholder.com/400x100?text=Fire+Banner', schoolCode: 'CHHS' },
    
    // Banners - Legendary
    { name: 'Infinity Banner', type: 'banner', rarity: 'legendary', cost: 1000, imageUrl: 'https://via.placeholder.com/400x100?text=Infinity+Banner', schoolCode: 'CHHS' },
    { name: 'Celestial Banner', type: 'banner', rarity: 'legendary', cost: 1000, imageUrl: 'https://via.placeholder.com/400x100?text=Celestial+Banner', schoolCode: 'CHHS' },
    
    // Avatar Effects - Common
    { name: 'Sparkle Effect', type: 'avatar_effect', rarity: 'common', cost: 100, imageUrl: 'https://via.placeholder.com/100?text=Sparkle', schoolCode: 'CHHS' },
    { name: 'Glow Effect', type: 'avatar_effect', rarity: 'common', cost: 100, imageUrl: 'https://via.placeholder.com/100?text=Glow', schoolCode: 'CHHS' },
    
    // Avatar Effects - Rare
    { name: 'Rainbow Effect', type: 'avatar_effect', rarity: 'rare', cost: 250, imageUrl: 'https://via.placeholder.com/100?text=Rainbow', schoolCode: 'CHHS' },
    { name: 'Flame Effect', type: 'avatar_effect', rarity: 'rare', cost: 250, imageUrl: 'https://via.placeholder.com/100?text=Flame', schoolCode: 'CHHS' },
    
    // Avatar Effects - Epic
    { name: 'Lightning Effect', type: 'avatar_effect', rarity: 'epic', cost: 500, imageUrl: 'https://via.placeholder.com/100?text=Lightning', schoolCode: 'CHHS' },
    { name: 'Ice Effect', type: 'avatar_effect', rarity: 'epic', cost: 500, imageUrl: 'https://via.placeholder.com/100?text=Ice', schoolCode: 'CHHS' },
    
    // Avatar Effects - Legendary
    { name: 'Cosmic Effect', type: 'avatar_effect', rarity: 'legendary', cost: 1000, imageUrl: 'https://via.placeholder.com/100?text=Cosmic', schoolCode: 'CHHS' },
    { name: 'Void Effect', type: 'avatar_effect', rarity: 'legendary', cost: 1000, imageUrl: 'https://via.placeholder.com/100?text=Void', schoolCode: 'CHHS' },
    
    // Titles - Common
    { name: 'Novice', type: 'title', rarity: 'common', cost: 100, imageUrl: null, schoolCode: 'CHHS' },
    { name: 'Learner', type: 'title', rarity: 'common', cost: 100, imageUrl: null, schoolCode: 'CHHS' },
    
    // Titles - Rare
    { name: 'Scholar', type: 'title', rarity: 'rare', cost: 250, imageUrl: null, schoolCode: 'CHHS' },
    { name: 'Expert', type: 'title', rarity: 'rare', cost: 250, imageUrl: null, schoolCode: 'CHHS' },
    
    // Titles - Epic
    { name: 'Master', type: 'title', rarity: 'epic', cost: 500, imageUrl: null, schoolCode: 'CHHS' },
    { name: 'Legend', type: 'title', rarity: 'epic', cost: 500, imageUrl: null, schoolCode: 'CHHS' },
    
    // Titles - Legendary
    { name: 'Mythic', type: 'title', rarity: 'legendary', cost: 1000, imageUrl: null, schoolCode: 'CHHS' },
    { name: 'Eternal', type: 'title', rarity: 'legendary', cost: 1000, imageUrl: null, schoolCode: 'CHHS' },
  ];

  try {
    console.log('Seeding cosmetics...');
    
    // Check if cosmetics already exist
    const existing = await db.select().from(cosmetics).limit(1);
    if (existing.length > 0) {
      console.log('Cosmetics already seeded, skipping...');
      await connection.end();
      return;
    }

    await db.insert(cosmetics).values(defaultCosmetics);
    console.log(`✅ Seeded ${defaultCosmetics.length} cosmetics`);
  } catch (error) {
    console.error('❌ Error seeding cosmetics:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedCosmetics();
