const mysql = require('mysql2');
const axios = require('axios');
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


const API_URL = 'https://makemetrend.online/api/v2';
const API_KEY = '5f8dbf1fb00b5c539ffde36d60ad49ea'; 

async function importServices() {
    console.log('🔄 Starting service import...');
    
    try {
       
        console.log('📡 Fetching services from API...');
        
        const formData = new URLSearchParams();
        formData.append('key', API_KEY);
        formData.append('action', 'services');

        const response = await axios.post(API_URL, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const services = response.data;
        console.log(`✅ Found ${services.length} services`);

        let imported = 0;
        let updated = 0;
        let skipped = 0;

       
        for (const apiService of services) {
            try {
               
                const [existing] = await promisePool.execute(
                    'SELECT service_id FROM services WHERE api_service = ? AND service_api = ?',
                    [apiService.service, 1]
                );

              
                const serviceData = {
                    service_api: 1,
                    api_service: apiService.service,
                    api_servicetype: '2',
                    api_detail: JSON.stringify({
                        min: apiService.min,
                        max: apiService.max,
                        rate: apiService.rate,
                        type: apiService.type
                    }),
                    category_id: 1,
                    service_line: 0, 
                    service_type: '2',
                    service_package: getPackageFromType(apiService.type),
                    service_name: apiService.name,
                    service_description: apiService.desc || '',
                    service_price: apiService.rate.toString(),
                    service_min: parseInt(apiService.min) || 0,
                    service_max: parseInt(apiService.max) || 0,
                    service_dripfeed: '1',
                    service_autotime: 0,
                    service_autopost: 0,
                    service_speed: '1',
                    want_username: '1',
                    service_secret: '2',
                    price_type: 'normal',
                    price_cal: null,
                    instagram_second: '2',
                    start_count: 'none',
                    instagram_private: '1',
                    name_lang: JSON.stringify({ en: apiService.name }),
                    description_lang: JSON.stringify({ en: apiService.desc || '' }),
                    time_lang: 'Not enough data',
                    time: 'Not enough data',
                    cancelbutton: '2',
                    show_refill: 'false',
                    service_profit: '', 
                    refill_days: '30',
                    refill_hours: '24',
                    avg_days: 0,
                    avg_hours: 0,
                    avg_minutes: 0,
                    avg_many: 0,
                    price_profit: 0,
                    service_overflow: 0,
                    service_sync: '1',
                    service_deleted: '0'
                };

                if (existing.length > 0) {
  
                    await promisePool.execute(
                        `UPDATE services SET 
                            service_name = ?,
                            service_description = ?,
                            service_price = ?,
                            service_min = ?,
                            service_max = ?,
                            api_detail = ?,
                            service_package = ?,
                            show_refill = ?,
                            name_lang = ?,
                            description_lang = ?
                         WHERE service_id = ?`,
                        [
                            serviceData.service_name,
                            serviceData.service_description,
                            serviceData.service_price,
                            serviceData.service_min,
                            serviceData.service_max,
                            serviceData.api_detail,
                            serviceData.service_package,
                            serviceData.show_refill,
                            serviceData.name_lang,
                            serviceData.description_lang,
                            existing[0].service_id
                        ]
                    );
                    updated++;
                    console.log(`🔄 Updated: ${apiService.name}`);
                } else {
              
                    const [lastLine] = await promisePool.execute(
                        'SELECT MAX(service_line) as max_line FROM services'
                    );
                    serviceData.service_line = (lastLine[0].max_line || 0) + 1;

            
                    await promisePool.execute(
                        `INSERT INTO services (
                            service_api, api_service, api_servicetype, api_detail,
                            category_id, service_line, service_type, service_package,
                            service_name, service_description, service_price,
                            service_min, service_max, service_dripfeed,
                            service_autotime, service_autopost, service_speed,
                            want_username, service_secret, price_type, price_cal,
                            instagram_second, start_count, instagram_private,
                            name_lang, description_lang, time_lang, time,
                            cancelbutton, show_refill, service_profit,
                            refill_days, refill_hours, avg_days, avg_hours,
                            avg_minutes, avg_many, price_profit, service_overflow,
                            service_sync, service_deleted
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            serviceData.service_api,
                            serviceData.api_service,
                            serviceData.api_servicetype,
                            serviceData.api_detail,
                            serviceData.category_id,
                            serviceData.service_line,
                            serviceData.service_type,
                            serviceData.service_package,
                            serviceData.service_name,
                            serviceData.service_description,
                            serviceData.service_price,
                            serviceData.service_min,
                            serviceData.service_max,
                            serviceData.service_dripfeed,
                            serviceData.service_autotime,
                            serviceData.service_autopost,
                            serviceData.service_speed,
                            serviceData.want_username,
                            serviceData.service_secret,
                            serviceData.price_type,
                            serviceData.price_cal,
                            serviceData.instagram_second,
                            serviceData.start_count,
                            serviceData.instagram_private,
                            serviceData.name_lang,
                            serviceData.description_lang,
                            serviceData.time_lang,
                            serviceData.time,
                            serviceData.cancelbutton,
                            serviceData.show_refill,
                            serviceData.service_profit,
                            serviceData.refill_days,
                            serviceData.refill_hours,
                            serviceData.avg_days,
                            serviceData.avg_hours,
                            serviceData.avg_minutes,
                            serviceData.avg_many,
                            serviceData.price_profit,
                            serviceData.service_overflow,
                            serviceData.service_sync,
                            serviceData.service_deleted
                        ]
                    );
                    imported++;
                    console.log(`✅ Imported: ${apiService.name}`);
                }
            } catch (error) {
                console.error(`❌ Error processing service ${apiService.service}:`, error.message);
                skipped++;
            }
        }

        console.log('\n📊 Import Summary:');
        console.log(`   Total: ${services.length}`);
        console.log(`   Imported: ${imported}`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Skipped: ${skipped}`);
        console.log('✅ Import completed!');

    } catch (error) {
        console.error('❌ Import failed:', error.message);
    } finally {
        await promisePool.end();
    }
}

function getPackageFromType(type) {
    const packageMap = {
        'Default': '1',
        'Custom Comments': '3',
        'Subscriptions': '11',
        'Package': '5',
        'Mentions': '4',
        'Mentions with Hashtags': '4',
        'Mentions Custom List': '4',
        'Poll': '6',
        'Invites': '12'
    };
    return packageMap[type] || '1';
}

importServices();
