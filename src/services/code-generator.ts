import { EnvironmentProfile } from '../types/gateway';

export interface GeneratedSnippet {
  language: string;
  filename: string;
  code: string;
}

export class CodeGenerator {
  public static generateCurl(
    profile: EnvironmentProfile,
    endpoint: string,
    plainPayload: any,
    encryptedHex?: string,
    nonce?: string,
    signTime?: string,
    appSign?: string
  ): string {
    const url = `${profile.baseUrl.replace(/\/+$/, '')}${endpoint}`;
    const token = profile.token || 'YOUR_ACCESS_TOKEN';
    const sTime = signTime || String(Date.now());
    const n = nonce || '690940523e16428d9c288ca388d011ff';
    const hex = encryptedHex || 'A1B2C3...ENCRYPTED_HEX...D4E5F6';
    const sign = appSign || 'f09182736455463728192a3b4c5d6e7f809182736455463728192a3b4c5d6e7f';

    if (endpoint === '/api/v2/token') {
      return `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "appId: ${profile.appId}" \\
  -H "signTime: ${sTime}" \\
  -H "appSign: ${sign}"`;
    }

    return `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "appId: ${profile.appId}" \\
  -H "token: ${token}" \\
  -H "signTime: ${sTime}" \\
  -H "nonce: ${n}" \\
  -H "appSign: ${sign}" \\
  -H "locale: en" \\
  -d '{"appData": "${hex}"}'`;
  }

  public static generateTypeScript(
    profile: EnvironmentProfile,
    endpoint: string,
    plainPayload: any
  ): string {
    return `import crypto from 'node:crypto';

const APP_ID = '${profile.appId}';
const APP_KEY_HEX = '${profile.appKey}';
const BASE_URL = '${profile.baseUrl}';

function encryptAes256Gcm(plainText: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  // Format: IV(12) || Ciphertext(N) || Tag(16) in uppercase HEX
  return Buffer.concat([iv, encrypted, tag]).toString('hex').toUpperCase();
}

function hmacSha256(secretHex: string, message: string): string {
  return crypto.createHmac('sha256', secretHex).update(message).digest('hex').toLowerCase();
}

async function runPaymentCall() {
  const payload = ${JSON.stringify(plainPayload, null, 2)};
  const signTime = String(Date.now());
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const appData = encryptAes256Gcm(JSON.stringify(payload), APP_KEY_HEX);
  const appSign = hmacSha256(APP_KEY_HEX, \`appData=\${appData}&signTime=\${signTime}\`);

  const response = await fetch(\`\${BASE_URL}${endpoint}\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'appId': APP_ID,
      'token': '${profile.token || 'YOUR_JWT_TOKEN'}',
      'signTime': signTime,
      'nonce': nonce,
      'appSign': appSign,
      'locale': 'en'
    },
    body: JSON.stringify({ appData })
  });

  const result = await response.json();
  console.log('Result:', result);
}

runPaymentCall().catch(console.error);
`;
  }

  public static generatePython(
    profile: EnvironmentProfile,
    endpoint: string,
    plainPayload: any
  ): string {
    return `import json
import time
import os
import requests
import hmac
import hashlib
from Cryptodome.Cipher import AES

APP_ID = "${profile.appId}"
APP_KEY_HEX = "${profile.appKey}"
BASE_URL = "${profile.baseUrl}"

def encrypt_aes_256_gcm(plain_text: str, key_hex: str) -> str:
    key_bytes = bytes.fromhex(key_hex)
    iv = os.urandom(12)
    cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=iv)
    ciphertext, tag = cipher.encrypt_and_digest(plain_text.encode('utf-8'))
    # Layout: IV(12) || Ciphertext(N) || Tag(16) in uppercase HEX
    return (iv + ciphertext + tag).hex().upper()

def hmac_sha256(key_hex: str, message: str) -> str:
    return hmac.new(key_hex.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).hexdigest().lower()

def execute_request():
    payload = ${JSON.stringify(plainPayload, null, 4)}
    sign_time = str(int(time.time() * 1000))
    nonce = os.urandom(16).hex()

    app_data = encrypt_aes_256_gcm(json.dumps(payload), APP_KEY_HEX)
    app_sign = hmac_sha256(APP_KEY_HEX, f"appData={app_data}&signTime={sign_time}")

    headers = {
        "Content-Type": "application/json",
        "appId": APP_ID,
        "token": "${profile.token || 'YOUR_JWT_TOKEN'}",
        "signTime": sign_time,
        "nonce": nonce,
        "appSign": app_sign,
        "locale": "en"
    }

    resp = requests.post(f"{BASE_URL}${endpoint}", headers=headers, json={"appData": app_data})
    print("Status:", resp.status_code)
    print("Response:", resp.json())

if __name__ == "__main__":
    execute_request()
`;
  }

  public static generateJava(
    profile: EnvironmentProfile,
    endpoint: string,
    plainPayload: any
  ): string {
    return `import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HexFormat;

public class SukiPayClientDemo {
    private static final String APP_ID = "${profile.appId}";
    private static final String APP_KEY_HEX = "${profile.appKey}";
    private static final String BASE_URL = "${profile.baseUrl}";

    public static String encryptAesGcm(String plainText, String keyHex) throws Exception {
        byte[] keyBytes = HexFormat.of().parseHex(keyHex);
        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(keyBytes, "AES"), new GCMParameterSpec(128, iv));
        byte[] cipherTextWithTag = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

        byte[] output = new byte[iv.length + cipherTextWithTag.length];
        System.arraycopy(iv, 0, output, 0, iv.length);
        System.arraycopy(cipherTextWithTag, 0, output, iv.length, cipherTextWithTag.length);

        return HexFormat.of().formatHex(output).toUpperCase();
    }

    public static String hmacSha256(String keyHex, String message) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(keyHex.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(message.getBytes(StandardCharsets.UTF_8))).toLowerCase();
    }

    public static void main(String[] args) throws Exception {
        String payloadJson = """
${JSON.stringify(plainPayload, null, 2)}
""";
        String signTime = String.valueOf(System.currentTimeMillis());
        byte[] nonceBytes = new byte[16];
        new SecureRandom().nextBytes(nonceBytes);
        String nonce = HexFormat.of().formatHex(nonceBytes);

        String appData = encryptAesGcm(payloadJson, APP_KEY_HEX);
        String appSign = hmacSha256(APP_KEY_HEX, "appData=" + appData + "&signTime=" + signTime);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "${endpoint}"))
            .header("Content-Type", "application/json")
            .header("appId", APP_ID)
            .header("token", "${profile.token || 'YOUR_JWT_TOKEN'}")
            .header("signTime", signTime)
            .header("nonce", nonce)
            .header("appSign", appSign)
            .header("locale", "en")
            .POST(HttpRequest.BodyPublishers.ofString("{\\"appData\\":\\"" + appData + "\\"}"))
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Response: " + response.body());
    }
}
`;
  }
}
