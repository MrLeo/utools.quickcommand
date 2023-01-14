// [
//     "zb",
//     {
//         "type": "window",
//         "label": "周报格式化",
//         "match": {
//             "app": [
//                 "Notion.app",
//                 "Notion",
//                 "Notion Helper"
//             ]
//         }
//     },
//     {
//         "type": "over",
//         "label": "周报格式化",
//         "exclude": "/(?=^|\n)([^:]*:)/g",
//         "minLength": 10
//     }
// ]

let middleStr = quickcommand.readClipboard()

const arr = [...new Set(middleStr.match(/(.*)/g))].filter(Boolean)

const project = {}
let tempProject = ""
while (arr.length) {
  let row = (arr.shift() || "").replace(/\((归档|Done)\)/gi, "(已上线)")

  if (/^#/.test(row)) {
    tempProject = row.replace(/^#\s*(\d+\s*\/\s*)?/, "")
    project[tempProject] = {}
  } else {
    const reg = /^\*\s*(([^»]*) »)? ([^＠]*) ＠ [^柳学斌]*[^\(]*([^\)]*\))/
    const task = row.match(reg)
    if (task) {
      project[tempProject][task[2] || "其他"] = [
        ...(project[tempProject][task[2] || "其他"] || []),
        task[3],
      ]
    }
  }
}
console.log(`[LOG] -> project`, project)

const result = []
Object.keys(project).forEach((key) => {
  result.push(`\n# ${key}`)
  Object.keys(project[key]).forEach((subKey) => {
    result.push(`- ${subKey}`)
    project[key][subKey].forEach((task) => {
      result.push(`    * ${task}`)
    })
  })
})

quickcommand.writeClipboard(result.join("\n"))
console.log(result.join("\n"))
