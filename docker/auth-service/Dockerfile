FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY apps/auth-service/package*.json ./apps/auth-service/

RUN npm install

COPY . .

CMD ["npm", "run", "start:dev", "-w", "apps/auth-service"]
