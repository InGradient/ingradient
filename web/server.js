const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// 환경 변수에서 HOST 가져오기 (기본: 127.0.0.1)
const host = process.env.HOST || "127.0.0.1";
const port = 8000;

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, host, (err) => {
    if (err) throw err;
    console.log(`Ingradient is running on http://${host}:${port}`);
  });
});
