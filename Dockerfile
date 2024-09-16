FROM node:20-slim

RUN useradd -u 9814 --create-home instrumented-dht-node

COPY package-lock.json /home/instrumented-dht-node/package-lock.json
COPY node_modules /home/instrumented-dht-node/node_modules
COPY lib /home/instrumented-dht-node/lib
COPY package.json /home/instrumented-dht-node/package.json
COPY run.js /home/instrumented-dht-node/run.js
COPY LICENSE /home/instrumented-dht-node/LICENSE
COPY NOTICE /home/instrumented-dht-node/NOTICE

USER instrumented-dht-node

WORKDIR /home/instrumented-dht-node/
ENTRYPOINT ["node", "/home/instrumented-dht-node/run.js"]
