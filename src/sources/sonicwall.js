const axios = require('axios');

const { sonicwall } = require('../config');
const log = require('../logger');
const cache = require('../cache');


class Client {
  constructor(baseUrl, auth) {
    this.baseUrl = baseUrl;

    if (auth) {
      this.auth = {
        username: auth.username,
        password: auth.password,
      }
    }
    // TEMPORARY, we need to add the firewall cert to here
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  }

  getFullUrl(path) {
    return `${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }

  async get(path, data) {
    const resp = await axios({
      method: 'GET',
      url: this.getFullUrl(path),
    });

    return resp.data;
  }

  async post(path, data) {
    const resp = await axios({
      method: 'POST',
      url: this.getFullUrl(path),
      auth: this.auth,
    });

    return resp.data;
  }
}

const client = new Client(`https://${sonicwall.host}/api/sonicos/`, {
  username: sonicwall.username,
  password: sonicwall.password,
});


async function login() {
  await client.post('/auth');
}

async function getIp(interfaceName) {
  if (!interfaceName) {
    throw new Error('Interface name is required');
  }

  const cacheKey = `sonicwall:interface:${interfaceName}`;
  let value = cache.getValue(cacheKey);

  if (!value) {
    log.debug(`[sonicwall]: Fetching ip for interface ${interfaceName.toUpperCase()}`);
    await login();
  
    const { address_objects } = await client.get('address-objects/ipv4');
  
    const { ipv4: { host: { ip } = {} } = {} } = address_objects.find(({ ipv4 }) => {
      const [name = '', type = ''] = ipv4.name.split(' ');
  
      if (name.toUpperCase() === interfaceName.toUpperCase() && type === 'IP') {
        return true;
      }
    }) || {};

    value = ip;

    cache.setValue(cacheKey, value, 5000);
  } else {
    log.debug(`[sonicwall]: Using cached ip for interface ${interfaceName.toUpperCase()}`);
  }

  return value;
}


module.exports = {
  login,
  getIp,
}