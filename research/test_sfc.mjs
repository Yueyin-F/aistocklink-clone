import { parse, compileScript } from '@vue/compiler-sfc'

const plain = `<script>
export default { name: 'X', data: () => ({ a: 1 }) }
</script>
<template><div>{{ a }}</div></template>`

const setup = `<script setup>
import { ref } from 'vue'
const a = ref(1)
</script>
<template><div>{{ a }}</div></template>`

for (const [name, src] of [['plain', plain], ['setup', setup]]) {
  const { descriptor } = parse(src, { filename: name + '.vue' })
  const res = compileScript(descriptor, { id: 'data-v-test' })
  console.log('===== ' + name + ' =====')
  console.log(res.content.slice(0, 600))
  console.log('--- bindings:', JSON.stringify(res.bindings || {}))
}
