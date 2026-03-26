import * as dotenv from "dotenv";
dotenv.config();
// src/constants/jwt.constant.ts
export const jwtConstants = {
  jwksUri: process.env.JWKS_URI,
  audience: process.env.JWT_AUDIENCE,
  issuer: process.env.JWT_ISSUER,
  algorithms: ["RS256"] as const,
    secret: "0x2420984b031abd28e2f5275fa0941ee11f5710c4ae952e679b6af12de9ad8a33",
  publicKey: `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAy7JKXvYbHYeU8+46N/q7
/W6+C4jSQFBAD2HYN11Jpn/YWbYk8qvKQkdfr19k29So+1qvjog9rG+Bdo/MNR66
BLHkruSQ1m0dAWFo+VEUNIJIe44zYI1K2SsK+1dgh/fc4r0JQBBXEcqyFb1s6yor
VupZUQ371eBv0WS7H9oA3v24wlXZUrQr3BZGJ1YmXtfmBRDi6WzPgQAkxZZ6MARz
kI6K0feR/PahSWfGrZbTKU+8F1kycbzOPe8YAXGqrJs6K1V2WvUWi/JvKFqApe+E
QSt2Fa5gyrMI/yOjBpFggXNlJB1DanuLYePsd+9vjpaZxdX8/fq43QGZKXqX/FZb
qpocVIY8TSK2Lo8ohjDaZJWUk0vbxYKJC0LRjS5YlgemOPTsYAvFt/aCOJYfE1Dn
Hcq3jiLCH/q8kSO58gMftLb/cQFVJCdPbHIam/SDAofCk/eoqvo8hR8Zo9FzbV4k
m/APBPTs0OeaJPAFL9LzHG5EMGmEMnRUJiT4SkynTy1iAJ8SaWPAWM9UVjS9kH/d
DeAywoEXmwaGC3nV1IDOfMJhUVtCgpga3UC+Wx44esbKCVdws3AkTWqhC2Hsany8
oWeXE2qwPmK3LMRKHWnKTDE4TuX3BEo8g+GnMxRyQyKv0AP6osGYObz4HGrXaPsC
dW1SLpDJBbSYZqetm8e8SQkCAwEAAQ==
-----END PUBLIC KEY-----`,
  salt: 10,
  expire: "30d",
};
