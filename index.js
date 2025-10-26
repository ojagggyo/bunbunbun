// サーバーを起動する
Bun.serve({
  fetch(req) {
    // リクエストが来たらログを出力
    console.log('request!')

    // Bunというレスポンスを返す
    return new Response("Bun");
  },
});

