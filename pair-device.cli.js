#!/usr/bin/env node
/**
 * This is a CLI script designed to pair a sonoff device to a server.
 * Run it only after editing the needed variables in .env, and only once the device is in AP mode (long press)
 */
const rp = require('request-promise-native');
const WiFiControl = require('wifi-control');
const logger = require('winston');
const yargs = require('yargs');
const dotenv = require('dotenv');
dotenv.config();

const SONOFF_URL = 'http://10.10.7.1';
const SONOFF_SSID_PREFIX = 'ITEAD-10';
const SONOFF_WIFI_PASSWORD = '12345678';

// Get wifi configuration from command line
const argv = yargs
  .usage('Usage: node $0 --ssid WIFI_SSID --password WIFI_PASSWORD')
  .demandOption(['ssid', 'password'])
  .argv;

const wifiSSID = argv.ssid;
const wifiPassword = argv.password;

/**
 * Called after we have connected to the device's AP.
 * Gets device info (device id and api key).
 * Used mainly for testing the device is responsive
 *
 * @return {Promise} - Resolves to { deviceid: string, apikey: string }
 */
function getDeviceInfo() {
  return rp.get(`${SONOFF_URL}/device`, { json: true })
    // get only the relevant keys
    .then(({ deviceid, apikey }) => ({ deviceid, apikey }));
}

/**
 * Send configuration to the connected sonoff device:
 * - Server credentials (the server it should connect to)
 * - WiFi credentials (the wifi it should connect to)
 * @return {Promise} - resolves to the device's response
 */
function setDeviceConf() {
  return rp.post('http://10.10.7.1/ap', {
    json: {
      version: 4,
      ssid: wifiSSID,
      password: wifiPassword,
      serverName: process.env.SERVER_IP,
      port: process.env.SERVER_API_PORT,
    },
  });
}

/**
 * Called when the device's access point is found.
 * Connects to the AP, then gets the device info,
 * and configures it so it would be paired with the server and wifi.
 * @param {object} ssid - Device network SSID to connect to.
 */
function onDeviceNetworkFound(ssid) {
  logger.info('Found device AP. Connecting...');

  WiFiControl.connectToAP({ ssid: ssid, password: SONOFF_WIFI_PASSWORD}, function (err, response) {
    if (err) {
      throw err;
    }
    logger.info('Connected to device access point.', response);

    getDeviceInfo() // this step is only to make sure the device is responding
      .then((deviceInfo) => {
        logger.info('Got device info: ', JSON.stringify(deviceInfo));
        return setDeviceConf();
      })
      .then((resp) => {
        logger.info('successfully configured device. Response:', JSON.stringify(resp));
      })
      .catch((err) => {
        logger.error('Unable to configure device', err);
      })
  });
}

//  Initialize wifi-control package
WiFiControl.init();

/**
 * Main function
 *
 * Poll the wireless networks list and try to find the device AP.
 * Retry every 1 second.
 *
 * When found, start the pairing process.
 * @type {number}
 */
const intervalId = setInterval(() => {
  const result = WiFiControl.scanForWiFi((err, response) => {
    if (err) {
      clearInterval(intervalId); // stop polling
      throw err;
    }
    // Find the device's Access Point by matching it to the "ITEAD" prefix
    const ap = response.networks.find(networkInfo => networkInfo.ssid.startsWith(SONOFF_SSID_PREFIX));

    if (!ap) {
      logger.warn('Device AP not found yet. Make sure it is in pairing mode. Retrying in 1 second...');
    } else {
      clearInterval(intervalId); // stop polling
      onDeviceNetworkFound(ap.ssid);
    }
  });

  if (!result.success) { // Scan error. stop polling
    clearInterval(intervalId);
  }
}, 1000);
