/**
 * @link https://github.com/fofolee/uTools-quickcommand/blob/master/plugin/preload.js#LL85C8-L85C20
 * @description: 快捷命令 - 可用API列表
 */
modules.exports = {
  // 模拟复制操作
  simulateCopy: function () {
    utools.simulateKeyboardTap("c", ctlKey)
  },

  // 模拟粘贴操作
  simulatePaste: function () {
    utools.simulateKeyboardTap("v", ctlKey)
  },

  // setTimout 不能在 vm2 中使用，同时在 electron 中有 bug
  sleep: function (ms) {
    var start = new Date().getTime()
    try {
      // node 16.13.1
      child_process.execSync(getSleepCodeByShell(ms), {
        timeout: ms,
        windowsHide: true,
      })
    } catch (ex) {}
    var end = new Date().getTime()
    return end - start
  },

  // 重写 setTimeout
  setTimeout: function (callback, ms) {
    var start = new Date().getTime()
    child_process.exec(
      getSleepCodeByShell(ms),
      {
        timeout: ms,
      },
      (err, stdout, stderr) => {
        var end = new Date().getTime()
        callback(end - start)
      }
    )
  },

  // 关闭进程
  kill: function (pid, signal = "SIGTERM", cb) {
    kill(pid, signal, cb)
  },

  // dom 解析
  htmlParse: function (html) {
    return new DOMParser().parseFromString(html, "text/html")
  },

  // 下载文件
  downloadFile: function (url, file = {}) {
    return new Promise((reslove, reject) => {
      if (file instanceof Object)
        file = utools.showSaveDialog(JSON.parse(JSON.stringify(file)))
      axios({
        method: "get",
        url: url,
        responseType: "arraybuffer",
      })
        .then((res) => {
          var filebuffer = Buffer.from(res.data)
          fs.writeFile(file, filebuffer, (err) => {
            if (err) reject(err)
            else reslove(filebuffer)
          })
        })
        .catch((err) => {
          reject(err)
        })
    })
  },

  // 上传文件
  uploadFile: function (url, file = {}, name = "file", formData = {}) {
    return new Promise((reslove, reject) => {
      var objfile
      if (file instanceof File) {
        objfile = file
      } else {
        if (file instanceof Object)
          file = utools.showOpenDialog(JSON.parse(JSON.stringify(file)))[0]
        if (!fs.existsSync(file)) return reject("文件不存在")
        var arraybuffer = fs.readFileSync(file).buffer
        var objfile = new File([arraybuffer], path.basename(file))
      }
      var form = new FormData()
      form.append(name, objfile)
      var keys = Object.keys(formData)
      if (keys.length) keys.forEach((k) => form.append(k, formData[k]))
      axios
        .post(url, form, {
          headers: {
            accept: "application/json",
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          },
        })
        .then((res) => {
          reslove(res)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },

  // 载入在线资源
  loadRemoteScript: async function (url) {
    if (
      !/^((ht|f)tps?):\/\/([\w\-]+(\.[\w\-]+)*\/)*[\w\-]+(\.[\w\-]+)*\/?(\?([\w\-\.,@?^=%&:\/~\+#]*)+)?/.test(
        url
      )
    )
      throw "url 不合法"
    let local = getQuickcommandTempFile("js")
    await this.downloadFile(url, local)
    let source = require(local)
    fs.unlinkSync(local)
    return source
  },

  // 唤醒 uTools
  wakeUtools: function () {
    let uToolsPath = utools.isMacOs()
      ? process.execPath.replace(/\/Frameworks\/.*/, "/MacOS/uTools")
      : process.execPath
    child_process.exec(uToolsPath, () => {})
  },

  readClipboard: function () {
    return electron.clipboard.readText()
  },

  writeClipboard: function (text) {
    electron.clipboard.writeText(text)
  },
}
