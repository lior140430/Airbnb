FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY apps/property-service/package*.json ./apps/property-service/

RUN npm install

COPY . .

RUN mkdir -p apps/property-service/uploads/properties

CMD ["npm", "run", "start:dev", "-w", "apps/property-service"]
