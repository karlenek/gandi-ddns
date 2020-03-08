const fs = require('fs');

const cacheLocation = 'cache'

class Cache {
  constructor(cacheValidTime) {
    this.cacheValidTime = cacheValidTime;

    if (!fs.existsSync(cacheLocation)) {
      fs.writeFileSync(cacheLocation, JSON.stringify({}));
    }

    this.keys = JSON.parse(fs.readFileSync(cacheLocation));
  }

  saveCache() {
    fs.writeFileSync(cacheLocation, JSON.stringify(this.keys));
  }

  clear() {
    this.keys = {};
    this.saveCache();
  }

  setValue(key, value, expiresIn = 100) {
    this.keys[key] = {
      value,
      ttl: Date.now() + expiresIn,
    };

    this.saveCache();
  }

  getValue(key) {
    const { value, ttl } = this.keys[key] || {};

    if (!ttl || ttl < Date.now()) {
      return undefined;
    }

    return value;
  }

  hasValue(key) {
    return !!this.getValue(key)
  }

  clearValue(key) {
    delete this.keys[key];
    this.saveCache();
  }
}

const cache = new Cache();

module.exports = cache;
