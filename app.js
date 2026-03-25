const fs = require("fs");

fetch("https://extension-one-psi.vercel.app/download-zip", {
  headers: { "x-api-key": "codxistop123" },
})
  .then((r) => r.arrayBuffer())
  .then((buf) => {
    fs.writeFileSync("update.zip", Buffer.from(buf));
    console.log("ZIP salvo:", buf.byteLength, "bytes");
  });
