const table = {};
let ramAddress = 16;

table.SP = 0;
table.LCL = 1;
table.ARG = 2;
table.THIS = 3;
table.THAT = 4;
table.SCREEN = 16384;
table.KBD = 24576;

let num = 16;
let key;
while (num--) {
  key = `E${num}`;
  table[key] = num;
}

function addEntry(symbol, address) {
  table[symbol] = address;
}

function contains(symbol) {
  return table[symbol] !== undefined;
}

function getAddress(symbol) {
  return table[symbol];
}

module.exports = {
  table,
  ramAddress,
  addEntry,
  contains,
  getAddress,
};
