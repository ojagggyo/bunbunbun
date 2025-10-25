import dsteem from 'dsteem';
//const { Client, cryptoUtils, Signature, PublicKey } = dsteem;

try {
  let signature =
    "20356757cb7d303ece5852aa84dc1d4e1ca27099ee99023a216e3b2e43f13ead677f69be476b6004a027b77a743ab113ec3ba168a6d758e2c13ce6cc80ac2d0406";
  let message = "Login to mysite with nonce: 14a31bde6b422d0f3a1bfe47758cc7f0"

  const messageBuffer = Buffer.from(message, 'utf8');

  // Steem Keychain は SHA256(message) を署名しているので同じくハッシュ化
  const digest = dsteem.cryptoUtils.sha256(messageBuffer);

  // 署名オブジェクト生成
  const signatureObj = dsteem.Signature.fromString(signature);

  // 公開鍵を復元（※ recover は digest を Buffer で渡す）
  const recoveredPubKey = dsteem.PublicKey.from(signatureObj.recover(digest)).toString();
  console.log(recoveredPubKey)

} catch (error) {
  console.log(error)
}
