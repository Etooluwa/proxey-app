import crypto from "node:crypto";

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

const ecdh = crypto.createECDH("prime256v1");
ecdh.generateKeys();

console.log(`WEB_PUSH_PUBLIC_KEY=${toBase64Url(ecdh.getPublicKey())}`);
console.log(`WEB_PUSH_PRIVATE_KEY=${toBase64Url(ecdh.getPrivateKey())}`);
console.log("WEB_PUSH_SUBJECT=mailto:info@mykliques.com");
