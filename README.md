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

Optionally set the `DHT_NODE_PORT` env var for the DHT to listen on, if that port is unfirewalled.

### CLI

```
DHT_NODE_PROMETHEUS_ALIAS=some-unique-alias DHT_NODE_PROMETHEUS_SECRET=the-prometheus-secret DHT_NODE_PROMETHEUS_SCRAPER_PUBLIC_KEY=the-prometheus-public-key dht-node
```

Optionally include a `DHT_NODE_PORT` for the DHT to listen on, if that port is unfirewalled.

Pipe the result into pino-pretty to have the logs be readable from the CLI (by default they're in JSON).
