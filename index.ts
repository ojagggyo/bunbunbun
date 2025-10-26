import { readFileSync, existsSync } from "fs";
import { randomBytes, createHash } from "crypto";
import * as secp from "@noble/secp256k1";
import bs58 from "bs58";

// nonce 保存用
const nonces = new Map<string, string>();

// RIPEMD160 ハッシュ
function ripemd160(data: Uint8Array): Uint8Array {
  return new Uint8Array(createHash("ripemd160").update(data).digest());
}

// 公開鍵 → Steem形式
function pubkeyToSteem(pubkey: Uint8Array): string {
  const checksum = ripemd160(pubkey).slice(0, 4);
  const full = new Uint8Array(pubkey.length + 4);
  full.set(pubkey, 0);
  full.set(checksum, pubkey.length);
  return "STM" + bs58.encode(full);
}

// メッセージ署名検証
function test(message: string, signature: string): boolean {
  try {
    const digest = Bun.SHA256.hash(new TextEncoder().encode(message));
    const sigBytes = Buffer.from(signature, "hex");
    if (sigBytes.length < 65) return false;

    const recovery = ((sigBytes[0] - 27) & 3);
    const compactSig = sigBytes.slice(1, 65);
    const pubkey = secp.recoverPublicKey(digest as Uint8Array, compactSig, recovery, true);
    return secp.verify(compactSig, digest as Uint8Array, pubkey);
  } catch {
    return false;
  }
}

// SSL 証明書と秘密鍵の確認
const keyPath = "./certs/privkey.pem";
const certPath = "./certs/fullchain.pem";
if (!existsSync(keyPath) || !existsSync(certPath)) {
  console.error("SSL証明書または秘密鍵が見つかりません。");
  process.exit(1);
}

// 型定義（key / cert の追加）
type BunServeOptions = Parameters<typeof Bun.serve>[0];
type HttpsServeOptions = BunServeOptions & {
  key: string | Uint8Array;
  cert: string | Uint8Array;
};

// サーバ起動
Bun.serve({
  port: 443,
  key: readFileSync(keyPath),
  cert: readFileSync(certPath),

  routes: {
    // GET nonce
    "/api/get-nonce": (req) => {
      if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405 });

      const username = new URL(req.url).searchParams.get("username");
      if (!username) return Response.json({ error: "username required" }, { status: 400 });

      const nonce = randomBytes(16).toString("hex");
      nonces.set(username, nonce);
      return Response.json({ nonce });
    },

    // POST verify
    "/api/verify": async (req) => {
      if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

      try {
        const { username, message, signature, publicKey } = await req.json() as any;

        if (!username || !message || !signature || !publicKey)
          return Response.json({ error: "Missing parameters" }, { status: 400 });

        const storedNonce = nonces.get(username);
        if (!storedNonce) return Response.json({ error: "Nonce not found" }, { status: 400 });

        const expectedMessage = `Login to mysite with nonce: ${storedNonce}`;
        if (message !== expectedMessage) return Response.json({ error: "Invalid message" }, { status: 400 });

        const isValid = test(message, signature);
        if (isValid) nonces.delete(username);

        return Response.json({
          success: isValid,
          username: isValid ? username : undefined,
          error: isValid ? undefined : "Invalid signature"
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    },

    // 静的ファイル
    "/": (req) => {
      if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
      return new Response(Bun.file(`${import.meta.dir}/index.html`));
    },
    "/storage.html": (req) => {
      if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
      return new Response(Bun.file(`${import.meta.dir}/storage.html`));
    },

    // 404 fallback
    default: () => new Response("Not Found", { status: 404 }),
  },
} as HttpsServeOptions);

console.log("✅ Bun HTTPS Server running on https://localhost:443");
