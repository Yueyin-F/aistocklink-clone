# AI StockLink 复现项目 Docker 部署（备选方案）
# 构建：docker build -t aistocklink .
# 运行：docker run -d --name aistock -p 4173:4173 --restart=always aistocklink

FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install --registry=https://registry.npmmirror.com --ignore-scripts
COPY . .
RUN npm run build:rollup

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/serve.mjs ./serve.mjs
COPY --from=build /app/package.json ./package.json
EXPOSE 4173
CMD ["node", "serve.mjs", "4173"]
