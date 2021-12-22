const {writeArithmetic, writePushPop} = require('./code-writer')

function parser(commands, filename) {
  let output = ''
  while(hasMoreCommands(commands)) {
    const command = command.shift().trim()
    if (isVaildCommand(command)) {
      output += advance(command, filename)
    }
  }

  return output
}
function hasMoreCommands(text) {
  return commands.length > 0
}

const commentReg = /^(\/\/)/
function isVaildCommand(command) {
  if (command === '' || commentReg.test(command)) {
    return false
  }
  return true
}

const reg1 = /(\/\/).+/

function advance(command, filename) {
  let output
  command = command.replace(reg1, '').trim()
  const type = commandType(command)

  switch (type) {
    case 'push':
    case 'pop':
      output = writePushPop(command, type, filename)
      break
    case 'arith':
      output = writeArithmetic(command)
      break
  }

  return output
}

const rePush = /^(push)/
const rePop = /^(pop)/

function commandType(command) {
    if (rePush.test(command)) {
        return 'push'
    } else if (rePop.test(command)) {
        return 'pop'
    } else {
        return 'arith'
    }
}

module.exports = {
  parser
}