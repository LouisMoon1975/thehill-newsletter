const fs = require("fs");
const path = require("path");
const { formatDateKorean, truncate, buildTelegramMessage } = require("./format_newsletter.js");

// 입력 파일 형식 (JSON): [{ title_ko, description_ko, summary_ko, title_en, link }]
// title_ko/description_ko: 카카오 카드용 (짧게), summary_ko: 브리핑 페이지용 (2~3문장)
function buildHtml(items, pageUrl) {
  const dateStr = formatDateKorean();
  const ogDescription = escapeHtml(
    items.slice(0, 3).map((item) => item.title_ko).join(" · ")
  );
  const rows = items
    .map(
      (item, i) => `
      <article class="item">
        <div class="rank">${i + 1}</div>
        <div class="body">
          <h2>${escapeHtml(item.title_ko)}</h2>
          <p class="en-title">${escapeHtml(item.title_en || "")}</p>
          <p class="summary">${escapeHtml(item.summary_ko || item.description_ko || "")}</p>
          <a class="link" href="${item.link}" target="_blank" rel="noopener">원문 기사 보기 →</a>
        </div>
      </article>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${dateStr} The Hill Briefing</title>
<meta property="og:type" content="article">
<meta property="og:title" content="${dateStr} The Hill Briefing">
<meta property="og:description" content="${ogDescription}">
<meta property="og:url" content="${pageUrl}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${dateStr} The Hill Briefing">
<meta name="twitter:description" content="${ogDescription}">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; max-width: 640px; margin: 0 auto; padding: 24px 16px 60px; background: #fafafa; color: #1a1a1a; }
  header { margin-bottom: 24px; }
  header h1 { font-size: 22px; margin: 0 0 4px; }
  header p { color: #666; margin: 0; font-size: 14px; }
  .item { display: flex; gap: 12px; background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .rank { font-weight: 700; color: #999; font-size: 18px; min-width: 24px; }
  .body h2 { font-size: 17px; margin: 0 0 4px; line-height: 1.35; }
  .en-title { font-size: 12px; color: #999; margin: 0 0 8px; }
  .summary { font-size: 14px; color: #333; line-height: 1.5; margin: 0 0 10px; }
  .link { font-size: 13px; color: #3182f6; text-decoration: none; font-weight: 500; }
  footer { text-align: center; color: #aaa; font-size: 12px; margin-top: 24px; }
</style>
</head>
<body>
  <header>
    <h1>📰 The Hill Briefing</h1>
    <p>${dateStr} · thehill.com 요약</p>
  </header>
  ${rows}
  <footer>매일 아침 자동 업데이트</footer>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function buildKakaoTemplate(items, pageUrl) {
  const top3 = items.slice(0, 3);
  return {
    object_type: "list",
    header_title: `${formatDateKorean()} The Hill Briefing (전체 ${items.length}건)`,
    header_link: { web_url: pageUrl, mobile_web_url: pageUrl },
    contents: top3.map((item) => ({
      title: truncate(item.title_ko, 45),
      description: truncate(item.description_ko, 70),
      link: { web_url: item.link, mobile_web_url: item.link },
    })),
    button_title: "전체 브리핑 보기",
  };
}

function main() {
  const inputPath = process.argv[2];
  const pageUrl = process.argv[3];
  if (!inputPath || !pageUrl) {
    console.error("사용법: node build_briefing.js <selected.json> <page_url>");
    process.exit(1);
  }

  const items = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  const docsDir = path.join(__dirname, "docs");
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "index.html"), buildHtml(items, pageUrl), "utf8");

  const template = buildKakaoTemplate(items, pageUrl);
  fs.writeFileSync(path.join(__dirname, "template.json"), JSON.stringify(template, null, 2), "utf8");

  const telegramText = buildTelegramMessage(items, pageUrl);
  fs.writeFileSync(path.join(__dirname, "telegram_message.txt"), telegramText, "utf8");

  console.log("docs/index.html, template.json, telegram_message.txt 생성 완료");
}

main();
