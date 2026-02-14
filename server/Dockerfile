FROM node:20-alpine

RUN apk add --no-cache ffmpeg python3 py3-pip aria2 \
    && wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
COPY scripts ./scripts
RUN mkdir -p downloads output logs

EXPOSE 3001
CMD ["node", "src/index.js"]
