import { readFileSync } from "fs";
import { randomBytes } from "crypto";
import * as secp from "@noble/secp256k1";
//import { createHash } from "crypto";
import bs58 from "bs58";

function sha256(data: Uint8Array): Uint8Array { return new Uint8Array(createHash("sha256").update(data).digest()); }
function ripemd160(data: Uint8Array): Uint8Array { return new Uint8Array(createHash("ripemd160").update(data).digest()); }
function pubkeyToSteem(pubkey: Uint8Array): string {
    const checksum = ripemd160(pubkey).slice(0, 4);// compressed pubkey → RIPEMD160 ハッシュ
    const full = new Uint8Array(pubkey.length + 4);// pubkey + checksum
    full.set(pubkey, 0);
    full.set(checksum, pubkey.length);
    return "STM" + bs58.encode(full);// Base58 エンコード
}
function bytesToHex(bytes: Uint8Array): string { return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join(""); }

function test(message: string, signature: string) {
    try {
        // SHA256
        const digest = sha256(new TextEncoder().encode(message));
        // Steem署名解析
        const sigBytes = Buffer.from(signature, "hex");
        const recovery = (sigBytes[0] - 27) & 3;
        const compactSig = sigBytes.slice(1, 65);
        // 公開鍵復元
        const pubkey = secp.recoverPublicKey(digest, compactSig, recovery, true);
        // Steem形式に変換
        //const steemPubkey = pubkeyToSteem(pubkey);
        //console.log("Steem PubKey:", steemPubkey);
        // 署名検証
        const isValid = secp.verify(compactSig, digest, pubkey);
        console.log("isValid :", isValid);
        return isValid;

    } catch (err) {
        console.error(err);
    }
}

const nonces = new Map();

Bun.serve({
    //port: 3333,
    port: 443,
    key: readFileSync("./certs/privkey.pem"),
    cert: readFileSync("./certs/fullchain.pem"),

    async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/api/get-nonce") {
            const username = url.searchParams.get("username");
            if (!username)
                return Response.json({ error: "username is required" }, { status: 400 });
            const nonce = randomBytes(16).toString("hex");
            nonces.set(username, nonce);
            return Response.json({ nonce });
        }

        if (url.pathname === "/api/verify" && req.method === "POST") {
            try {
                const { username, message, signature, publicKey } = await req.json() as any;

                console.info("username: ", username)
                console.info("message: ", message)
                console.info("signature: ", signature)
                console.info("publicKey: ", publicKey)

                if (!username || !message || !signature || !publicKey)
                    return Response.json({ error: "Missing parameters" }, { status: 400 });

                const storedNonce = nonces.get(username);
                if (!storedNonce)
                    return Response.json({ error: "Nonce not found" }, { status: 400 });

                const expectedMessage = `Login to mysite with nonce: ${storedNonce}`;
                if (message !== expectedMessage)
                    return Response.json({ error: "Invalid message" }, { status: 400 });

                const isValid = test(message, signature);

                if (isValid) {
                    nonces.delete(username);
                    return Response.json({ success: true, username });
                } else {
                    return Response.json({ success: false, error: "Invalid signature" });
                }
            } catch (err) {
                console.error(err);
                return Response.json({ error: err.message }, { status: 500 });
            }
        }

        if (url.pathname === "/" && req.method === "GET") {
            const BASE_PATH = '/home/steem/keychaintest';
            const path = new URL(req.url).pathname;
            const filePath = `${BASE_PATH}${path === '/' ? '/index.html' : path}`;
            const file = Bun.file(filePath);
            return new Response(file);
        }

        return new Response("Not Found", { status: 404 });
    },
});

//console.log(`✅ Server running on http://localhost:3333`);
console.log(`✅ Server running on https://bun.steememory.com`);
