FROM node:22 AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:22-slim
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3300
CMD ["npm", "run", "preview"]  # или "start", если это SSR
