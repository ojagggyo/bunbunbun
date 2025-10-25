import { verify } from '@noble/secp256k1';
import dsteem from 'dsteem';
const { Client, cryptoUtils, Signature, PublicKey } = dsteem;
import bs58 from "bs58";

try {
  let signature =
    "20356757cb7d303ece5852aa84dc1d4e1ca27099ee99023a216e3b2e43f13ead677f69be476b6004a027b77a743ab113ec3ba168a6d758e2c13ce6cc80ac2d0406";
  let message = "Login to mysite with nonce: 14a31bde6b422d0f3a1bfe47758cc7f0"
  // 1. メッセージのSHA256
  const digest = dsteem.cryptoUtils.sha256(Buffer.from(message, "utf8"));

  // 2. 署名オブジェクト生成
  const signatureObj = dsteem.Signature.fromString(signature);
  // 3. 公開鍵復元
  const recoveredPubKeySTM = dsteem.PublicKey.from(signatureObj.recover(digest)).toString();
  console.log("Recovered STM pubkey:", recoveredPubKeySTM);

  // 4. r+s部分を抽出
  const sigBytes = Buffer.from(signature, "hex").slice(1, 65);
  // 5. Base58 → バイト列
  const decode = bs58.decode(recoveredPubKeySTM.slice(3)); // STMを除去後
  const pubkeyBytes = decode.slice(0, 33); // 1〜33バイト = 圧縮公開鍵
  // 6. verify
  const isValid = verify(sigBytes, digest, pubkeyBytes);
  console.log("署名検証結果:", isValid);
} catch (error) {
  console.log(error)
}
