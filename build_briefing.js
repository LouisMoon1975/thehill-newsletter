const fs = require("fs");
const path = require("path");
const { formatDateKorean, formatDateKoreanFull, formatDateISO, truncate, buildTelegramMessage } = require("./format_newsletter.js");

const ARCHIVE_RETENTION_DAYS = 90;

// 입력 파일 형식 (JSON): [{ title_ko, description_ko, summary_ko, title_en, link, image, category }]
// title_ko/description_ko: 카카오 카드용 (짧게), summary_ko: 브리핑 페이지용 (2~3문장)
// image: 원문 기사 대표 이미지 URL (없으면 null), category: 매칭된 키워드 (없으면 "")
function buildHtml(items, pageUrl) {
  const dateStr = formatDateKorean();
  const dateFull = formatDateKoreanFull();
  const ogDescription = escapeHtml(
    items.slice(0, 3).map((item) => item.title_ko).join(" · ")
  );
  const rows = items
    .map(
      (item, i) => `
      <div class="card-wrap">
        <div class="rank-badge">${i + 1}</div>
        <article class="item">
          ${item.category ? `<span class="tag">${escapeHtml(item.category)}</span>` : ""}
          <h2>${escapeHtml(item.title_ko)}</h2>
          <p class="summary">${escapeHtml(item.summary_ko || item.description_ko || "")}</p>
          <div class="source-card">
            ${item.image ? `<img class="thumb" src="${item.image}" alt="" loading="lazy">` : ""}
            <div class="source-text">
              <p class="en-title">${escapeHtml(item.title_en || "")}</p>
              <a class="link" href="${item.link}" target="_blank" rel="noopener">원문 기사 보기 →</a>
            </div>
          </div>
        </article>
      </div>`
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@900&family=Nanum+Gothic:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; margin: 0; background: linear-gradient(180deg, #f5f8fc 0%, #eef2f9 40%, #e3e9f5 100%); color: #1a1a1a; }

  .topbar { position: relative; overflow: hidden; background: #0e2148; padding: 14px 16px; }
  .topbar-bgimg { position: absolute; top: 0; height: 100%; object-fit: cover; opacity: 0.18; filter: grayscale(10%); transform: scale(1.7); }
  .topbar-bgimg:nth-child(1) { left: 2%; width: 18%; transform-origin: 30% center; }
  .topbar-bgimg:nth-child(2) { left: 41%; width: 18%; transform-origin: 50% 30%; }
  .topbar-bgimg:nth-child(3) { left: 80%; width: 18%; transform-origin: 50% center; }
  .topbar-inner { position: relative; z-index: 1; max-width: 1600px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
  .topbar-left h1 { font-size: 22px; margin: 0 0 4px; color: #fff; }
  .topbar-left .brand { font-family: 'Roboto Slab', Georgia, serif; font-weight: 900; letter-spacing: -0.01em; }
  .topbar-left .briefing { font-family: 'Ebrima', -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; font-size: 0.85em; }
  .topbar-left p { margin: 0; font-size: 14px; color: rgba(255,255,255,0.85); }
  .topbar-right { text-align: right; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.6; }
  .topbar-right a { color: #fff; text-decoration: underline; }
  @media (min-width: 641px) {
    .topbar-left h1 { font-size: 25.3px; }
  }

  .content { max-width: 1600px; margin: 0 auto; padding: 24px 16px 60px; }

  .card-wrap { position: relative; margin-bottom: 26px; padding-top: 14px; }
  .rank-badge { position: absolute; top: 0; left: 16px; z-index: 1; width: 28px; height: 28px; border-radius: 50%; background: #0e2148; color: #fff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
  .item { position: relative; background: #fff; border-radius: 6px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: box-shadow 0.25s ease; }
  .item:hover { box-shadow: 0 0 0 4px rgba(43,79,216,0.18), 0 6px 24px rgba(43,79,216,0.35); }
  .item h2 {
    font-size: 13.5px; margin: 0 0 4px; line-height: 1.3;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .tag { display: block; font-size: 11px; font-weight: 700; color: #3182f6; margin-bottom: 4px; }
  .summary { font-family: 'Ebrima', 'Nanum Gothic', -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; font-size: 14px; color: #333; line-height: 1.5; margin: 0 0 10px; }
  .source-card { display: flex; align-items: center; gap: 10px; background: #f4f6fb; border-radius: 6px; padding: 8px; }
  .source-text { flex: 1; min-width: 0; }
  .en-title { font-size: 12px; color: #555; font-weight: 700; margin: 0 0 4px; }
  .thumb { width: 66px; height: 66px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
  .link { font-size: 13px; color: #3182f6; text-decoration: none; font-weight: 500; }
  @media (min-width: 641px) {
    .summary { font-size: 13px; }
  }
  @media (min-width: 900px) {
    .card-row { display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 4px 16px; }
    .card-row .card-wrap { flex: 0 0 23%; margin-bottom: 0; scroll-snap-align: start; }
    .card-row .item { min-height: 645px; }
  }
</style>
</head>
<body>
  <div class="topbar">
    <img class="topbar-bgimg" src="https://commons.wikimedia.org/wiki/Special:FilePath/White_House.jpg" alt="">
    <img class="topbar-bgimg" src="https://commons.wikimedia.org/wiki/Special:FilePath/United_States_Capitol_west_front_edit2.jpg" alt="">
    <img class="topbar-bgimg" src="https://commons.wikimedia.org/wiki/Special:FilePath/Wall_Street_sign.jpg" alt="">
    <div class="topbar-inner">
      <div class="topbar-left">
        <h1><span class="brand">The Hill.com</span> <span class="briefing">Briefing</span></h1>
        <p>${dateFull} · thehill.com 요약</p>
      </div>
      <div class="topbar-right">
        <p>매일 아침 자동 업데이트 됩니다</p>
        <a href="archive/">지난 브리핑 보기</a>
      </div>
    </div>
  </div>
  <div class="content">
    <div class="card-row">
    ${rows}
    </div>
  </div>
</body>
</html>`;
}

function buildArchiveIndexHtml(isoDates) {
  const items = isoDates
    .map((d) => `<li><a href="${d}.html">${d}</a></li>`)
    .join("\n");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Hill Briefing 지난 기록</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; max-width: 480px; margin: 0 auto; padding: 24px 16px 60px; background: #fafafa; color: #1a1a1a; }
  h1 { font-size: 20px; }
  ul { list-style: none; padding: 0; }
  li { background: #fff; border-radius: 10px; margin-bottom: 8px; }
  li a { display: block; padding: 14px 16px; color: #1a1a1a; text-decoration: none; }
  a.back { color: #3182f6; font-size: 14px; }
</style>
</head>
<body>
  <h1>📚 지난 브리핑 (최근 ${ARCHIVE_RETENTION_DAYS}일)</h1>
  <p><a class="back" href="../">← 오늘 브리핑으로</a></p>
  <ul>
${items}
  </ul>
</body>
</html>`;
}

function pruneAndListArchive(archiveDir, todayIso) {
  fs.mkdirSync(archiveDir, { recursive: true });
  const cutoff = new Date(todayIso + "T00:00:00Z");
  cutoff.setUTCDate(cutoff.getUTCDate() - ARCHIVE_RETENTION_DAYS);

  const dates = fs
    .readdirSync(archiveDir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.html$/.test(f))
    .map((f) => f.replace(".html", ""));

  const kept = [];
  for (const iso of dates) {
    if (new Date(iso + "T00:00:00Z") < cutoff) {
      fs.unlinkSync(path.join(archiveDir, iso + ".html"));
    } else {
      kept.push(iso);
    }
  }
  if (!kept.includes(todayIso)) kept.push(todayIso);
  return kept.sort().reverse();
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
  const archiveDir = path.join(docsDir, "archive");
  fs.mkdirSync(docsDir, { recursive: true });

  const html = buildHtml(items, pageUrl);
  fs.writeFileSync(path.join(docsDir, "index.html"), html, "utf8");

  const todayIso = formatDateISO();
  const keptDates = pruneAndListArchive(archiveDir, todayIso);
  fs.writeFileSync(path.join(archiveDir, `${todayIso}.html`), html, "utf8");
  fs.writeFileSync(path.join(archiveDir, "index.html"), buildArchiveIndexHtml(keptDates), "utf8");

  const template = buildKakaoTemplate(items, pageUrl);
  fs.writeFileSync(path.join(__dirname, "template.json"), JSON.stringify(template, null, 2), "utf8");

  const telegramText = buildTelegramMessage(items, pageUrl);
  fs.writeFileSync(path.join(__dirname, "telegram_message.txt"), telegramText, "utf8");

  console.log(`docs/index.html, docs/archive/${todayIso}.html, template.json, telegram_message.txt 생성 완료 (보관 ${keptDates.length}일치)`);
}

main();
