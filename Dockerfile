FROM node:22-alpine3.19 as builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./

# Pass the environment variable
# ARG NPM_TOKEN_SHARED_LIBRARY
# ENV NPM_TOKEN_SHARED_LIBRARY=${NPM_TOKEN_SHARED_LIBRARY}
COPY .npmrc ./
# RUN echo ".npmrc content:" && cat .npmrc

COPY src ./src
RUN npm install -g npm@latest
RUN npm ci && npm run build

FROM node:22-alpine3.19

WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
COPY tsconfig.json ./
COPY .npmrc ./
RUN npm install -g pm2 npm@latest
RUN npm ci --production
COPY --from=builder /app/build ./build

EXPOSE 4003

CMD [ "npm", "run", "start" ]
