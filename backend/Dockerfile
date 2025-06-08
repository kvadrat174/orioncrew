# Используем официальный Node.js образ
FROM node:22-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

COPY . .
RUN npm install

# Собираем TypeScript
RUN npm run build

# Указываем команду запуска
CMD ["npm", "start"]
