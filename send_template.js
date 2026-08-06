const fs = require("fs");
const { loadConfig, refreshAccessToken, sendMemo } = require("./kakao.js");

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("사용법: node send_template.js <template.json>");
    process.exit(1);
  }

  const template = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const config = loadConfig();
  const accessToken = await refreshAccessToken(config);
  const result = await sendMemo(accessToken, template);
  console.log("전송 완료:", result);
}

main().catch((err) => {
  console.error("전송 실패:", err);
  process.exit(1);
});
