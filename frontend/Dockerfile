# Простая версия без мультистейдж билда
FROM node:22-alpine

# Установить рабочую директорию
WORKDIR /app

# Скопировать package файлы
COPY package*.json ./

# Очистить кэш npm и установить зависимости
RUN npm install

# Скопировать исходный код
COPY . .

# Создать директории с правильными правами
RUN mkdir -p dist public logs && \
    chmod -R 755 /app

# Экспортировать порт
EXPOSE 3300

# Запустить приложение
CMD ["npm", "run", "dev"]