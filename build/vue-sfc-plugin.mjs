// 自定义 Vue SFC 编译插件（基于 @vue/compiler-sfc，纯 JS 无子进程）
import { parse, compileScript, compileTemplate, compileStyle } from '@vue/compiler-sfc'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const cssFiles = new Map() // 非 .vue 的 css 导入 → 空模块

export function hashId(filename) {
  return 'data-v-' + createHash('sha256').update(filename).digest('hex').slice(0, 8)
}

export default function vueSfc() {
  return {
    name: 'vue-sfc',
    resolveId(source, importer) {
      if (source.endsWith('.vue')) {
        if (source.startsWith('.') && importer) {
          return path.resolve(path.dirname(importer), source)
        }
        return source
      }
      if (source.endsWith('.css')) {
        cssFiles.set(source, importer || '')
        if (source.startsWith('.') && importer) {
          return path.resolve(path.dirname(importer), source)
        }
        return source
      }
      return null
    },
    load(id) {
      if (id.endsWith('.css')) return ''
      if (!id.endsWith('.vue')) return null
      const src = fs.readFileSync(id, 'utf8')
      const { descriptor, errors } = parse(src, { filename: id })
      if (errors && errors.length) throw errors[0]

      const scopeId = hashId(id)
      const scoped = descriptor.styles.some((s) => s.scoped)

      // script
      let scriptCode = ''
      let bindings = {}
      if (descriptor.script || descriptor.scriptSetup) {
        const script = compileScript(descriptor, { id: scopeId })
        scriptCode = script.content
        bindings = script.bindings || {}
      } else {
        scriptCode = 'const __sfc__ = {}'
      }
      // 将 export default 转为 const __sfc__
      scriptCode = scriptCode.replace('export default', 'const __sfc__ =')

      // template
      if (descriptor.template) {
        const tpl = compileTemplate({
          id: scopeId,
          filename: id,
          source: descriptor.template.content,
          scoped,
          compilerOptions: {
            scopeId: scoped ? scopeId : undefined,
            bindingMetadata: bindings,
          },
        })
        if (tpl.errors && tpl.errors.length) throw tpl.errors[0]
        scriptCode += '\n' + tpl.code + '\n__sfc__.render = render'
        if (scoped) scriptCode += '\n__sfc__.__scopeId = ' + JSON.stringify(scopeId)
      }

      // styles
      const styleCodes = []
      for (const style of descriptor.styles) {
        const res = compileStyle({
          source: style.content,
          filename: id,
          id: scopeId,
          scoped: style.scoped,
        })
        if (res.errors && res.errors.length) throw res.errors[0]
        styleCodes.push(res.code)
      }
      if (styleCodes.length) {
        scriptCode +=
          '\n;(function(){ if (typeof document !== "undefined") { var s=document.createElement("style"); s.setAttribute("data-v-id",' +
          JSON.stringify(scopeId) +
          '); s.textContent=' +
          JSON.stringify(styleCodes.join('\n')) +
          '; (document.head||document.documentElement).appendChild(s); } })();'
      }

      scriptCode += '\nexport default __sfc__'
      return scriptCode
    },
  }
}
