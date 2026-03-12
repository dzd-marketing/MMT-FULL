const NodeCache = require('node-cache');

const cache = new NodeCache({ 
  stdTTL: 300, 
  checkperiod: 60 
});

const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:${userId}:profile`,
  USER_WALLET: (userId) => `user:${userId}:wallet`,
  USER_DATA: (userId) => `user:${userId}:data`,
};

module.exports = { cache, CACHE_KEYS };
