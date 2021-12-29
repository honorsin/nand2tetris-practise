const fs = require('fs')
const SymbolTable = require('./symbolTable')
const VMWriter = require('./VMWriter')

const ifTrueLabel = 'IF_TRUE'
const ifFalseLabel = 'IF_FALSE'
const ifEndLabel = 'IF_END'

const whileLabel = 'WHILE_EXP'
const whileEndLabel = 'WHILE_END'

// if
let ifIndex = 0
// while
let whileIndex = 0

let variableOfCall = ''

const opObj = {
  '+': 'add',
  '-': 'sub',
  '&amp;': 'and',
  '|': 'or',
  '&lt;': 'lt',
  '&gt;': 'gt',
  '=': 'eq',
  '/': 'call Math.divide 2',
  '*': 'call Math.multiply 2'
}
class CompilationEngine{
  constructor(tokens, fileName) {
    this.fileName = fileName
    // 类名
    this.class = ''

    this.outputPath = fileName + '.xml'
    this.rawFile = fileName + '.jack'
    this.tokens = tokens
    this.len = tokens.length
    // index
    this.i = -1

    // 当前key
    this.key = ''
    // 当前val
    this.val = ''

    this._init()

    this.mainTable = new SymbolTable()
    this.subTable = new SymbolTable()
    this.vm = new VMWriter(this.fileName)
  }

  _getTypeOfVariable(name) {
    let type = subTable.typeOf(name)
    if (type == 'none') {
        type = mainTable.typeOf(name)
        if (type == 'none') {
            return [name, false]
        } else {
            return [type, true]
        }
    } else {
        return [type, true]
    }
  }

  _getNextToken() {
    this.i++
    let obj = this.tokens[this.i]
    let key = Object.keys(obj)[0]
    let val = obj[key]

    this.key = key
    this.val = val
    this.line = obj.line
  }

  _error(key, val, type) {
    let error = 'line:' + this.tokens[this.i].line + ' syntax error: {' + this.key + ': ' + this.val 
              + '}\r\nExpect the type of key to be ' + type + '\r\nat ' + this.rawFile
    throw error
  }

  _compileClassVarDec() {
    let type, kind
    kind = this.val

    this._getNextToken()

    if (key == 'keyword' || key == 'identifier') {

      type = this.val
      this._getNextToken()

      if (this.key !== 'identifier') {
          this._error('identifier')
      }

      while (this.key == 'identifier') {
        
        mainTable.define(this.val, type, kind)
        this._getNextToken()

        if (val == ';') {
            break
        } else if (val == ',') {
            this._getNextToken()
        } else {
            this._error(',|;')
        }
      }    
    }
    else {
      this._error('keyword | identifier')
    }
  }

  _compileParameterList(isMethod) {
    let type
    this._getNextToken()

    if (this.val !== ')') {
      if (this.key !== 'keyword' && this.key !== 'identifier') {
        this._error('keyword | identifier')
      } 
      else {
        if (isMethod) {
          subTable.define('this', 'object', 'argument')
        }

        while (this.key == 'keyword' || this.key == 'identifier') {

          type = this.val
          this._getNextToken()

          if (this.key == 'identifier') {

              subTable.define(this.val, type, 'argument')
              this._getNextToken()

              if (val == ',') {
                  temp = this._getNextToken()
              }
          } else {
              this._error('identifier')
          }
        }
      }      
    }

    this.i--
  }

  _compileVarDec(localNum) {
    let type
        
    this._getNextToken()

    if (this.key == 'keyword' || this.key == 'identifier') {
      type = this.val
      this._getNextToken()

      if (this.key !== 'identifier') {
          this._error('identifier')
      }

      while (this.key == 'identifier') {
        subTable.define(this.val, type, 'local')
        localNum++

        this._getNextToken()
        if (this.val == ',') {
            this._getNextToken()
        } else if (this.val == ';') {
            break
        } else {
            this._error(', | ;')
        }
      }
    }
    else {
      this._error(key, val, 'keyword | identifier')
    }

    this._getNextToken()

    if (val == 'var') {
      localNum = this._compileVarDec(localNum)
    } 
    else {
      this.i--
    }

    return localNum
  }

