import { readFileSync } from "fs";
import { randomBytes, createHash } from "crypto";
import * as secp from "@noble/secp256k1";
import bs58 from "bs58";

// ハッシュ・署名関連関数
function ripemd160(data: Uint8Array): Uint8Array {
    return new Uint8Array(createHash("ripemd160").update(data).digest());
}

function pubkeyToSteem(pubkey: Uint8Array): string {
    const checksum = ripemd160(pubkey).slice(0, 4);
    const full = new Uint8Array(pubkey.length + 4);
    full.set(pubkey, 0);
    full.set(checksum, pubkey.length);
    return "STM" + bs58.encode(full);
}

function test(message: string, signature: string) {
    try {
        const digest = Bun.SHA256.hash(new TextEncoder().encode(message));
        const sigBytes = Buffer.from(signature, "hex");
        const recovery = ((sigBytes?.[0] ?? 0) - 27) & 3;
        const compactSig = sigBytes.slice(1, 65);
        const pubkey = secp.recoverPublicKey(digest as Uint8Array, compactSig, recovery, true);
        return secp.verify(compactSig, digest as Uint8Array, pubkey);
    } catch (err) {
        console.error(err);
        return false;
    }
}

const nonces = new Map<string, string>();

type BunServeOptions = Parameters<typeof Bun.serve>[0];
type HttpsServeOptions = BunServeOptions & {
    key: string | Uint8Array;
    cert: string | Uint8Array;
};

Bun.serve({
    port: 443,
    key: readFileSync("./certs/privkey.pem"),
    cert: readFileSync("./certs/fullchain.pem"),
    routes: {
        "GET /api/get-nonce": (req) => {
            const url = new URL(req.url);
            const username = url.searchParams.get("username");
            if (!username) return Response.json({ error: "username is required" }, { status: 400 });

            const nonce = randomBytes(16).toString("hex");
            nonces.set(username, nonce);
            return Response.json({ nonce });
        },

        "POST /api/verify": async (req) => {
            try {
                const { username, message, signature, publicKey } = await req.json() as any;

                if (!username || !message || !signature || !publicKey)
                    return Response.json({ error: "Missing parameters" }, { status: 400 });

                const storedNonce = nonces.get(username);
                if (!storedNonce)
                    return Response.json({ error: "Nonce not found" }, { status: 400 });

                const expectedMessage = `Login to mysite with nonce: ${storedNonce}`;
                if (message !== expectedMessage)
                    return Response.json({ error: "Invalid message" }, { status: 400 });

                const isValid = test(message, signature);
                if (isValid) nonces.delete(username);

                return Response.json({ success: isValid, username: isValid ? username : undefined, error: isValid ? undefined : "Invalid signature" });
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return Response.json({ error: msg }, { status: 500 });
            }
        },

        // 静的ファイル
        "GET /": (req) => {
            const file = Bun.file(`${import.meta.dir}/index.html`);
            return new Response(file);
        },

        "GET /storage.html": (req) => {
            const file = Bun.file(`${import.meta.dir}/storage.html`);
            return new Response(file);
        },
    },
} as HttpsServeOptions);

console.log(`✅ Server running on https://bun.steememory.com`);
