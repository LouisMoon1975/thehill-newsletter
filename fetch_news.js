const RSS_URL = "https://thehill.com/feed/";

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  if (!m) return "";
  let val = m[1].trim();
  const cdata = val.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  if (cdata) val = cdata[1].trim();
  return val
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchNews(limit = 8) {
  const res = await fetch(RSS_URL);
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

  const parsed = items.map((block) => {
    const enclosure = block.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image\/[^"]*"/);
    return {
      title: extractTag(block, "title"),
      link: extractTag(block, "link"),
      description: extractTag(block, "description"),
      category: extractTag(block, "category"),
      pubDate: extractTag(block, "pubDate"),
      image: enclosure ? enclosure[1] : null,
    };
  });

  return parsed
    .filter((item) => !/newsletter/i.test(item.category))
    .slice(0, limit);
}

module.exports = { fetchNews };

if (require.main === module) {
  const limit = parseInt(process.argv[2], 10) || 8;
  fetchNews(limit).then((items) => console.log(JSON.stringify(items, null, 2)));
}