  _compileElse() {
    this._getNextToken()

    if (val == '{') {

      this._getNextToken()
      this._compileStatements(key, val, line)
      this._getNextToken()

      if (val !== '}') {
        this._error(key, val, '}')
      }      
    }
    else {
      this._error('{')
    }   
  }

  _compileIf() {
    let tempIndex = ifIndex++
    this._getNextToken()

    if (this.val == '(') {
      this._compileExpression()

      this._getNextToken()

      if (this.val == ')') {
        this._getNextToken()
        vm.writeIf(ifTrueLabel + tempIndex)
        vm.writeGoto(ifFalseLabel + tempIndex)
          
        if (this.val == '{') {

          this._getNextToken()
          vm.writeLabel(ifTrueLabel + tempIndex)

          this._compileStatements(key, val, line)
          this._getNextToken()
          
          if (this.val == '}') {

            this._getNextToken()

            if (this.val == 'else') {
              vm.writeGoto(ifEndLabel + tempIndex)
              vm.writeLabel(ifFalseLabel + tempIndex)
              this._compileElse()
              vm.writeLabel(ifEndLabel + tempIndex)
            } 
            else {
              vm.writeLabel(ifFalseLabel + tempIndex)
              this.i--
            }            
          }
          else {
            this._error('}')
          }         
        }        
      }
      else {
        this._error(')')
      }
    }
    else {
      this._error('(')
    }
  }

  _compileWhile() {
    let tempIndex = whileIndex++

    this._getNextToken()
    vm.writeLabel(whileLabel + tempIndex)
    if (this.val == '(') {
        this._compileExpression()
        vm.writeArithmetic('not')
        vm.writeIf(whileEndLabel + tempIndex)

        this._getNextToken()
        if (this.val == ')') {
            this._getNextToken()
            if (this.val == '{') {            
                this._getNextToken()
                this._compileStatements()
                this._getNextToken()
                vm.writeGoto(whileLabel + tempIndex)
                vm.writeLabel(whileEndLabel + tempIndex)

                if (this.val != '}') {
                    this._error('}')
                }
            } else {
                this._error('{')
            }
        } else {
            this._error(')')
        }
    } else {
        this._error('(')
    }
  }

  _compileExpressionList() {
    let nArgs = 0
    this._getNextToken()
    if (this.val == ')' || this.val == ',') {
      this.i--
    }
    else {
      this.i--
      while (true) {
        nArgs++
        this._compileExpression()
        this._getNextToken()
        if (this.val == ')') {
            this.i--
            break
        }
      }
    }

    return nArgs
  }

  _compilePartOfCall(funcName, isMethod) {
    let nArgs
    if (this.val == '(') {

      if (isMethod) {
        nArgs++
        if (variableOfCall) {
            this._writeVariable(variableOfCall)
            variableOfCall = ''
        } else {
            vm.writePush('pointer', 0)
        }
      }     
      nArgs = this._compileExpressionList()

      if (isMethod) {
        nArgs++
      }

      this._getNextToken()
      if (this.val !== ')')  {
          this._error(key, val, ')')
      }
    } 
    else if (this.val == '.') {
      funcName += this.val
      this._getNextToken()

      if (this.key == 'identifier') {

        funcName += this.val
        this._getNextToken()
        if (val == '(') {
          
          if (isMethod) {
            nArgs++
            if (variableOfCall) {
              this._writeVariable(variableOfCall)
              variableOfCall = ''
            }
            else {
              vm.writePush('pointer', 0)
            }
          }

          if (isMethod) {
            nArgs++
          }
          
          this._getNextToken()          
          nArgs = this._compileExpressionList()

          if (this.val !== ')') {
              this._error(')')
          }
        }
        else {
          this._error('(')
        }
      }
      else {
        this._error('identifier')
      }
    }
    else {
      this._error('( | .')
    }
  }

