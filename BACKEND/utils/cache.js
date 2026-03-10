// utils/cache.js
const NodeCache = require('node-cache');

// Cache with 5 minute TTL (time to live)
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default
  checkperiod: 60 // Check for expired keys every 60 seconds
});

const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:${userId}:profile`,
  USER_WALLET: (userId) => `user:${userId}:wallet`,
  USER_DATA: (userId) => `user:${userId}:data`,
};

module.exports = { cache, CACHE_KEYS };