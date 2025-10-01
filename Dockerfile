FROM node:20.19-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY . .
RUN npm run build
FROM nginx:stable
COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/Rashaka/browser/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
