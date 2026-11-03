// Renders the link preview image (public/og.jpg) with the site's own fonts and real textures.
// Run with the local stack up: npx tsx scripts/generate-og.ts
import { chromium } from "@playwright/test";
import { getMessages } from "../src/config/messages";

const SIZE = { width: 1200, height: 630 };
const SITE = process.env.E2E_BASE_URL ?? "https://localhost";

/** Builds the artwork: Arabic title beside a slanted carbon panel holding the mark. */
function artwork(): string {
  const ar = getMessages("ar");
  const checker = Array.from({ length: 22 }, (_, column) =>
    [0, 1, 2]
      .filter((row) => (row + column) % 2 === 0)
      .map((row) => `<rect x="${column * 12}" y="${row * 12}" width="12" height="12"/>`)
      .join(""),
  ).join("");

  return `
    <div id="og" dir="rtl">
      <div class="panel"></div>
      <div class="stripe stripe-taupe"></div>
      <div class="stripe stripe-teal"></div>
      <div class="stripe stripe-deep"></div>
      <img class="mark" src="/brand/logo-mark.png" alt="" />
      <div class="copy">
        <p class="kicker">${ar.home.kicker}</p>
        <h1>${ar.brand.name}</h1>
        <p class="latin" dir="ltr">${ar.brand.nameOther}</p>
        <p class="line">${ar.home.headline}</p>
      </div>
      <div class="foot">
        <svg viewBox="0 0 264 36" width="176" height="24" fill="#9f895c" aria-hidden="true">${checker}</svg>
        <p>${ar.brand.organizer}</p>
      </div>
    </div>`;
}

const STYLE = `
  html, body { margin: 0; background: #0c272c; }
  body > :not(#og) { display: none !important; }
  #og {
    position: fixed; inset: 0; width: ${SIZE.width}px; height: ${SIZE.height}px; overflow: hidden; color: #fff;
    background: linear-gradient(rgb(12 39 44 / 84%), rgb(12 39 44 / 92%)), url(/textures/asphalt-track.webp) center / 420px;
    font-family: var(--font-body);
  }
  .panel {
    position: absolute; inset: 0 auto 0 0; width: 452px;
    background: linear-gradient(rgb(0 0 0 / 18%), rgb(12 39 44 / 55%)), url(/textures/carbon-weave.webp) center / 120px;
    clip-path: polygon(0 0, 100% 0, 58.4% 100%, 0 100%);
  }
  .stripe { position: absolute; inset-block: 0; left: 0; width: 700px; }
  .stripe-taupe { background: #9f895c; clip-path: polygon(452px 0, 480px 0, 292px 100%, 264px 100%); }
  .stripe-teal { background: #358b9a; clip-path: polygon(492px 0, 508px 0, 320px 100%, 304px 100%); }
  .stripe-deep { background: #2a636d; clip-path: polygon(520px 0, 572px 0, 384px 100%, 332px 100%); }
  .mark { position: absolute; left: 30px; top: 246px; width: 288px; height: auto; }
  .copy { position: absolute; right: 64px; top: 104px; width: 600px; text-align: right; }
  .kicker { margin: 0 0 12px; color: #c8b382; font-size: 27px; font-weight: 700; }
  h1 { margin: 0; font-family: var(--font-kufi); font-weight: 700; font-size: 80px; line-height: 1.28; white-space: nowrap; }
  .latin { margin: 6px 0 22px; font-family: var(--font-wide); font-size: 37px; letter-spacing: .01em; text-align: right; }
  .line { margin: 0; color: #dfe7e8; font-size: 32px; font-weight: 500; }
  .foot { position: absolute; right: 64px; bottom: 56px; display: flex; align-items: center; gap: 22px; font-size: 25px; font-weight: 500; }
  .foot p { margin: 0; }
`;

/** Opens the site for its fonts, swaps in the artwork, and saves the image. */
async function main(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: SIZE, ignoreHTTPSErrors: true, deviceScaleFactor: 1 });
  await page.goto(`${SITE}/ar`);
  await page.evaluate(
    ({ html, css }) => {
      document.body.insertAdjacentHTML("beforeend", html);
      const style = document.createElement("style");
      style.textContent = css;
      document.head.append(style);
      return document.fonts.ready;
    },
    { html: artwork(), css: STYLE },
  );
  await page.waitForTimeout(800);
  await page.screenshot({ path: "public/og.jpg", type: "jpeg", quality: 88 });
  await browser.close();
}

await main();
