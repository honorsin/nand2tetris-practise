const fs = require('fs')
const { parser } = require('./parser')

const fileName = process.argv[2]

let asmCode = ''

let outFileName

// 处理类似a.b.c这种格式的文件 保留a.b
const nameArray = fileName.split('.')
nameArray.pop()
const outName = nameArray.join('.')

function processFileData(vmcode, fileName) {
  data = data.split('\r\n')
  asmcode += parser(data, fileName)
}

function setFileName() {
  fs.writeFile(outName + '.asm', asmcode, (err) => {
    if (err) {
        throw err
    }
  })
}
const vmcode = fs.readFileSync(outName, 'utf-8')
processFileData(vmcode, fileName)
setFileName()