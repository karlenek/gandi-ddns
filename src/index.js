const axios = require('axios');

const sonicwall = require('./sources/sonicwall');
const public = require('./sources/public');

const config = require('./config');
const log = require('./logger');

const gandi = require('./gandi');


async function updateZones() {
  let count = 0;
  let updatedCount = 0;
  let failedCount = 0;

  // We execute the zones one by one to avoid duplicate requests for getting
  // public ips, records etc. It also makes the log easier to understand
  for (const zone of config.zones) {
    count++;
    const { source, interface, ttl } = zone;
    const domain = zone.domain.split('.').slice(-2).join('.');
    const subDomain = zone.domain.split('.').slice(0, -2).join('.') || '@';

    log.info(`[${zone.domain}]: Processing zone`);

    try {
      if (!source) {
        throw new Error(`[${zone.domain}]: No source for zone`);
      }
  
      let newIp;
  
      if (source === 'public') {
        newIp = await public.getIp();
      } else if (source === 'sonicwall') {
        newIp = await sonicwall.getIp(interface);
      } else {
        throw new Error(`Source not supported: ${source}`);
      }
  
      const currentIp = await gandi.getRecord(domain, subDomain);
  
      if (currentIp === newIp) {
        log.info(`[${zone.domain}]: Ip has not changed, no action required`);
        continue;
      } else {
        log.info(`[${zone.domain}]: Ip has changed, old value: ${currentIp}`);

        await gandi.setRecord(domain, subDomain, newIp, ttl);
  
        updatedCount++;
        log.info(`[${zone.domain}]: Updated record to new ip: ${newIp}`);
      }

    } catch (err) {
      // Filter out secrets, we should move this to the logger and make it more generic
      if (err && err.config && err.config) {
        if (err.config.headers && err.config.headers['X-Api-Key']) {
          err.config.headers['X-Api-Key'] = '[REDACTED]';
        }
        if (err.config.auth && err.config.auth.password) {
          err.config.auth.password = '[REDACTED]';
        }
      }
      log.error(err);
      log.error(`[${zone.domain}]: Failed to update`);
      failedCount++;
      continue;
    }
  }

  return {
    count,
    failed: failedCount,
    updated: updatedCount,
  }
}

let firstRun = true;

function scheduleJob() {
  setTimeout(async () => {
    firstRun = false;

    try {
      log.info('Starting zone check');

      const { count, failed, updated } = await updateZones();

      log.info(`Zone check completed, next check in ${config.interval} minutes`);
      log.info(`Processed: ${count}, updated: ${updated}, failed: ${failed}`)

      scheduleJob();
    } catch (err) {
      log.error(err);
    }
  }, firstRun ? 1 : (config.interval * 60 * 1000));
}


scheduleJob();
