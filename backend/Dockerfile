FROM node:22

WORKDIR /app

COPY . .
RUN npm install elysia @elysiajs/node && \
npm install --save-dev tsx @types/node typescript
RUN npm i

CMD ["sh", "entrypoint.sh"]