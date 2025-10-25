import * as secp from "@noble/secp256k1";
import { createHash } from "crypto";
import bs58 from "bs58";

//function sha256(data: Uint8Array): Uint8Array { return new Uint8Array(createHash("sha256").update(data).digest()); }
function ripemd160(data: Uint8Array): Uint8Array { return new Uint8Array(createHash("ripemd160").update(data).digest()); }
function pubkeyToSteem(pubkey: Uint8Array): string {
  const checksum = ripemd160(pubkey).slice(0, 4);// compressed pubkey → RIPEMD160 ハッシュ
  const full = new Uint8Array(pubkey.length + 4);// pubkey + checksum
  full.set(pubkey, 0);
  full.set(checksum, pubkey.length);
  return "STM" + bs58.encode(full);// Base58 エンコード
}
//function bytesToHex(bytes: Uint8Array): string { return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join(""); }

try {
  const signature = "20356757cb7d303ece5852aa84dc1d4e1ca27099ee99023a216e3b2e43f13ead677f69be476b6004a027b77a743ab113ec3ba168a6d758e2c13ce6cc80ac2d0406";
  const message = "Login to mysite with nonce: 14a31bde6b422d0f3a1bfe47758cc7f0";
  // SHA256
  //const digest = sha256(new TextEncoder().encode(message));
  const digest = Bun.SHA256.hash(new TextEncoder().encode(message));
  // Steem署名解析
  const sigBytes = Buffer.from(signature, "hex");
  const recovery = (sigBytes[0] - 27) & 3;
  const compactSig = sigBytes.slice(1, 65);
  // 公開鍵復元
  const pubkey = secp.recoverPublicKey(digest, compactSig, recovery, true);
  // Steem形式に変換
  const steemPubkey = pubkeyToSteem(pubkey);
  console.log("Steem PubKey:", steemPubkey);
  // 署名検証
  const isValid = secp.verify(compactSig, digest, pubkey);
  console.log("Signature valid:", isValid);
} catch (err) {
  console.error(err);
}
