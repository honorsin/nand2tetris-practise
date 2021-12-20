const code = require("./codeMap");
const { dest, comp, jump } = code;

const table = require("./symbol-table");
const { addEntry, contains, getAddress } = table;
let { ramAddress } = table;

let pc = -1;

function parser(codes, initLoad) {
  return advance(codes, initLoad);
}

function hasMoreCommands(codes) {
  return codes.length > 0;
}

// 提取@xxx 或 (xxx) 中的xxx
const reg1 = /^\((.+)\)$/;
function symbol(instruction, type) {
  if (type === "A") {
    return instruction.substr(1);
  } else if (type === "L") {
    return instruction.replace(reg1, "$1");
  }
}
// 匹配以注释开头的句子
const reg2 = /^(\/\/)/;
function isInstructionInvalid(instructions) {
  if (instruction == "" || reg2.test(instruction)) {
    return true;
  }

  return false;
}

// 返回指令类型
function commandType(instruction) {
  if (instruction.charAt(0) === "@") {
    return "A";
  } else if (instruction.charAt(0) === "(") {
    return "L";
  } else {
    return "C";
  }
}
// 将十进制数转为二进制指令
function int2Binary(num) {
  let str = parseInt(num).toString(2);

  while (str.length !== 16) {
    str = "0" + str;
  }

  return str;
}
// 正则匹配指令中的注释
const reg3 = /(\/\/).+/;
function advance(codes, initLoad) {
  let current;
  let type;
  let binaryOut = "";

  while (hasMoreCommands(codes)) {
    // 非有效行直接跳过
    current = codes.shift().trim();

    if (isInstructionInvalid(current)) {
      continue;
    }

    //  如果指令右边有注释 则删除
    current = current.replace(reg3, "").trim();
    type = commandType(current);

    switch (type) {
      case "C":
        if (!initLoad) {
          const d = dest(current);
          const c = comp(current);
          const j = jump(current);
          binaryOut += "111" + c + d + j + "\r\n";
        } else {
          pc++;
        }
        break;
      case "A":
        if (!initLoad) {
          const token = symbol(current, type);
          let binary;
          if (isNaN(parseInt(token))) {
            if (contains(token)) {
              binary = int2Binary(getAddress(token));
            } else {
              binary = int2Binary(ramAddress);
              addEntry(token, ramAddress++);
            }
          } else {
            binary = int2Binary(token);
          }
          binaryOut += binary + "\r\n";
        } else {
          pc++;
        }
        break;
      case "L":
        if (initLoad) {
          const token = symbol(current, type);
          addEntry(token, pc + 1);
        }
        break;
    }
  }

  return binaryOut;
}
module.exports = parser;
