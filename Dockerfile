FROM node:latest

COPY . /src
WORKDIR /src

ENV PORT=3000
EXPOSE $PORT

RUN npm install
CMD node server.js