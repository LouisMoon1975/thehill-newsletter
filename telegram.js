const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "telegram_config.json");

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

async function sendMessage(config, text) {
  const body = new URLSearchParams({
    chat_id: config.chat_id,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: "false",
  });

  const res = await fetch(`https://api.telegram.org/bot${config.bot_token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram send failed: ${JSON.stringify(data)}`);
  }
  return data;
}

module.exports = { loadConfig, sendMessage };
