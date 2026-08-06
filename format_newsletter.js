function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1).trimEnd() + "…" : str;
}

function formatDateKorean(date = new Date()) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  return `${month}월 ${day}일`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// items: [{ title_ko, description_ko, link }] — 전체 목록을 한 메시지에 담는다 (Kakao와 달리 개수 제한 없음).
function buildTelegramMessage(items, pageUrl) {
  const header = `<b>📰 ${formatDateKorean()} The Hill Briefing</b>`;
  const lines = items.map(
    (item, i) => `${i + 1}. <a href="${item.link}">${escapeHtml(item.title_ko)}</a>\n   ${escapeHtml(item.description_ko)}`
  );
  const footer = pageUrl ? `\n전체 브리핑: ${pageUrl}` : "";

  return [header, "", ...lines].join("\n") + footer;
}

module.exports = { truncate, formatDateKorean, escapeHtml, buildTelegramMessage };
