FROM node:18-alpine AS build

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

RUN yarn format

RUN yarn build

# Stage 2: Serve
FROM node:18-alpine AS production

# Install serve
RUN yarn global add serve

WORKDIR /app

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