  _compileDo(key, val) {
    let funcTempArry 
    let funcName = ''
    let isMethod
        
    this._getNextToken()

    if (this.key == 'identifier') {
      funcTempArry = this._getTypeOfVariable(this.val)

      if (funcTempArry[1]) {
        isMethod = true
        funcName += funcTempArry[0]
        variableOfCall = this.val
      } else {
        funcName += this.val
      }

      this._getNextToken()
      if (this.val == '.') {
        this._compilePartOfCall(key, val)
      }
      else if (this.val == '(') {
        isMethod = true
        funcName = this.class + '.' + funcName
        this._compilePartOfCall(funcName, isMethod)
      } 
      else {
        this._error('. | )')
      }

      this._getNextToken()
      if (val == ';') {
        this._error(';')
      } 
    }
    else {
      this._error('identifier')
    }

  }

  _compileReturn(key, val) {

    this._getNextToken()

    if (this.val == ';') {
      vm.writePush('constant', 0)
      vm.writeReturn()
    }
    else {
      this.i--
      this._compileExpression()
      this._getNextToken()

      if (this.val == ';') {
        vm.writeReturn()
      } 
      else {
        this._error(key, val, ';')
      }      
    }
    
  }

  _compileTerm() {
    let tempName
    let isMethod
    let funcName = ''
    this._getNextToken() 
        
    if (this.key == 'identifier') {
      tempName = this.val
      this._getNextToken()

      switch (this.val) {
        case '(':
          isMethod = true
          funcName = this.class + '.' + tempName
          this._compilePartOfCall(funcName, isMethod)
          break
        case '.':
          let funcTempArry = this._getTypeOfVariable(tempName)
          if (funcTempArry[1]) {
            isMethod = true
            funcName += funcTempArry[0]
            variableOfCall = tempName
          } 
          else {
              funcName += tempName
          }
          this._compilePartOfCall(funcName, isMethod)
          break
        case '[':
          this._compileExpression()
          this._getNextToken()
          
          if (val == ']') {                       
            this._writeVariable(tempName)
            vm.writeArithmetic('add')
            vm.writePop('pointer', 1)
            vm.writePush('that', 0)
          } 
          else {
              this._error(key, val, ']')
          }
          break
        default:
          this.i--
      }      
    }
    else if (key == 'integerConstant') {
      vm.writePush('constant', this.val)
    } 
    else if (key == 'stringConstant') {
      let strArry = [...this.val]
      let length = strArry.length
      let code

      vm.writePush('constant', length)
      vm.writeCall('String.new', 1)
      strArry.forEach(s => {
          code = s.charCodeAt()
          vm.writePush('constant', code)
          vm.writeCall('String.appendChar', 2)
      })
    } 
    else {
      switch (this.val) {               
         case '(':
            this._compileExpression()
            this._getNextToken()

            if (this.val !== ')') {
                this._error(')')
            }
            break
        case '-':
            this._compileTerm()
            vm.writeArithMetic('neg')
            break
        case '~':
            this._compileTerm()
            vm.writeArithMetic('not')
            break
        case 'null':
        case 'false':
            vm.writePush('constant', 0)
            break
        case 'true':
            vm.writePush('constant', 0)
            vm.writeArithMetic('not')
            break
        case 'this':
            vm.writePush('pointer', 0)
            break
        default:
            this._error('Unknown symbol')
      }
    }
  }

  _compileExpression() {
    this._compileTerm()

    let op

    while (true) {
        this._getNextToken()

        if (opObj[this.val] !== undefined) {
            op = opObj[this.val]
            this._compileTerm()
            vm.writeArithMetic(op)
        } else {
            this.i--
            break
        }
    }
  }

