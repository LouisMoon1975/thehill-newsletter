const fs = require("fs");
const { loadConfig, sendMessage } = require("./telegram.js");

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("사용법: node send_telegram.js <message.txt>");
    process.exit(1);
  }

  const text = fs.readFileSync(filePath, "utf8");
  const config = loadConfig();
  const result = await sendMessage(config, text);
  console.log("전송 완료:", result.result.message_id);
}

main().catch((err) => {
  console.error("전송 실패:", err);
  process.exit(1);
});
