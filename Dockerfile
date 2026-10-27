FROM node:22-slim
WORKDIR /app
COPY . .
ENV NODE_ENV=production TRUST_PROXY=1 COOKIE_SECURE=1
EXPOSE 3000
CMD ["node","--no-warnings","server.js"]
