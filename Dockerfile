# ---- Base image ----
FROM hmctspublic.azurecr.io/base/node:14-alpine as base
RUN yarn config set proxy "$http_proxy" && yarn config set https-proxy "$https_proxy"
COPY --chown=hmcts:hmcts package.json yarn.lock ./
RUN yarn install --production \
  && yarn cache clean

# ---- Build image ----
FROM base as build
RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true yarn install
COPY --chown=hmcts:hmcts tsconfig.json $WORKDIR/gulpfile.js server.js ./
COPY --chown=hmcts:hmcts src/main ./src/main
RUN yarn setup

# ---- Runtime image ----
FROM base as runtime
COPY --from=build $WORKDIR/src/main ./src/main
COPY --from=build $WORKDIR/server.js $WORKDIR/tsconfig.json ./
COPY config ./config
# TODO: expose the right port for your application
EXPOSE 3100
