const os = require('os')
const fs = require('fs')
const path = require('path')
const promClient = require('prom-client')
const idEnc = require('hypercore-id-encoding')
const pino = require('pino')
const HyperDHT = require('hyperdht')
const goodbye = require('graceful-goodbye')

const instrument = require('./lib/instrument')

function loadConfig () {
  const config = {
    logLevel: process.env.DHT_NODE_LOG_LEVEL || 'info',
    port: parseInt(process.env.DHT_NODE_PORT || 0),
    huntSlabs: process.env.DHT_NODE_HUNT_SLABS === 'true',
    supportHeapdumps: process.env.DHT_NODE_SUPPORT_HEAPDUMPS === 'true'
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

  const { logLevel, port, huntSlabs, supportHeapdumps } = config
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

  if (supportHeapdumps) {
    logger.warn('Enabling heap dumps (send a SIGUSR2 signal to trigger)')
    process.on('SIGUSR2', function () {
      writeHeapSnapshot(logger)
    })
  }
  if (huntSlabs) {
    logger.info('Posting slab-leak info every 15 minutes')
    const setupSlabHunter = require('slab-hunter')
    const getLeakStats = setupSlabHunter()
    setInterval(() => {
      logger.info(getLeakStats())
    }, 1000 * 60 * 15)
  }

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

function writeHeapSnapshot (logger) {
  const heapdump = require('heapdump')

  const dir = '/tmp/heapdumps'
  // recursive: true is an easy way to avoid errors when the dir already exists
  fs.mkdirSync(dir, { recursive: true })

  const currentTime = (new Date()).toISOString()
  const loc = path.join(dir, `dht-node-${currentTime}.heapsnapshot`)
  logger.warn(`Writing heap snapshot to ${loc}`)

  heapdump.writeSnapshot(loc, (err, resLoc) => {
    if (err) {
      logger.error(`Error while writing heap snapshot: ${err}`)
      return
    }
    logger.info(`Finished writing heap snapshot to ${resLoc}`)
  })
}

main()
