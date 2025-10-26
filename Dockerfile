# ベースイメージ
FROM oven/bun:latest

# プロジェクトルートを変更する（任意）
WORKDIR /app

# ファイルをコピーする
COPY package.json .
COPY index.ts .
COPY index.html .
COPY storage.html .
COPY ./certs/ ./certs/

RUN apt-get update -y
RUN apt-get upgrade -y
RUN bun install
#RUN bun index.ts

# コンテナが終了しないようにする
CMD ["bun", "index.ts"]
#CMD ["tail", "-f", "/dev/null"]
