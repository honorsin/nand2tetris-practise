const fs = require('fs')
const { parser } = require('./parser')
const {writeInit} = require('./code-writer')

const fileName = process.argv[2]
const isDirectory = fs.lstatSync(fileName).isDirectory()

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

let asmCode = ''

let outFileName

if (isDirectory) {
  outFileName = fileName
  fs.readdir(fileName, (err, files) => {
    if (err) throw err

    if (files.includes('Sys.vm')) {
      asmcode += writeInit()
    }

    // 循环处理目录中的文件
    files.forEach(file => {
      let tempArry = file.split('.')
      if (tempArry.pop() == 'vm') {
          let preName = tempArry.join('.')
          let data = fs.readFileSync(`${fileName}/${file}`, 'utf-8')
          processFileData(data, preName)
      } 
    })

    setFileName()    
  })
}
else {
  // 处理类似a.b.c这种格式的文件 保留a.b
  const nameArray = fileName.split('.')
  nameArray.pop()
  const outName = nameArray.join('.')

  // 读取vm文件
  const vmcode = fs.readFileSync(outName, 'utf-8')
  processFileData(vmcode, fileName)
  // 写入asm文件
  setFileName()
}