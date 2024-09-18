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

  promRpcClient.registerLogger(logger)

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

module.exports = instrument
