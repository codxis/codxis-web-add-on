// const fs = require("fs");

// fetch("https://codxis-web-add-on.vercel.app/download-zip", {
//   headers: { "x-api-key": "codxistop123" },
// })
//   .then((r) => r.arrayBuffer())
//   .then((buf) => {
//     fs.writeFileSync("update.zip", Buffer.from(buf));
//     console.log("ZIP salvo:", buf.byteLength, "bytes");
//   });

fetch(
  "https://iofeislqynfuerypxrpt.supabase.co/functions/v1/indicadores-api?limit=100",
  {
    headers: { "x-api-key": "codxistop123" },
  },
)
  .then((r) => r.json())
  .then((data) => {
    console.log("[DEBUG] app.js - indicadores carregados:", data);
  });
