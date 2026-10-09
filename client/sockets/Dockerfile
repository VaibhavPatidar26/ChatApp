FROM node:20-alpine

WORKDIR /app

COPY ./package-lock.json ./package-lock.json
COPY ./package.json ./package.json

RUN npm install 
COPY . . 

CMD ["npm","run","dev"]
