// Simulates 1000 concurrent visitors: logging in, browsing, showing badges, and claiming coins.
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// One address, or several separated by commas to spread visitors across them.
const TARGETS = (__ENV.BASE_URLS || "https://localhost").split(",");
const BASE = TARGETS[(__VU || 1) % TARGETS.length];
const PASSWORD = "load-test-password";
const CODE_COUNT = 20;
const claimFailures = new Rate("claim_failures");

export const options = {
  insecureSkipTLSVerify: true,
  noCookiesReset: true,
  scenarios: {
    visitors: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "60s", target: 1000 },
        { duration: "120s", target: 1000 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
    claim_failures: ["rate<0.01"],
  },
};

const PAGES = ["/ar", "/ar/agenda", "/ar/map", "/ar/agenda", "/en/agenda", "/ar/badge", "/ar/coins"];

/** Pauses like a person reading a screen. */
function think() {
  sleep(3 + Math.random() * 5);
}

/** Logs this virtual visitor in once, keeping the cookie for later requests. */
function login() {
  const response = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({ email: `load${__VU}@loadtest.invalid`, password: PASSWORD }),
    { headers: { "Content-Type": "application/json" }, tags: { name: "login" } },
  );
  check(response, { "login ok": (reply) => reply.status === 200 });
}

/** Claims a random code. A repeat claim is a normal, successful reply. */
function claim() {
  const code = `LOADCODE${1 + Math.floor(Math.random() * CODE_COUNT)}`;
  const response = http.post(`${BASE}/api/coins/claim`, JSON.stringify({ token: code }), {
    headers: { "Content-Type": "application/json" },
    tags: { name: "claim" },
  });
  const ok = response.status === 200;
  claimFailures.add(!ok);
  check(response, { "claim ok": () => ok });
}

/** One visitor step: log in first, then browse, sometimes claiming a code. */
export default function visitor() {
  if (__ITER === 0) {
    login();
    think();
  }
  const path = PAGES[Math.floor(Math.random() * PAGES.length)];
  const response = http.get(`${BASE}${path}`, { tags: { name: path } });
  check(response, { "page ok": (reply) => reply.status === 200, "still logged in": (reply) => !reply.url.includes("/login") });
  if (Math.random() < 0.15) claim();
  think();
}
