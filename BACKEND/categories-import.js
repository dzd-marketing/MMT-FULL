const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
});

const promisePool = pool.promise();

const PLATFORMS = {
    'tiktok': { 
        patterns: ['tiktok', 'tt', 'tik tok'], 
        icon: 'tiktok-icon.png' 
    },
    'instagram': { 
        patterns: ['instagram', 'ig', 'insta'], 
        icon: 'instagram-icon.png' 
    },
    'facebook': { 
        patterns: ['facebook', 'fb'], 
        icon: 'facebook-icon.png' 
    },
    'youtube': { 
        patterns: ['youtube', 'yt', 'youtu'], 
        icon: 'youtube-icon.png' 
    },
    'whatsapp': { 
        patterns: ['whatsapp', 'wa', 'whats app'], 
        icon: 'whatsapp-icon.png' 
    }
};

const SERVICE_TYPES = {
    'followers': { 
        patterns: ['follower', 'takipçi', 'abone'] 
    },
    'likes': { 
        patterns: ['like', 'beğeni'] 
    },
    'views': { 
        patterns: ['view', 'izlenme', 'görüntülenme'] 
    },
    'comments': { 
        patterns: ['comment', 'yorum', 'custom comments'] 
    },
    'reposts': { 
        patterns: ['repost', 'retweet', 'tekrar paylaşım'] 
    },
    'shares': { 
        patterns: ['share', 'paylaşım', 'social shares'] 
    },
    'saves': { 
        patterns: ['save', 'kaydet'] 
    },
    'subscribers': { 
        patterns: ['subscriber', 'abone'] 
    },
    'watch_hours': { 
        patterns: ['watch hour', 'watch time', 'izlenme saati', 'watchtime'] 
    },
    'reactions': { 
        patterns: ['reaction', 'tepki', '👍', '❤️', '😂', '😲', '😥', '🤗', '😡', '🔥', '🎉', '🏆'] 
    },
    'members': { 
        patterns: ['member', 'üye', 'channel member', 'group member', 'katılımcı'] 
    },
    'impressions': { 
        patterns: ['impression', 'reach', 'gösterim', 'keşfet'] 
    },
    'live_views': { 
        patterns: ['live stream', 'canlı', 'live views'] 
    },
    'poll_votes': { 
        patterns: ['poll', 'anket', 'vote'] 
    },
    'profile_visits': { 
        patterns: ['profile visit', 'profil ziyareti', 'visit'] 
    },
    'story_views': { 
        patterns: ['story view', 'hikaye', 'story'] 
    },
    'random_comments': { 
        patterns: ['random comment', 'rastgele yorum'] 
    },
    'custom_comments': { 
        patterns: ['custom comment', 'özel yorum'] 
    },
    'live_reactions': { 
        patterns: ['live reaction', 'canlı tepki'] 
    }
};

async function updateCategories() {
    console.log('🔄 Updating categories based on services...');
    
    // First, get all services
    const [services] = await promisePool.execute(
        'SELECT service_id, service_name FROM services'
    );
    
    console.log(`📊 Found ${services.length} services`);
    
    // Clear existing categories
    await promisePool.execute('DELETE FROM categories');
    
    const categorySet = new Set();
    const updates = [];

    for (const service of services) {
        const name = service.service_name.toLowerCase();
        
        // Detect platform
        let detectedPlatform = 'other';
        for (const [platform, data] of Object.entries(PLATFORMS)) {
            if (data.patterns.some(p => name.includes(p))) {
                detectedPlatform = platform;
                break;
            }
        }
        
        // Detect service type
        let detectedType = 'other';
        for (const [type, data] of Object.entries(SERVICE_TYPES)) {
            if (data.patterns.some(p => name.includes(p))) {
                detectedType = type;
                break;
            }
        }
        
        // Special cases for emoji reactions in names
        if (name.includes('👍') || name.includes('❤️') || name.includes('😂') || 
            name.includes('😲') || name.includes('😥') || name.includes('🤗') || 
            name.includes('😡')) {
            detectedType = 'reactions';
        }
        
        // Special case for WhatsApp
        if (detectedPlatform === 'whatsapp') {
            if (name.includes('member')) detectedType = 'members';
            if (name.includes('reaction') || name.includes('emoji')) detectedType = 'reactions';
        }
        
        const categoryKey = `${detectedPlatform}_${detectedType}`;
        categorySet.add(categoryKey);
        
        updates.push({
            service_id: service.service_id,
            platform: detectedPlatform,
            type: detectedType
        });
    }
    
    // Create categories table if not exists
    await promisePool.execute(`
        CREATE TABLE IF NOT EXISTS categories (
            id int(11) NOT NULL AUTO_INCREMENT,
            platform varchar(50) NOT NULL,
            name varchar(100) NOT NULL,
            slug varchar(100) NOT NULL,
            icon varchar(255) DEFAULT NULL,
            sort_order int(11) DEFAULT 0,
            is_active tinyint(1) DEFAULT 1,
            created_at timestamp NOT NULL DEFAULT current_timestamp(),
            PRIMARY KEY (id),
            KEY platform (platform),
            KEY slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    
    // Insert categories
    console.log('\n📁 Categories to be created:');
    let sortOrder = 0;
    for (const categoryKey of Array.from(categorySet).sort()) {
        const [platform, type] = categoryKey.split('_');
        const slug = `${platform}-${type}`;
        
        console.log(`   - ${platform} → ${type}`);
        
        await promisePool.execute(
            'INSERT INTO categories (platform, name, slug, sort_order) VALUES (?, ?, ?, ?)',
            [platform, type, slug, sortOrder++]
        );
    }
    
    // Add category_id column to services if not exists
    try {
        await promisePool.execute(`
            ALTER TABLE services 
            ADD COLUMN category_id int(11) DEFAULT NULL AFTER service_id,
            ADD KEY category_id (category_id)
        `);
    } catch (error) {
        console.log('ℹ️ category_id column already exists');
    }
    
    // Update services with category_id
    console.log('\n🔄 Updating services with category IDs...');
    for (const update of updates) {
        const [categoryRows] = await promisePool.execute(
            'SELECT id FROM categories WHERE platform = ? AND name = ?',
            [update.platform, update.type]
        );
        
        if (categoryRows.length > 0) {
            await promisePool.execute(
                'UPDATE services SET category_id = ? WHERE service_id = ?',
                [categoryRows[0].id, update.service_id]
            );
        }
    }
    
    console.log('✅ Categories updated successfully!');
}

updateCategories().catch(console.error);