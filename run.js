const os = require('os')
const promClient = require('prom-client')
const idEnc = require('hypercore-id-encoding')
const pino = require('pino')
const HyperDHT = require('hyperdht')
const goodbye = require('graceful-goodbye')

const instrument = require('./lib/instrument')

function loadConfig () {
  const config = {
    logLevel: process.env.DHT_NODE_LOG_LEVEL || 'info',
    port: parseInt(process.env.DHT_NODE_PORT || 0)
  }

  config.prometheusServiceName = 'dht-node'
  config.prometheusAlias = process.env.DHT_NODE_PROMETHEUS_ALIAS || `dht-node-${os.hostname()}`.replace(' ', '-')
  try {
    config.prometheusSecret = idEnc.decode(process.env.DHT_NODE_PROMETHEUS_SECRET)
    config.prometheusScraperPublicKey = idEnc.decode(process.env.DHT_NODE_PROMETHEUS_SCRAPER_PUBLIC_KEY)
  } catch (error) {
    console.error(error)
    console.error('DHT_NODE_PROMETHEUS_SECRET and DHT_NODE_PROMETHEUS_SCRAPER_PUBLIC_KEY must be set to valid keys')
    process.exit(1)
  }

  return config
}

async function main () {
  const config = loadConfig()

  const { logLevel, port } = config
  const {
    prometheusScraperPublicKey,
    prometheusAlias,
    prometheusSecret,
    prometheusServiceName
  } = config

  const logger = pino({ level: logLevel })

  const dht = new HyperDHT({ port })

  const promRpcClient = instrument(logger, dht, {
    promClient,
    prometheusScraperPublicKey,
    prometheusAlias,
    prometheusSecret,
    prometheusServiceName
  })

  goodbye(async () => {
    try {
      logger.info('Shutting down')
      await promRpcClient.close()
      logger.info('Prom-rpc client shut down')
      await dht.destroy()
      logger.info('DHT shut down')
    } catch (e) {
      logger.error(`Error while shutting down ${e.stack}`)
    }

    logger.info('Fully shut down')
  })

  await promRpcClient.ready()
  await dht.ready()

  logger.info(`Instrumented dht node listening at ${dht.host}:${dht.port} (firewalled: ${dht.firewalled})`)
  logger.info(`Public key: ${idEnc.normalize(dht.defaultKeyPair.publicKey)}`)
}

main()
