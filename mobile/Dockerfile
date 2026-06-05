FROM node:22-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Metro bundler + Expo dev server ports
EXPOSE 8081 19000 19001 19002

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

CMD ["npx", "expo", "start", "--port", "8081", "--host", "lan", "--no-dev-client"]
