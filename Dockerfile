FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY . .
RUN node build.js

EXPOSE 80

CMD ["node", "server.js"]
