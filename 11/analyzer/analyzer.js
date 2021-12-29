const fs = require('fs')
const JackTokenizer = require('./tokenizer.js')
const CompilationEngine = require('./compilationEngine.js')

const fileName = process.argv[2]
const isDirectory = fs.lstatSync(fileName).isDirectory()

function processFileData(vmcode, fileName) {
  data = data.split(/\r\n|\n/)
  const jackTokenizer = new JackTokenizer(data, path)
  jackTokenizer._init()
  const tokens = jackTokenizer.getTokens()
  const compliedCode = new CompilationEngine(tokens, path)
}

function setFileName(outname, vmcode) {
  fs.writeFile(outName + '.vm', vmcode, (err) => {
    if (err) {
        throw err
    }
  })
}

function compile () {
  let vmCode = ''

  let outFileName
  
  if (isDirectory) {
    outFileName = fileName
    fs.readdir(fileName, (err, files) => {
      if (err) throw err
  
      // 循环处理目录中的文件
      files.forEach(file => {
        let tempArry = file.split('.')
        if (tempArry.pop() == 'jack') {
            let preName = tempArry.join('.')
            let data = fs.readFileSync(`${fileName}/${file}`, 'utf-8')
            processFileData(data, preName)
        } 
      })
  
    })
  }
  else {
    // 处理类似a.b.c这种格式的文件 保留a.b
    const nameArray = fileName.split('.')
    nameArray.pop()
    const outName = nameArray.join('.')
  
    // 读取jack文件
    const vmcode = fs.readFileSync(outName, 'utf-8')
    processFileData(vmcode, fileName)
  }
}

compile()
