const axios = require('axios');

const cache = require('../cache');
const log = require('../logger');

const { public } = require('../config');

async function getIp() {
  const cacheKey = `public:ip`;
  let value = cache.getValue(cacheKey)

  if (!value) {
    const { data } = await axios.get(public.host);

    if (typeof data !== 'string') {
      throw new Error('Public ip endpoint returned an unsupported response: must be a string');
    }
    
    if (data.split('.').length > 4) {
      throw new Error('Public ip endpoint returned an unsupported response: must be an ip address');
    }

    value = data;
    log.debug(`[public]: Fetched public ip: ${data}`);

    // We cache the ip in 10 seconds, while we update other zones
    cache.setValue(cacheKey, value, 10000);
  } else {
    log.debug(`[public]: Using cached public ip: ${value}`);
  }

  return value;
}


module.exports = {
  getIp,
}