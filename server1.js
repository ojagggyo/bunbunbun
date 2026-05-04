import { serve } from "bun";

serve({
  port: 3000,
  fetch: async (req) => {
    const url = new URL(req.url);

console.log("url.pathname: ",url.pathname);

    // /hivemind/ に一致したときだけ処理
    if (url.pathname === "/hivemind/") {
      // Nginx と同じ固定JSONボディ
      const body = JSON.stringify({
        jsonrpc: "2.0",
        id: 0,
        method: "hive.db_head_state",
        params: {}
      });

      // backend に POST
      //const backend = await fetch("http://steememory.com:8888", {
      const backend = await fetch("https://steememory.com/hivemind/", {
      
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Host": "steememory.com",
        },
        body,
      });

      // backend のレスポンスをそのまま返す
      const data = await backend.text();
      return new Response(data, {
        status: backend.status,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // 上記以外のパス
    return new Response("Not Found", { status: 404 });
  }
});
