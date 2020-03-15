const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

const { sonicwall } = require('../config');
const log = require('../logger');
const cache = require('../cache');


class Client {
  constructor(baseUrl, auth, caPath) {
    this.baseUrl = baseUrl;

    if (auth) {
      this.auth = {
        username: auth.username,
        password: auth.password,
      }
    }

    if (caPath) {
      let relPath = caPath;

      if (!relPath.match(/^\//)) {
        relPath = path.join(__dirname, '../../', caPath);
      }

      const cert = fs.readFileSync(relPath);
      this.httpsAgent = new https.Agent({ ca: cert, keepAlive: false });
    }
  }

  getFullUrl(path) {
    return `${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }

  async get(path, data) {
    const resp = await axios({
      method: 'GET',
      url: this.getFullUrl(path),
      httpsAgent: this.httpsAgent ? this.httpsAgent : undefined,
    });

    return resp.data;
  }

  async post(path, data) {
    const resp = await axios({
      method: 'POST',
      url: this.getFullUrl(path),
      httpsAgent: this.httpsAgent ? this.httpsAgent : undefined,
      auth: this.auth,
    });

    return resp.data;
  }
}

const client = new Client(`https://${sonicwall.host}/api/sonicos/`, {
  username: sonicwall.username,
  password: sonicwall.password,
}, sonicwall.ca);


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