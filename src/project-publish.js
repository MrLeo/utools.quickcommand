quickcommand.showWaitButton(() => {
  utools.outPlugin()
}, "停止运行")

// require('/Users/leo/www/utools/quickcommand/src/project-publish.js')

/**
 * https://gitee.com/mr.leo/utools.quickcommand/raw/main/src/project-publish.js
 * https://yuanliao.info/d/424-301/387
 * https://www.yuque.com/fofolee/qcdocs3/pt589p
 * https://u.tools/docs/developer/api.html
 */
const fs = require("fs")
const iconv = require("iconv-lite")

const decode = (data) =>
  iconv.decode(data, utools.isWindows() ? "cp936" : "utf8")
const log = (data) => console.log(decode(data))
const error = (data) => console.error(decode(data))

const config = {
  /** 本地工程目录根路径 */
  root: `/Users/leo/zhaopin/code`,
  /** Jenkins域名 */
  jenkinsBaseUrl: `https://jenkins.dev.zhaopin.com`,
  /** 初始页面批次大小 */
  batchSize: 5,
}

class Run {
  constructor() {
    this.time = new Date().toLocaleTimeString()

    /** 构建工件的分组集合 */
    this.ubrowsers = []

    /** Jenkins项目页面地址 */
    this.jenkinsUrl = ""

    /** 灰度发布页面地址 */
    this.publishUrl = ""

    /** 构建环境 */
    this.publishEnv = ""

    /** 最终发布的所有工件 */
    this.publishEntry = []

    /** 过滤掉的工件 */
    this.ignoreEntry = new Map()

    /** 可发布的所有工件 */
    this.entryList = []

    /** 选中的工程 */
    this.selectProject = ""

    /** 工程目录集合 */
    this.dirList = fs
      .readdirSync(config.root, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((dir) => /^node-innovation-/.test(dir))
      .sort()

    this.showDirs()
  }

  async showDirs() {
    const choise = await quickcommand.showSelectList(this.dirList)
    this.selectProject = choise.text
    quickcommand.setTimeout(() => {
      this.getEntrys()
      this.showEntrys()
    }, 0)
  }

  async getEntrys() {
    const pages = fs
      .readdirSync(`${config.root}/${this.selectProject}/pages`, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((dir) => !/403|404|demo|__open-in-editor/.test(dir))
      .sort()

    const extensions = []
    fs.existsSync(`${config.root}/${this.selectProject}/extensions`) &&
    fs
      .readdirSync(`${config.root}/${this.selectProject}/extensions`, { withFileTypes: true, })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => {
        // if (dirent.isFile() && dirent.name === "request-context.js") extensions.push(dirent.name)
        if (dirent.isDirectory()) {
          fs
            .readdirSync(`${config.root}/${this.selectProject}/extensions/${dirent.name}`, { withFileTypes: true })
            .map((extensionDirent) => extensions.push(extensionDirent.name))
        }
      })

    this.entryList = [...new Set([...pages, ...extensions].filter(Boolean))]
    console.log('[entryList] ->', this.entryList)
  }

  async showEntrys(times = 0) {
    const options = [...this.entryList.map((dir) => `<div>${dir}</div>`)]
    if (times === 0) {
      options.push(`<div style="color:#70a1ff">反选</div>`)
      options.push(`<div style="color:red">选好了</div>`)
    }
    const choise = await quickcommand.showSelectList(options, { optionType: "html" })
    const text = quickcommand.htmlParse(choise.text).body.innerText
    if (text === "选好了") {
      quickcommand.setTimeout(() => this.getPublishInfo(), 0)
    } else if (text === "反选") {
      const tempIgnoreEntry = new Map([...this.ignoreEntry])
      this.entryList.forEach((item, index)=>{
        if(tempIgnoreEntry.has(item)) {
          this.ignoreEntry.delete(item)
          quickcommand.updateSelectList(item, index)
        } else {
          this.ignoreEntry.set(item, index)
          quickcommand.updateSelectList(`<del>${item}</del>`, index)
        }
      })
      console.log('[ignoreEntry] ->', [...this.ignoreEntry])
      await this.showEntrys(++times)
    } else {
      if (this.ignoreEntry.has(text)) {
        this.ignoreEntry.delete(text)
        quickcommand.updateSelectList(text, choise.id)
      } else {
        this.ignoreEntry.set(text, choise.id)
        quickcommand.updateSelectList(`<del>${text}</del>`, choise.id)
      }
      console.log('[ignoreEntry] ->', [...this.ignoreEntry])
      await this.showEntrys(++times)
    }
  }

  async getPublishInfo() {
    this.publishEntry = this.entryList.filter((entry) => ![...this.ignoreEntry.keys()].includes(entry))

    await this.selectPublishEnv()

    this.getBatchEntry()

    this.getJenkinsUrl()

    this.getPublishUrl()

    await this.startPublish()
  }

  async selectPublishEnv() {
    const choise = await quickcommand.showSelectList([
      `<div style="color:#3498db">打开Jenkins - Pre</div>`,
      `<div style="color:#3498db">打开Jenkins - Prod</div>`,
      `<div style="color:#95a5a6">取消</div>`,
      `<div style="color:#e74c3c">Debug</div>`,
    ], { optionType: "html" })
    this.publishEnv = ["pre", "prod", "", "debug"][choise.id]
    if(!this.publishEnv) utools.outPlugin()
  }

  getBatchEntry() {
    const tempList = [...this.publishEntry]
    while (tempList.length) {
      const batchStr = tempList.splice(0, config.batchSize).join(",")
      this.ubrowsers.push(batchStr)
    }
  }

  getJenkinsUrl() {
    const job = this.selectProject.replace(/^node-(innovation-[^-]*)-.*$/, "$1")
    this.jenkinsUrl = `${config.jenkinsBaseUrl}/job/${job}/job/${this.selectProject}`
  }

  getPublishUrl() {
    const zpfeConfig = require(`${config.root}/${this.selectProject}/zpfe-config.js`)
    const env = this.publishEnv === "prod" ? "production" : "pre"
    const host = zpfeConfig.env[env].host
    this.publishUrl = `https://front-end.zhaopin.com/publish/builds?host=${host}&module=.&env=${env}}&key=builds`
  }

  async startPublish() {
    const choise = await quickcommand.showSelectList([
      ...this.ubrowsers.map((item, index) => `${index}. ${item}`),
      `<div style="background-color:#e74c3c;color:#fff;">全部</div>`,
      `<div style="background-color:#ff6348;color:#fff;">选择异常构建</div>`,
    ], { optionType: "html" })

    if (choise.id < this.ubrowsers.length) {
      this.pickPublish(choise.id)
    } else if (choise.id === this.ubrowsers.length) {
      this.autoPublishAll()
    } else {
      quickcommand.setTimeout(()=>{
        this.republish()
        this.output()
      }, 100)
    }
  }

  autoPublishAll(index = 0){
    const buildEntryPattern = this.ubrowsers[index]
    this.openBrowser({ buildEntryPattern, description: `[${this.time}] - ${index || 0}` })
    if (index < this.ubrowsers.length - 1) {
      quickcommand.setTimeout(()=> this.autoPublishAll(index + 1), 5000)
    } else {
      quickcommand.setTimeout(()=>{
        this.republish()
        this.output()
      }, 100)
    }
  }

  async pickPublish(index = 0) {
    const buildEntryPattern = this.ubrowsers[index]
    this.openBrowser({ buildEntryPattern, description: `[${this.time}] - ${index || 0}` })

    quickcommand.updateSelectList(`<div style="color:#70a1ff;">继续选择异常构建</div>`, this.ubrowsers.length)
    quickcommand.updateSelectList(`<del>${index}. ${buildEntryPattern}</del>`, index)

    quickcommand.wakeUtools()
    const choise = await quickcommand.showSelectList([
      ...this.ubrowsers.map((item, i) => `${i}. ${item}`),
      `<div style="color:#70a1ff;">继续选择异常构建</div>`,
    ], { optionType: "html" })

    if (choise.id < this.ubrowsers.length) {
      this.pickPublish(choise.id)
    } else {
      quickcommand.setTimeout(()=>{
        this.republish()
        this.output()
      }, 100)
    }
  }

  openBrowser({ buildEntryPattern, description }) {
    if (!buildEntryPattern) throw new Error("buildEntryPattern is required")

    const branch = this.publishEnv === "prod" ? "master" : "pre"

    /** https://u.tools/docs/developer/ubrowser.html */
    const u = utools.ubrowser
      .goto(`${this.jenkinsUrl}/build`)
      .wait("#choice-parameter-33702964895238218", 20000)
      .value("#choice-parameter-33702964895238218 > select", branch)
      .value(
        "#main-panel > form > table > tbody:nth-child(9) > tr:nth-child(1) > td.setting-main > div > input.setting-input",
        buildEntryPattern
      )
      .value(
        "#main-panel > form > table > tbody:nth-child(10) > tr:nth-child(1) > td.setting-main > div > textarea",
        description
      )

    if (this.publishEnv === "debug") {
      u.devTools("right")
      u.run({ width: 2000, height: 2000 })
    } else {
      u.wait(2000).click("#yui-gen1-button")
      u.run({ width: 1000, height: 820 })
    }

    return u
  }

  async republish() {
    quickcommand.wakeUtools()
    const choise = await quickcommand.showSelectList(
      this.ubrowsers.map((item, index) => `♻️ rebuild: ${index}. ${item}`),
      { optionType: "html" }
    )

    const buildEntryPattern = this.ubrowsers[choise.id]

    const entrys = buildEntryPattern.split(",")
    const newLen = Math.round(entrys.length / 2)
    const tempList = []
    while (entrys.length) {
      tempList.push(entrys.splice(0, newLen).join(","))
    }

    tempList.forEach((newBuildEntryPattern, index) =>
      this.openBrowser({
        buildEntryPattern: newBuildEntryPattern,
        description: `[${this.time}] - ${choise.id} - ${index}`,
      })
    )

    let button = await quickcommand.showButtonBox(["停止运行", "继续"])
    if (button.id === 0) {
      utools.outPlugin()
    } else {
      this.republish()
    }
  }

  output() {
    const txt = JSON.stringify(
      {
        time: this.time,
        jenkinsUrl: this.jenkinsUrl,
        publishUrl: this.publishUrl,
        ubrowsers: this.ubrowsers,
        publishEntry: this.publishEntry,
        ignoreEntry: [...this.ignoreEntry],
        entryList: this.entryList,
        publishEnv: this.publishEnv,
        selectProject: this.selectProject,
        dirList: this.dirList,
      },
      "",
      2
    )

    utools.copyText(txt)
    message(`📋 构建信息已复制`)
    // console.log(txt)

    utools.showMainWindow()
    quickcommand.wakeUtools()
  }
}

try {
  new Run()
} catch (e) {
  error(e.message)
}

module.exports = () => {}
