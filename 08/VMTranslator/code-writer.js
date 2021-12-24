function createJudgementString(judge, index) {
  const code = ['@SP', 'M = M-1', 'A=M', 'D=M', 'A = A-1', 'D = M-D',
    // 如果符合条件判断 则跳转到symbol1标记的地址
    '@TRUE'+index, 'D;' + judge, 
    '@SP', 'M = M-1', 'A=M', 'M=0', '@SP', 'M= M+1', 'CONTINUE'+index, '0; JMP'
    '(TRUE' + index + ')', '@SP', 'M = M-1', 'A=M', 'M=-1', '@SP', 'M = M+1','(CONTINUE' + index + ')'
  ].join('\r\n') + '\r\n'

  return code
}

const arithTypes =  ['add', 'sub', 'neg', 'eq', 'gt', 'lt', 'and', 'or', 'not']
function writeArithmetic(command) {
  let index = 0
  if (arithTypes.includes(command)) {
    let output
    switch (command) {
      case 'add':
        output = ['@SP', 'M = M-1', 'A = M', 'D = M', 'A = A-1', 'M = M+D'].join('\r\n') + '\r\n'
        break
      case 'sub':
        output = ['@SP', 'M = M-1', 'A = M', 'D = M', 'A = A-1', 'M = M-D'].join('\r\n') + '\r\n'
        break
      case 'neg':
        output = ['@SP', 'M = M-1', 'A = M', 'M = -M', '@SP', 'M = M+1'].join('\r\n') + '\r\n'
        break
      case 'eq':
        output = createJudgementString('JEQ', index++)
        break
      case 'gt':
        output = createJudgementString('JGT', index++)
        break
      case 'lt':
        output = createJudgementString('JLT', index++)
        break
      case 'and':
        output = ['@SP', 'M = M-1', 'A = M', 'D = M', 'A = A-1', 'M = M&D'].join('\r\n') + '\r\n'
        break
      case 'or':
        output = ['@SP', 'M = M-1', 'A = M', 'D = M', 'A = A-1', 'M = M|D'].join('\r\n') + '\r\n'
        break
      case 'not':
        output = ['@SP', 'M = M-1', 'A = M', 'M = !M', '@SP', 'M = M+1'].join('\r\n') + '\r\n'
        break
    }

    return output
  }
}
function arg1(command, type) {
  if (type == 'arith') {
    return command
  }
  else if (type !== 'return') {
    const cmdArray = command.split(' ').slice(1)
    let arg = cmdArray.shift()
    while (arg == ' ') {
      arg = cmdArray.shift()
    }
  }
}

const arg2Arry = ['push', 'pop', 'function', 'call']
function arg2(command, type) {
  if (arg2Arry.includes(type)) {
    return command.split(' ').pop()
  }
}

function processSegment(memType, memVal, type, fileName) {
  let output
  switch (memType) {
    case 'CONSTANT':
      output = ['@'+memVal, 'D=A', '@SP', 'A=M', 'M=D', '@SP', 'M = M+1'].join('\r\n')+'\r\n'
      break
    case 'STATIC':
      if (type == 'push') {
        output = ['@' + fileName + '.' + memVal, 'D=M', '@SP', 'A=M', 'M=D', '@SP', 'M = M+1'].join('\r\n')+'\r\n'
      }
      else {
        output = ['@SP', 'M = M-1', 'A=M', 'D=M',  '@' + fileName + '.' + memVal, 'M=D'].join('\r\n')+'\r\n'
      }
      break
    case 'POINTER':
      let transferMemType = ''
      if (memVal == 0) {
        transferMemType = 'THIS'
      }
      else if (memVal == 1) {
        transferMemType = 'THAT'  
      }
      
      if (type == 'push') {
        output = ['@' + transferMemType, 'D=M', '@SP', 'A=M', 'M=D', '@SP', 'M = M+1'].join('\r\n')+'\r\n'
      }
      else {
        output = ['@' + transferMemType, 'D=A', '@R13', 'M=D', '@SP', 'M = M-1', 'A=M', 
          'D=M', '@R13', 'A=M', 'M=D'].join('\r\n')+'\r\n'
      }
      break
    case 'TEMP':
      if (type == 'push') {
        output = ['@R5', 'D=A', '@' + memVal, 'A = D+A', 'D=M', '@SP', 'A=M', 'M=D', '@SP', 
          'M = M+1'].join('\r\n')+'\r\n'
      }
      else {
        output = ['@R5', 'D=A', '@' + memVal, 'D = D+A', '@R13', 'M=D', '@SP', 'M = M-1', 
          'A=M', 'D=M', '@R13', 'A=M', 'M=D'].join('\r\n')+'\r\n'
      }
      break
    case 'LOCAL':
      if (type == 'push') {
        output = ['@LCL', 'D=M', '@' + memVal, 'A = D+A', 'D=M', '@SP', 'A=M', 
          'M=D', '@SP', 'M = M+1'].join('\r\n')+'\r\n'
      }
      else {
        output = ['@LCL', 'D=M', '@' + memVal, 'D = D+A', '@R13', 'M=D', '@SP', 
          'M = M-1', 'A=M', 'D=M', '@R13', 'A=M', 'M=D'].join('\r\n')+'\r\n'
      }
      break
    case 'ARGUMENT':
      if (type == 'push') {
        output = ['@ARG', 'D=M', '@' + memVal, 'A = D+A', 'D=M', '@SP', 'A=M', 'M=D', 
          '@SP', 'M = M+1'].join('\r\n')+'\r\n'
      }
      else {
        output = ['@ARG', 'D=M', '@' + memVal, 'D = D+A', '@R13', 'M=D', '@SP', 'M = M-1', 
          'A=M', 'D=M', '@R13', 'A=M', 'M=D'].join('\r\n')+'\r\n'
      }
      break
    default:
      if (type == 'push') {
        output = ['@' + memType, 'D=M', '@' + memVal, 'A = D+A', 'D=M', '@SP', 'A=M', 
          'M=D', '@SP', 'M = M+1'].join('\r\n')+'\r\n'
      }
      else {
        output = ['@' + memType, 'D=M', '@' + memVal, 'D = D+A', '@R13', 'M=D', '@SP',
          'M = M-1', 'A=M', 'D=M', '@R13', 'A=M', 'M=D'].join('\r\n')+'\r\n'
      }
  }

  return output
}

