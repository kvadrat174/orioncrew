FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install elysia @elysiajs/node && \
    npm install --save-dev tsx @types/node typescript

CMD ["npm", "run", "dev"]