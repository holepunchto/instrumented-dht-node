const idEnc = require('hypercore-id-encoding')
const DhtPromClient = require('dht-prom-client')
const HyperdhtStats = require('hyperdht-stats')
const HyperDht = require('hyperdht')

const { version: PACKAGE_VERSION } = require('../package.json')

function instrument (logger, dht, {
  promClient,
  prometheusScraperPublicKey,
  prometheusAlias,
  prometheusSecret,
  prometheusServiceName
}) {
  promClient.collectDefaultMetrics()

  const dhtStats = new HyperdhtStats(dht)
  dhtStats.registerPrometheusMetrics(promClient)

  registerPackageVersion(promClient)

  const promDht = new HyperDht()
  const promRpcClient = new DhtPromClient(
    promDht,
    promClient,
    prometheusScraperPublicKey,
    prometheusAlias,
    prometheusSecret,
    prometheusServiceName
  )

  setupPromRpcClientLogging(promRpcClient, logger)

  return promRpcClient
}

function registerPackageVersion (promClient) {
  // Gauges expect a number, so we set the version as label instead
  return new promClient.Gauge({
    name: 'package_version',
    help: 'Package version in config.json',
    labelNames: ['version'],
    collect () {
      this.labels(
        PACKAGE_VERSION
      ).set(1)
    }
  })
}

function setupPromRpcClientLogging (client, logger) {
  client.on('register-alias-success', ({ updated }) => {
    logger.info(`Prom client successfully registered alias ${client.alias} (updated: ${updated})`)
  })
  client.on('register-alias-error', (error) => {
    logger.info(`Prom client failed to register alias ${error.stack}`)
  })

  client.on('connection-open', ({ uid, remotePublicKey }) => {
    logger.info(`Prom client opened connection to ${idEnc.normalize(remotePublicKey)} (uid: ${uid})`)
  })
  client.on('connection-close', ({ uid, remotePublicKey }) => {
    logger.info(`Prom client closed connection to ${idEnc.normalize(remotePublicKey)} (uid: ${uid})`)
  })
  client.on('connection-error', ({ error, uid, remotePublicKey }) => {
    logger.info(`Prom client error on connection to ${idEnc.normalize(remotePublicKey)}: ${error.stack} (uid: ${uid})`)
  })

  client.on('metrics-request', ({ uid, remotePublicKey }) => {
    logger.debug(`Prom client received metrics request from ${idEnc.normalize(remotePublicKey)} (uid: ${uid})`)
  })
  client.on('metrics-error', ({ uid, error }) => {
    logger.info(`Prom client failed to process metrics request: ${error} (uid: ${uid})`)
  })
  client.on('metrics-success', ({ uid }) => {
    logger.debug(`Prom client successfully processed metrics request (uid: ${uid})`)
  })
}

module.exports = instrument
