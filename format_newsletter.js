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

// items: [{ title, description, link }] — 이미 번역/요약된 한글 텍스트를 넣는다.
function buildKoreanListTemplate(items, { maxItems = 3 } = {}) {
  const top = items.slice(0, maxItems);

  return {
    object_type: "list",
    header_title: `${formatDateKorean()} The Hill 주요 뉴스`,
    header_link: {
      web_url: "https://thehill.com",
      mobile_web_url: "https://thehill.com",
    },
    contents: top.map((item) => ({
      title: truncate(item.title, 45),
      description: truncate(item.description, 70),
      link: {
        web_url: item.link,
        mobile_web_url: item.link,
      },
    })),
    button_title: "더 보기",
  };
}

module.exports = { buildKoreanListTemplate, truncate, formatDateKorean };
