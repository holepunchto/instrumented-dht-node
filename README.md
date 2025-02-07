# Instrumented DHT Node

A simple DHT node with instrumentation, so its metrics can be scraped by Prometheus (through [DHT Prometheus](https://github.com/HDegroote/dht-prometheus)).

## Install

No install needed when running as Docker.

For CLI:

```
npm i -g instrumented-dht-node
```

## Run

### Docker

```
docker run --network=host \
--env DHT_NODE_PROMETHEUS_ALIAS=some-unique-alias \
--env DHT_NODE_PROMETHEUS_SECRET=the-prometheus-secret \
--env DHT_NODE_PROMETHEUS_SCRAPER_PUBLIC_KEY=the-prometheus-public-key \
ghcr.io/holepunchto/instrumented-dht-node
```

### CLI

```
DHT_NODE_PROMETHEUS_ALIAS=some-unique-alias DHT_NODE_PROMETHEUS_SECRET=the-prometheus-secret DHT_NODE_PROMETHEUS_SCRAPER_PUBLIC_KEY=the-prometheus-public-key dht-node
```

Pipe the result into pino-pretty to have the logs be readable from the CLI (by default they're in JSON).

## Configuration

Configuration options are set using environment variables. They include:

- `DHT_NODE_PORT`: the port the DHT should listen on (used only if free and not firewalled). Default 0 (arbitrary port)
- `DHT_NODE_HOST`: the host the DHT should listen on (defaults to the hyperdht default)
- `DHT_NODE_EPHEMERAL`: Set 'true' to explicitly mark the node as non-ephemeral
- `DHT_NODE_BOOTSTRAPS`: (advanced) The bootstrap node(s) to use, specified as a comma-separated list of `<host>:<port>`. For example: `'88.99.3.86:49737,142.93.90.113:49737,138.68.147.8:49737'`. Defaults to the hyperdht default bootstraps. Note that the connection with the metrics scraper uses a separate DHT node that always runs on the mainline DHT.
- `DHT_NODE_IS_BOOTSTRAP`: (advanced) set to 'true' to start a new bootstrap node. Requires the port and host to be set, and the port to be unfirewalled.
