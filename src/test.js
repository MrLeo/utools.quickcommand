/**
 * 加载远程脚本
 */
(async () => {
  const _ = await quickcommand.loadRemoteScript('https://unpkg.com/lodash')
  const json = {a: 1}
  console.log(_.get(json, 'a'))
})()

/**
 * 加载本地脚本
 */
require('/Users/leo/www/utools/quickcommand/src/project-publish.js')

/**
 * 显示等待操作按钮，点击后退出插件
 */
quickcommand.showWaitButton(() => {
  utools.outPlugin()
}, "停止运行")


/**
 * 脚本内容
 */
exports.default = {
  a: "a",
  b: function () {
    console.log("b")
  },
}
