import https from "node:https";

const PROJECT_REF = "jdodjbzypuiyhgrzuyzp";
const HOST = `${PROJECT_REF}.supabase.co`;
const PATH = "/functions/v1/update-client-status";

function makeRequest(headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: HOST,
        path: PATH,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let respData = "";
        res.on("data", (chunk) => (respData += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(respData);
          } catch {
            parsed = respData;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("=== VERIFYING LIVE EDGE FUNCTION V28 (update-client-status) ===");

  // 1. Unauthenticated request
  console.log("\n[PROBE 1] Testing unauthenticated call...");
  const p1 = await makeRequest({}, { action: "confirm_bank_transfer" });
  console.log(`Status: ${p1.status}`, p1.body);
  if (p1.status !== 401) throw new Error(`Expected 401, got ${p1.status}`);

  // 2. Bogus Bearer token
  console.log("\n[PROBE 2] Testing bogus bearer token...");
  const p2 = await makeRequest(
    { Authorization: "Bearer bogus-jwt-token-xyz" },
    { action: "confirm_bank_transfer" }
  );
  console.log(`Status: ${p2.status}`, p2.body);
  if (p2.status !== 401) throw new Error(`Expected 401, got ${p2.status}`);

  console.log("\n>>> LIVE EDGE FUNCTION V28 PROBE VERIFIED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("Probe failed:", err);
  process.exit(1);
});
