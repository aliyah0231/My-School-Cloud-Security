FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# DATABASE_URL sementara hanya dibutuhkan Prisma saat generate.
# Database asli tetap diberikan melalui env_file ketika container berjalan.
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

EXPOSE 4000

CMD ["npm", "start"]
