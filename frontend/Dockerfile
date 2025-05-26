# Этап сборки
FROM node:20-alpine AS build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package.json package-lock.json ./

# Устанавливаем зависимости, включая Babylon.js
RUN npm install
RUN npm install @babylonjs/core @babylonjs/loaders

# Копируем остальной код фронтенда
COPY . .

# Собираем React-приложение
RUN npm run build

# Этап продакшена
FROM node:20-alpine

# Устанавливаем serve для обслуживания статических файлов
RUN npm install -g serve

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем собранные файлы из предыдущего этапа
COPY --from=build /app/build ./build

# Открываем порт, на котором работает фронтенд
EXPOSE 3003

# Запускаем приложение
CMD ["serve", "-s", "build", "-l", "3003"]