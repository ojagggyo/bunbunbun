import bs58 from "bs58";
import { sha256 } from "@noble/hashes/sha256";

// ---------------------------------------------
// 🔹 Hex → Uint8Array
// ---------------------------------------------
function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

// ---------------------------------------------
// 🔹 Uint8Array → Hex
// ---------------------------------------------
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------
// 🔹 Steem 公開鍵 (compressed 33 bytes) → STM... Base58 形式に変換
// ---------------------------------------------
function encodeSteemPublicKey(pubKeyCompressed: Uint8Array): string {
  const keyType = new TextEncoder().encode("K1"); // Steem uses K1
  const checksum = sha256(new Uint8Array([...pubKeyCompressed, ...keyType])).slice(0, 4);
  const full = new Uint8Array([...pubKeyCompressed, ...checksum]);
  return "STM" + bs58.encode(full);
}

// ---------------------------------------------
// 🔹 STM... Base58 形式 → 公開鍵 (33 bytes) に戻す
// ---------------------------------------------
function decodeSteemPublicKey(stmKey: string): Uint8Array {
  if (!stmKey.startsWith("STM")) throw new Error("Invalid STM key prefix");
  const data = bs58.decode(stmKey.slice(3));

  if (data.length !== 37) throw new Error("Invalid STM key length");

  const pubKey = data.slice(0, 33);
  const checksum = data.slice(33, 37);

  // チェックサム検証
  const keyType = new TextEncoder().encode("K1");
  const verifyChecksum = sha256(new Uint8Array([...pubKey, ...keyType])).slice(0, 4);

  for (let i = 0; i < 4; i++) {
    if (checksum[i] !== verifyChecksum[i]) {
      throw new Error("Checksum mismatch – invalid STM key");
    }
  }

  return pubKey;
}

// ---------------------------------------------
// ✅ テスト
// ---------------------------------------------
let pubHex =
//  "02b46348f8c6a580ce69b2a142acfa89499ab94872bb5b0b8e7d6a6e5666e38d31"; // 33バイト圧縮公開鍵(hex)
"1f74bc312a7f9b6987ba7ba33185f84e48b237b57bd535c648f75d13f8ea75ea194360063d7deb59305ce523a8acbd4beaae937c36219c53a15546fe919a8f8655";
const args = process.argv.slice(2);
//pubHex = args[0];

// 1️⃣ hex → bytes → STMエンコード
const pubBytes = hexToBytes(pubHex);
const stm = encodeSteemPublicKey(pubBytes);
console.log("Encoded STM Key:", stm);

// 2️⃣ STMデコード → bytes → hex
const decoded = decodeSteemPublicKey(stm);
console.log("Decoded Hex:", bytesToHex(decoded));


