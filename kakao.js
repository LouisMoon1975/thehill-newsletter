const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "kakao_config.json");

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf8");
}

async function refreshAccessToken(config) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.rest_api_key,
    client_secret: config.client_secret,
    refresh_token: config.refresh_token,
  });

  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Kakao token refresh failed: ${JSON.stringify(data)}`);
  }

  config.access_token = data.access_token;
  if (data.refresh_token) config.refresh_token = data.refresh_token;
  saveConfig(config);

  return config.access_token;
}

async function sendMemo(accessToken, templateObject) {
  const body = new URLSearchParams({
    template_object: JSON.stringify(templateObject),
  });

  const res = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await res.json();
  if (!res.ok || data.result_code !== 0) {
    throw new Error(`Kakao send failed: ${JSON.stringify(data)}`);
  }
  return data;
}

module.exports = { loadConfig, saveConfig, refreshAccessToken, sendMemo };
