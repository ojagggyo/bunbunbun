import { randomBytes } from "crypto";

const nonces = new Map();

Bun.serve({
    port: 3333,

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
                const { username, message, signature, publicKey } = await req.json();
                console.info(username)
                console.info(message)
                console.info(signature)
                console.info(publicKey)

                if (!username || !message || !signature || !publicKey)
                    return Response.json({ error: "Missing parameters" }, { status: 400 });

                const storedNonce = nonces.get(username);
                if (!storedNonce)
                    return Response.json({ error: "Nonce not found" }, { status: 400 });

                const expectedMessage = `Login to mysite with nonce: ${storedNonce}`;
                if (message !== expectedMessage)
                    return Response.json({ error: "Invalid message" }, { status: 400 });



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

console.log("✅ Server running on http://localhost:3333");
