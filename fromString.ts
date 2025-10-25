import dsteem from 'dsteem';
const { Client, cryptoUtils, Signature, PublicKey } = dsteem;

try {
  let signature =
    "20356757cb7d303ece5852aa84dc1d4e1ca27099ee99023a216e3b2e43f13ead677f69be476b6004a027b77a743ab113ec3ba168a6d758e2c13ce6cc80ac2d0406";
  let message = "Login to mysite with nonce: 14a31bde6b422d0f3a1bfe47758cc7f0"

  const messageBuffer = Buffer.from(message, 'utf8');

  // 2️⃣ Steem Keychain は SHA256(message) を署名しているので同じくハッシュ化
  const digest = cryptoUtils.sha256(messageBuffer);

  // 3️⃣ 署名オブジェクト生成
  const signatureObj = Signature.fromString(signature);

  // 4️⃣ 公開鍵を復元（※ recover は digest を Buffer で渡す）
  const recoveredPubKey = PublicKey.from(signatureObj.recover(digest)).toString();

  console.log(recoveredPubKey)

  const key1 = Signature.fromString(signature).recover(dsteem.cryptoUtils.sha256(message)).toString();
  console.info(key1)
} catch (error) {
  console.log(error)
}