function writePushPop(command, type, fileName) {
  const memType = arg1(command, type).toUpperCase()
  const memVal = arg2(command, type)

  return processSegment(memType, memVal, type, fileName)
}

function writeLabel(command) {
  const label = command.split(' ').pop()
  const output = '(' + label + ')\r\n'
  return output
}

function writeGoto(command) {
  const label = command.split(' ').pop()
  const output = '@' + label + '\r\n' + '0;JMP\r\n'
  return output
}

function writeIf(command) {
  const label = command.split(' ').pop()
  const output = ['@SP', 'M = M-1', 'A=M', 'D=M', '@'+label, 'D;JNE'].join('\r\n') + '\r\n'
  return output
}

function writeFunction(command, type) {
  const funcName = arg1(command).toUpperCase()
  const argNum = arg2(command, type)
  let output = '(' + funcName + ')\r\n'

  while (argNum--) {
    output += writePushPop('push constant 0', 'push')
  }

  return output
}

function writeCall(command, type) {
  const symbolFlag = Date.now();
  const funcName = arg1(command).toUpperCase()
  const argNum = arg2(command, type)
  let output = '@' + funcName + 'RETURN_ADDRESS' + symbolFlag + '\r\n'
                + ['D=A', 'SP', 'A=M', 'M=D', '@SP', 'M = M+1'].join('\r\n')+'\r\n'
  
  // 缓存当前栈帧状态变量
  const callArray = ['LCL', 'ARG', 'THIS', 'THAT']
  callArray.forEach(state => {
    output += ['@'+ state, 'D=M', '@SP', 'A=M', 'M=D','@SP', 'M= M+1'].join('\r\n')+'\r\n'
  })

  output += ['@'+argNum, 'D=A', '@5', 'D = D+M', '@SP', 'D=M-D', '@ARG', 'M=D', 
              '@SP', 'D=M', '@LCL', 'M=D', 
              '@'+funcName, '0;JMP', '@' + funcName + 'RETURN_ADDRESS' + symbolFlag].join('\r\n')+'\r\n'

  
  return output
}

function writeReturn(command) {

  let output = ['@LCL', 'D=M', '@R13', 'M=D', '@5', 'A= D-A', 'D=M',
                    '@R14', 'M=D', '@SP', 'M= M-1', 'A=M', 'D=M', '@ARG', 'M=A', 'M=D',
                    '@ARG', 'D = M+1', '@SP', 'D=M'].join('/r/n') + '\r\n'

  const replaceState = ''
  const pointerArry = ['THAT', 'THIS', 'ARG', 'LCL']
  pointerArry.forEach(symbol=> {
    restoreStates += '@R13\r\n'
         + 'D=M-1\r\n'
         + 'M=D\r\n'
         + 'A=M\r\n'
         + 'D=M\r\n'
         + '@' + symbol + '\r\n'
         + 'M=D\r\n'
  })

  output += pointerArry + '@R14\r\n' + 'A=M\r\n' + '0;JMP\r\n'

  return output
}

function writeInit() {
  let output = ['@256', 'D=A', '@SP', 'M=D'].join('\r\n') + '\r\n'
  output += writeCall('call Sys.init 0', 'call')
  return output
}

module.exports = {
  writePushPop,
  writeArithmetic,
  writeLabel,
  writeGoto,
  writeIf,
  writeFunction,
  writeCall,
  writeReturn,
  writeInit
}