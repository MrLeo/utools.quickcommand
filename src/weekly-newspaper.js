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

// let middleStr = quickcommand.readClipboard()
let middleStr = `# 0111 / 外包@1.0.0 (Done)
* 外包-客户管理-合同管理 » 添加合同筛选列表 ＠ 于政文 (Done);
* 外包-客户管理-合同添加 » 关联合同 ＠ 于政文 (Done);
* 外包-客户管理-合同管理 » 添加合同筛选列表操作-编辑合同 ＠ 于政文 (Done);
* 外包-客户管理-合同管理 » 添加合同筛选列表操作-操作日志 ＠ 于政文 (Done);
* 外包-客户管理-合同指派 » 合同指派筛选列表（待指派/已指派） ＠ 于政文 (Done);
* 外包-客户管理-合同指派 » 合同指派列表-指派操作（单独指派，批量指派） ＠ 于政文 (Done);
* 外包-客户管理-报价审核 » 报价审核筛选列表 (待审核/已审核) ＠ 于政文 (Done);
* 外包-客户管理-客户账号管理 » 客户账号筛选列表 ＠ 于政文 (Done);
* 外包-客户管理-客户账号管理 » 新增企业用户 ＠ 于政文 (Done);
* 外包-外包管理-我的客户 » 我的客户筛选列表 ＠ 于政文 (Done);
* 外包-外包管理-账单管理 » 账单管理筛选列表 ＠ 柳学斌 (Done);
* 外包-外包管理-账单管理 » 账单操作（查看详情、修改、获取链接、发送、确认到款、确认完成） ＠ 柳学斌 (Done);
* 外包-外包管理-账单详情 » 账单详情 (待客户确认/客户退回/待认款/执行中/已完成) ＠ 柳学斌 (Done);
* 外包-外包管理-账单创建 » 创建账单Step2-上传付款模版 ＠ 柳学斌 (Done);
* 外包-外包管理-账单创建 » 创建账单Step3-上传明细附件 ＠ 柳学斌 (Done);
* 外包-外包管理-账单创建 » 创建账单Step4-生成账单保存成功 ＠ 柳学斌 (Done);
* 企业账户管理-修改权限 » 权限管理区分内外包，支持多选 ＠ 于政文 (Done);
* 企业账户管理 » 工作交接Dropdown菜单区分内外包 ＠ 于政文 (Done);
* inno系统水印(姓名+邮箱) ＠ 柳学斌 (Done);
* 外包-外包管理-我的客户 » 我的客户筛选列表-操作日志 ＠ 于政文 (Done);
* 外包-账单管理 » zhuan-外包-账单管理筛选列表 ＠ 柳学斌 (Done);
* 外包-账单管理-账单详情 » zhuan-外包-账单详情 ＠ 柳学斌 (Done);
* 更新 AppLayout 历史页面需要 ant2升级3  ＠ 于政文, 柳学斌 (Done);
* 外包-外包管理-账单创建 » 预览账单 ＠ 柳学斌 (Done);
* inno侧边导航切换内外包 ＠ 于政文 (Done);
* 外包-外包管理-我的客户 » 我的客户详情页面 ＠ 于政文 (Done);
* 将PM+RM改成PM（企业账户，发薪，关联合同） ＠ 于政文 (Done);
* 外包-外包管理-账单创建 » 创建账单Step1-选择合同 ＠ 柳学斌 (Done);
* Bug修复 ＠ 柳学斌, 于政文, 梁磊, 张海浪 (Done);
* 修复客户报价管理页面数据未显示 ＠ 柳学斌 (Done);
* 修复业务立项审核缺少操作按钮 ＠ 柳学斌 (Done);


# 0111 / 数据运营中心调整 (Done)
* 结算数据统计 » 数据运营中心_结算数据增加数据看板 ＠ 于政文 (Done);


# 0112 / BPO风控专项 (Done)
* 风险评估 » 全部列表 / 待我评估列表 ＠ 柳学斌 (Done);
* 风险评估-评估录入 » 发起风险评估 ＠ 柳学斌 (Done);
* 风险评估-详情 » 风险评估结果/详情展示，操作：评估等级，变更风险等级，申请复议 ＠ 于政文 (Done);`

// middleStr = middleStr.replace(/(?=^|\n)([^:]*:)/g, '$1\n  *')
// middleStr = middleStr.match(/(.*)/g)
// middleStr = [...new Set(middleStr)]
// middleStr = middleStr.filter(Boolean)
// middleStr = middleStr.join('\n')

// // str = str.replace(/\n.*(?<=:)/g, (match) => `\n\n${match}`)
// middleStr = middleStr.replace(/\n(.*(?<=:))/g, '\n\n$1')
// middleStr = middleStr.replace(/归档/g, '已上线')
// // middleStr = middleStr.replace(/(\(\d+%)（[^）]+）(\))/g, '$1$2')

// console.log(middleStr)

const arr = [...new Set(middleStr.match(/(.*)/g))].filter(Boolean)

let index = arr.length - 1 || 0
while (index > 0) {
  const page = arr[index]?.match(/「[^」]*」/)?.toString()
  if (!page) {
    arr[index] = `\n\n${arr[index]}`
  } else if (new RegExp(page).test(arr[index - 1])) {
    arr[index] = arr[index]?.replace(page, `\n`)
  } else {
    arr[index] = arr[index]?.replace(page, `\n\n${page}\n`)
  }
  arr[index] = arr[index]?.replace(/归档/g, "已上线")
  index--
}

console.log(arr.join())