  _compileLet(key, val) {
    let variable = ''

    this._getNextToken()

    if (this.key == 'identifier') {
      variable += this.val
   
      this._getNextToken()
      if (val == '[') {
        this._compileExpression()
        this._getNextToken()

        if (val == ']') {
            this._getNextToken()
            this._writeVariable(variable)
            if (val == '=') {
                this._compileExpression()

                vm.writePop('temp', 0)
                vm.writePop('pointer', 1)
                vm.writePush('temp', 0)
                vm.writePop('that', 0)
            } 
            else {
                this._error(key, val, '=')
            }
        } 
        else {
            this._error(key, val, ']')
        }
      }
      else if (this.val == '=') {
        this._compileExpression()

        this._writeVariable(variable, true)
      }
      else {
        this._error('[ | =')
      }

      this._getNextToken()
      if (this.val != ';') {
          this._error(';')
      }
    }
    else {
      this._error('identifier')
    }
  }

  _compileStatements() {

    while (this.val !== '}') {
      switch (this.val) {
        case 'if':
            this._compileIf()
            break
        case 'while':
            this._compileWhile()
            break
        case 'do':
            this._compileDo()
            break
        case 'return':
            this._compileReturn()
            break
        case 'let':
            this._compileLet()
            break
        default:
            this._error(, 'if | while | do | return | let')
      }

      this._getNextToken()
    }

    this.i--
  }

  _compileSubroutineBody(funcName, isCtr, isMethod) {

    let localNum = 0    
    this._getNextToken()

    while (true) {
      if (val == 'var') {
        localNum = this._compileVarDec(localNum)
      }
      else {
        vm.writeFunction(funcName, localNum)

        if (isCtr) {
          let fieldNum = mainTable.varCount('field')
          vm.writePush('constant', fieldNum)
          vm.writeCall('Memory.alloc', 1)
          vm.writePop('pointer', 0)
        }
        else if (isMethod) {
          vm.writePush('argument', 0)
          vm.writePop('pointer', 0)
        }

        this._compileStatements()

      }

      this._getNextToken()

      if (this.val == '}') {
        break
      } 
      else {
        switch (this.val) {
            case 'if':
            case 'while':
            case 'do':
            case 'return':
            case 'let':
            case 'var':
                break
        }
      }
    }
  }

  _compileSubroutine(isCtr, isMethod) {
    let funcName = ''     
    this._getNextToken()

    if (this.key == 'identifier' || this.key == 'keyword') {
      if (isCtr) {
          funcName += this.val
      }

      this._getNextToken()
      if (this.key == 'identifier') {
          if (isCtr) {
              funcName += '.' + this.val
          } else {
              // 函数名
              funcName = this.class + '.' + this.val
          }

          this._getNextToken()
      } 
      else {
          this._error('identifier')
      }
    } 
    else {
        this._error('identifier | keyword')
    }

    if (val == '(') {
      this._compileParameterList()
      this._getNextToken()

      if (val == ')') {
        this._getNextToken()

        if (val == '{') {
            this._compileSubroutineBody(funcName, isCtr, isMethod)
        } else {
            this._error('{')
        }
      }
      else {
        this._error(')')
      }  
    }
    else {
      this._error('(')
    }
  }

  _compileClass() {
    const tokens = this.tokens  
    this._getNextToken()

    if (this.val == 'class') {
      this._getNextToken()

      if (this.key == 'identifier') {
        this.class = this.val
        this._getNextToken()

        if (this.val == '{') {

          while (this.i < this.len) {
            this._getNextToken()

            if (this.val == '}') {
                break
            }

            switch (this.val) {
                case 'static':
                case 'field':
                    this._compileClassVarDec()
                    break
                case 'constructor':
                case 'function':
                case 'method':
                  let isCtr, isMethod

                  if (this.val == 'constructor') {
                      isCtr = true
                      isMethod = false
                  } else if (this.val == 'method') {
                      isCtr = false
                      isMethod = true
                  } else {
                      isMethod = false
                      isCtr = false
                  }

                  subTable.reset()
                  this._compileSubroutine(isCtr, isMethod)
                  break
                default:
                    this._error('static | field | constructor | function | method')
            }
          }
        }
        else {
          this._error('{')
        }
      }
      else {
        this._error('idendifier')
      }
    }
    else {
      this._error('class')
    }
  }

  _init() {
    this._compileClass()
    vm.createVMFile()    
  }
}

module.exports = CompilationEngine
