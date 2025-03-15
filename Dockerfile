FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# Create notes directory
RUN mkdir -p /app/notes

ENV PORT=3000
ENV NODE_ENV=production
ENV NOTES_DIR=/app/notes

EXPOSE 3000

CMD ["node", "src/index.js"]