FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /etc/nginx/certs

COPY certs/localhost.crt /etc/nginx/certs/localhost.crt
COPY certs/localhost.key /etc/nginx/certs/localhost.key

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]