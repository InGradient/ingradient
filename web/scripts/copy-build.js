const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");

const src = path.join(__dirname, "..", "out");
const dst = path.join(__dirname, "..", "..", "ingradient_sdk", "static");

(async () => {
  try {
    console.log("🛠️ Copying export output to ingradient_sdk/static...");
    await fse.remove(dst);
    await fse.copy(src, dst);
    console.log("✅ Export copied to ingradient_sdk/static");
  } catch (err) {
    console.error("❌ Failed to copy export output:", err);
    process.exit(1);
  }
})();
