const FormatPainter = {
  savedStyles: null,
  copied: false,
  buttonApi: null,

  init(editor) {
    const self = this

    editor.ui.registry.addButton('formatpainter', {
      icon: 'paste',
      tooltip: 'Format painter',
      onAction: () => self.toggleFormatPainter(editor),
      onSetup: (api) => {
        self.buttonApi = api
        return () => { self.buttonApi = null }
      }
    })

    editor.on('NodeChange', () => self.copied && !self.savedStyles && self.resetFormatPainter())
  },

  toggleFormatPainter(editor) {
    if (!this.copied) {
      this.savedStyles = this.getTextStyles(editor)
      if (!this.savedStyles) return

      this.copied = true
      editor.notificationManager.open({ text: 'Стили скопированы.', type: 'info', timeout: 2000 })
    } else {
      if (this.savedStyles) {
        this.resetTargetStyles(editor)
        this.applyStylesToSelection(editor, this.savedStyles)
      }
      this.resetFormatPainter()
    }
  },

  resetFormatPainter() {
    this.savedStyles = null
    this.copied = false
  },

  resetTargetStyles(editor) {
    editor.execCommand('RemoveFormat')
    
    editor.execCommand('forecolor', false, 'inherit')
    editor.execCommand('backcolor', false, 'inherit')

    editor.execCommand('FontName', false, 'inherit')
    editor.execCommand('FontSize', false, 'inherit')
  },

  getTextStyles(editor) {
    const range = editor.selection.getRng()
    if (range.collapsed) return this.getNodeStyles(editor.selection.getNode())

    const styles = {
      formats: new Set(),
      colors: { foreground: null, background: null },
      font: { family: null, size: null },
    }

    new RangeWalker(range).walk(node => {
      const nodeStyles = this.getNodeStyles(node)
      Object.entries(nodeStyles).forEach(([key, value]) => {
        if (value instanceof Set) {
          value.forEach(v => styles[key].add(v))
        } else if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (subValue) {
              styles[key][subKey] = subValue
            }
          })
        } else if (value) {
          styles[key] = value
        }
      })
    })

    return styles
  },

  getNodeStyles(node) {
    node.nodeType !== Node.ELEMENT_NODE && node.nodeType === Node.TEXT_NODE ? node = node.parentNode : node
    const formats = new Set()
    const style = window.getComputedStyle(node)
    const formatChecks = [
      {
        condition: style.fontWeight === 'bold' || style.fontWeight >= 700 || ['STRONG', 'B'].includes(node.nodeName), 
        format: 'bold'
      },
      {
        condition: style.fontStyle === 'italic' || ['EM', 'I'].includes(node.nodeName), 
        format: 'italic'
      },
      {
        condition: style.textDecoration.includes('underline'), 
        format: 'underline'
      },
      {
        condition: style.textDecoration.includes('line-through'), 
        format: 'strikethrough'
      }
    ]

    formatChecks.forEach(({ condition, format }) => {
      if (condition) formats.add(format)
    })
    return {
      formats,
      colors: {
        foreground: style.color,
        background: style.backgroundColor
      },
      font: {
        family: style.fontFamily,
        size: style.fontSize
      },
    }
  },
  
  applyStylesToSelection(editor, { formats, colors, font}) {
    ['bold', 'italic', 'underline', 'strikethrough'].forEach(format => 
      formats.has(format) ? editor.formatter.apply(format) : editor.formatter.remove(format)
    )

    if (colors.foreground && colors.foreground !== 'rgba(0, 0, 0, 0)') {
      editor.execCommand('forecolor', false, colors.foreground)
    }
    if (colors.background && colors.background !== 'rgba(0, 0, 0, 0)') {
      editor.execCommand('backcolor', false, colors.background)
    }

    if (font.family && font.family !== 'inherit') {
      editor.execCommand('FontName', false, font.family)
    }
    if (font.size && font.size !== 'inherit') {
      editor.execCommand('FontSize', false, font.size)
    }
  }
}

class RangeWalker {
  constructor(range) {
    this.range = range
  }
  walk(callback) {
    let node = this.range.startContainer
    const endNode = this.range.endContainer
    while (node && node !== endNode) {
      if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
        callback(node)
      }
      
      if (node.firstChild) {
        node = node.firstChild
      } else {
        while (node && !node.nextSibling && node !== endNode) {
          node = node.parentNode
        }
        if (node && node !== endNode) {
          node = node.nextSibling
        }
      }
    }

    if (node === endNode && node) {
      callback(node)
    }
  }
}

tinymce.PluginManager.add('formatpainter', (editor) => {
  const instance = Object.create(FormatPainter)
  instance.init(editor)
  return instance
})