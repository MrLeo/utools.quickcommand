// https://github.com/baiy/Ctool/blob/master/src/config.js#L89
// https://github.com/inRush/utools/blob/master/jsonEditor/public/plugin.json#L31

////////////////////////////////////////////////////////
// {
//     "total": 0,
//     "list": [],
//     "@comment": {
//         "total": "/**\n     * 总数\n     */",
//         "list": "/**\n     * 列表\n     */"
//     }
// }
// ↑↑↑↑↑↑↑ 转换前 ↑↑↑↑↑↑↑
//
// ↓↓↓↓↓↓↓ 转换后 ↓↓↓↓↓↓↓
// export interface Root {
// 	/** 总数 */
// 	total: number;
// 	/** 列表 */
// 	list: any[];
// }
////////////////////////////////////////////////////////

// [
//     {
//         "type": "regex",
//         "label": "Java 实体 JSON 转 TS 类型定义",
//         "match": "/(^\\d{10}(?:\\d{3})?$)|(^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?$)/i",
//         "minLength": 10,
//         "maxLength": 25
//     },
//     {
//         "type": "regex",
//         "label": "Java 实体 JSON 转 TS 类型定义",
//         "match": "/^(?={)[\\s\\S]*(?<=})[\\r]*[\\n]*|^(?=\\[)[\\s\\S]*(?<=\\])[\\r]*[\\n]*/i",
//         "minLength": 2
//     }
// ]

(async () => {
  const clipText = quickcommand.readClipboard()
  console.log("后端 JSON Comment", clipText)

  let jsonArr = clipText.match(/.*/g).map((item) => item.replace(/^\@+/, ""))
  let index = jsonArr.length
  while (index >= 0) {
    const current = jsonArr[index] || ''
    if (/"[^"]*": "\/\*\*.*\*\/"/.test(current) && !/@comment/.test(current)) {
      let [_matchString, prefix, key, comment, suffix] = current.match(/  (.*)"([^"]*)": "(\/\*\*.*\*\/)"(.*)/) || ['', '', '', '', '']
      // console.log(`[LOG] ->  space, key, comment`,  space, key, comment)

      // const commentLine = `${prefix}"${key}@comment": "${comment}",`
      const commentLine = `${prefix}${comment}`

      jsonArr[index] = ''

      let index2 = index
      while (index2 >= 0) {
        if (new RegExp(`"${key}":`).test(jsonArr[index2] || '')) {
          jsonArr.splice(index2-1, 0, commentLine)
          break
        }
        index2--
      }
    }
    index--
  }

  let jsonStr = jsonArr
    .filter((item) => !(/^\s*$/.test(item)))
    .join('\n')
    .replace(/,\n\s*"\@comment":\s*\{\s*\n\s*\}\s*/ig, '')
    .replace(/\\n/g,'\n')
  // console.log('生成JSONC字符串', jsonStr)

  console.log('\n↓↓↓↓ Typescript 类型解析 ↓↓↓↓↓\n')
  const { typeofSjsonc } = await quickcommand.loadRemoteScript(`https://unpkg.com/typeof-sjsonc`)
  const types = typeofSjsonc(jsonStr, '{{subinput:请输入 Root 接口名}}' || 'Root', { separate: true })
  console.log(types)
  copyTo(types)
  message("已复制剪贴板")
})()
