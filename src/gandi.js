const axios = require('axios');

const config = require('./config');
const cache = require('./cache');
const log = require('./logger');

let client = null;

function createClient() {
  if (!config.gandi.apiKey) {
    throw new Error('No api key found for gandi');
  }

  client = axios.create({
    baseURL: config.gandi.host,
    headers: {
      'X-Api-Key': config.gandi.apiKey,
    },
  });

  return client;
}

const getCacheKey = (domain, subDomain) => `gandi:${subDomain}.${domain}`

async function getRecord(domain, subDomain) {
  if (!client) createClient();

  const cacheKey = getCacheKey(domain, subDomain);
  let value = cache.getValue(cacheKey);

  if (!value) {
    const { data } = await client.get(`domains/${domain}/records/${subDomain}`);

    if (!data.length) {
      throw new Error(`${subDomain}.${domain} was not found, make sure you create it first`);
    }
    const { rrset_values: [ip] } = data[0];
  
    log.debug(`[gandi]: Fetched current gandi record, current ip: ${ip}`);

    value = ip;

    cache.setValue(cacheKey, value, config.gandi.cacheTime);
  } else {
    log.debug('[gandi]: Using cached gandi record');
  }

  return value;
}

async function setRecord(domain, subDomain, newIp, ttl = 10800) {
  await client.put(`domains/${domain}/records/${subDomain}/A`, {
    'rrset_values': [newIp],
    'rrset_type': 'A',
    'rrset_ttl': ttl,
  });

  cache.clearValue(getCacheKey(domain, subDomain));

  return true;
}

module.exports = {
  getRecord,
  setRecord,
}