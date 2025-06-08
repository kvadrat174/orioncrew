FROM node:22-slim

# Создаем и переключаемся на непривилегированного пользователя
WORKDIR /app
RUN chown -R node:node /app
USER node

# Копируем package.json отдельно для лучшего кэширования
COPY --chown=node:node package*.json ./

# Устанавливаем зависимости с чистым кэшем
RUN npm install --cache /tmp/empty-cache && \
    npm cache clean --force

# Копируем остальные файлы
COPY --chown=node:node . .

EXPOSE 3000
CMD ["npm", "run", "dev"]