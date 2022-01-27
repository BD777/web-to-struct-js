const { JSDOM } = require('jsdom')

function stringToElement(content) {
  const dom = new JSDOM(content)
  return dom.window.document
}

function css(content, kwargs) {
  let patterns = kwargs.patterns || []
  if (!(patterns instanceof Array)) patterns = [patterns]
  for (let pattern of patterns) {
    let value = Array.from(content.querySelectorAll(pattern))
    if (value.length === 1) return value[0]
    else if (value.length > 1) return value
  }
  return null
}

function index(content, kwargs) {
  let pattern = kwargs.pattern

  let keys = []
  let tmp = ''
  for (let c of pattern) {
    if (c === '.') {
      if (tmp.length > 0) {
        keys.push(tmp)
        tmp = ''
      }
    } else if (c === '[') {
      if (tmp.length > 0) {
        keys.push(tmp)
        tmp = ''
      }
    } else if (c === ']') {
      if (tmp.length > 0) {
        try {
          keys.push(parseInt(tmp))
        } catch (e) {
          keys.push(tmp)
        }
        tmp = ''
      }
    } else {
      tmp += c
    }
  }
  
  if (tmp.length > 0) keys.push(tmp)

  value = content
  for (let key of keys) {
    if (value instanceof Array) {
      if (typeof(key) === 'string') {
        throw new Error('int index is required for tuple, str found')
      }
      value = value[key]
    } else if (typeof(value) === 'object') {
      value = value[key]
    } else {
      throw new Error(`Object, Array accepted in function index, found ${typeof(value)}`)
    }
  }

  return value
}

function text(content, kwargs) {
  let strip = kwargs.strip
  if (strip === undefined) strip = true
  return strip ? content.textContent.trim() : content.textContent
}

function html(content) {
  return content.innerHTML
}

function attr(content, kwargs) {
  let attrName = kwargs.attrName
  return content.getAttribute(attrName)
}

function regex(content, kwargs) {
  let pattern = kwargs.pattern
  let reg = new RegExp(pattern, 'g')
  let value = []
  let array
  while ((array = reg.exec(content)) !== null) {
    if (array.length === 1) {
      value.push(array[0])
    } else if (array.length === 2) {
      value.push(array[1])
    } else if (array.length > 2) {
      let v = []
      for (let i = 1; i < array.length; ++i) {
        v.push(array[i])
      }
      value.push(v)
    }
  }
  if (value.length === 0) return null
  else if (value.length === 1) return value[0]
  else return value
}

function tupleToString(content, kwargs) {
  let value = kwargs.pattern
  for (let i = 0; i < content.length; ++i) {
    value = value.replace(new RegExp('$' + (i + 1), 'g'), content[i])
  }
  return value
}

function jsonParse(content) {
  return JSON.parse(content)
}


class Parser {
  constructor () {
    this.funcs = {}
    const builtinFunctions = [
      ["string-to-element", stringToElement],
      ["css", css],
      ["index", index],
      ["text", text],
      ["html", html],
      ["attr", attr],
      ["regex", regex],
      ["tuple-to-string", tupleToString],
      ["json-parse", jsonParse],
    ]

    for (let item of builtinFunctions) {
      this.register(item[0], item[1])
    }
  }

  register (name, func) {
    this.funcs[name] = func
  }

  parse (content, config) {
    let resp = {}

    const name = config.name
    let value = content
    for (let mapFunc of config.map) {
      if (!(mapFunc.function in this.funcs)) {
        throw new Error(`function ${mapFunc.function} not registered`)
      }

      let func = this.funcs[mapFunc.function]
      value = func(value, mapFunc.kwargs)
    }

    if ('children' in config && config.children.length > 0) {
      let children = config.children
      if (children.length == 1) {
        if (value instanceof Array) {
          resp[name] = []
          for (let v of value) {
            resp[name].push(this.parse(v, children[0]))
          }
        } else {
          resp[name] = this.parse(value, children[0])
        }
      } else {
        if (value instanceof Array) {
          resp[name] = []
          for (let v of value) {
            let obj = {}
            for (let child of children) {
              Object.assign(obj, this.parse(v, child))
            }
            resp[name].push(obj)
          }
        } else {
          let obj = {}
          for (let child of children) {
            Object.assign(obj, this.parse(value, child))
          }
          resp[name] = obj
        }
      }
    } else {
      function parseFinalValue(value) {
        const t = Object.prototype.toString.call(value)
        if (t.search('HTMLParagraphElement') !== -1) {
          return value.textContent.trim()
        } else if (t.search('HTMLAnchorElement') !== -1) {
          return value.textContent.trim()
        } else if (value instanceof Array) {
          return value.map(v => parseFinalValue(v))
        } else {
          return value
        }
      }

      resp[name] = parseFinalValue(value)
    }

    return resp
  }

}


module.exports = Parser