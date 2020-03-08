const { existsSync } = require('fs');
const { join } = require('path');
const convict = require('convict');

convict.addFormat({
  name: 'zone-array',
  validate: function(zones, schema) {
    if (!Array.isArray(zones)) {
      throw new Error('must be of type Array');
    }

    for (source of zones) {
      convict(schema.children).load(source).validate();
    }
  }
});

const config = convict({
  interval: {
    format: 'Number',
    default: 15, // in minutes
  },
  gandi: {
    host: {
      format: 'url',
      default: 'https://dns.api.gandi.net/api/v5/',
    },
    apiKey: {
      format: 'String',
      env: 'GANDI_KEY',
      default: '',
      sensitive: true,
    },
    cacheTime: {
      format: 'Number',
      default: (1000 * 60 * 60) // We cache gandi records in one hour
    }
  },
  logging: {
    level: {
      format: 'String',
      default: 'info',
      env: 'LOG_LEVEL',
    },
  },
  zones: {
    format: 'zone-array',
    default: [],
    children: {
      domain: {
        format: 'String',
        default: '',
      },
      source: {
        format: ['public', 'sonicwall'],
        default: 'public',
      },
      interface: {
        format: 'String',
        default: '',
      }
    },
  },
  public: {
    host: {
      format: 'url',
      default: 'https://api.ipify.org',
    },
  },
  sonicwall: {
    host: {
      format: 'ipaddress',
      default: '0.0.0.0',
    },
    username: {
      format: 'String',
      default: '',
    },
    password: {
      format: 'String',
      default: '',
      sensitive: true,
    },
  },
});

const configPath = join(__dirname, '../config.json');

if (existsSync(configPath)) {
  try {
    config.loadFile(configPath);
  } catch (err) {
    console.error(err);
    console.log('Failed to load config, additional information above.');
    process.exit(1);
  }

} else {
  console.error('No configuration found, will exit now');
  process.exit(1);
}

config.validate();

module.exports = config.getProperties();
