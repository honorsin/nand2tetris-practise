const fs = require("fs");
const parser = require("./parser");

let fileName = process.argv[2];

fs.readFile(fileName, "utf-8", (err, data) => {
  if (err) {
    throw err;
  }

  // 按行分割
  data = data.split("\r\n");

  // 首次parse,收集symbol
  parser([...data], true);

  // 真正的解析
  const binaryOut = parser(data);

  fileName = fileName.split(".")[0];

  fs.writeFile(fileName, binaryOut, (err) => {
    if (err) {
      throw err;
    }
  });
});
