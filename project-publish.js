const iconv = require("iconv-lite")
const decode = (data) =>
  iconv.decode(data, utools.isWindows() ? "cp936" : "utf8")
const log = (data) => console.log(decode(data))
const error = (data) => console.error(decode(data))

const config = {
  /** FIXME 工程目录根路径 */
  root: `/Users/leo/zhaopin/code`,
  jenkinsBaseUrl: `https://jenkins.dev.zhaopin.com`,
  batchSize: 5,
}

class Run {
  constructor() {
    this.time = new Date().toLocaleTimeString()

    /** 构建页面的分组集合 */
    this.ubrowsers = []

    /** Jenkins项目页面地址 */
    this.jenkinsUrl = ""

    /** 灰度发布页面地址 */
    this.publishUrl = ""

    /** 构建环境 */
    this.publishEnv = ""

    /** 最终发布的所有页面 */
    this.publishPage = []

    /** 过滤掉的页面 */
    this.ignorePage = new Map()

    /** 工程下的所有页面 */
    this.pageList = []

    /** 选中的工程 */
    this.selectProject = ""

    /** 工程目录集合 */
    this.dirList = []

    this.showDirs()
  }

  async showDirs() {
    this.dirList = fs
      .readdirSync(config.root, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((dir) => /^node-innovation-/.test(dir))
      .sort()

    const choise = await quickcommand.showSelectList(this.dirList)
    this.selectProject = choise.text

    quickcommand.setTimeout(() => this.showPages(), 0)
  }

  showPages() {
    this.pageList = fs
      .readdirSync(`${config.root}/${this.selectProject}/pages`, {
        withFileTypes: true,
      })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((dir) => !/403|404|demo|__open-in-editor/.test(dir))
      .sort()

    console.log(this.pageList)

    this.showPageList()
  }

  showPageList(times = 0) {
    const options = [...this.pageList.map((dir) => `<div>${dir}</div>`)]
    if (times === 0) {
      options.push(`<div style="color:red">选好了</div>`)
    }
    quickcommand
      .showSelectList(options, { optionType: "html" })
      .then(async (choise) => {
        const text = quickcommand.htmlParse(choise.text).body.innerText
        if (text === "选好了") {
          await this.getPublishInfo()
        } else {
          this.pickPage(text, choise)
          this.showPageList(++times)
        }
      })
  }

  pickPage(page, choise) {
    if (this.ignorePage.has(page)) {
      quickcommand.updateSelectList(page, choise.id)
      this.ignorePage.delete(page)
    } else {
      quickcommand.updateSelectList(`<del>${page}</del>`, choise.id)
      this.ignorePage.set(page, choise.id)
    }
  }

  async getPublishInfo() {
    this.publishPage = this.pageList.filter(
      (page) => ![...this.ignorePage.keys()].includes(page)
    )

    await this.selectPublishEnv()

    this.getBatchPage()

    this.getJenkinsUrl()

    this.getPublishUrl()

    await this.startPublish()
  }

  async selectPublishEnv() {
    let button = await quickcommand.showButtonBox([
      "取消",
      "Debug",
      "打开Jenkins - Pre",
      "打开Jenkins - Prod",
    ])
    this.publishEnv = ["", "debug", "pre", "prod"][button.id]
  }

  getBatchPage() {
    const tempList = [...this.publishPage]
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
    const host =
      zpfeConfig.env[this.publishEnv === "prod" ? "production" : "pre"].host
    this.publishUrl = `https://front-end.zhaopin.com/publish/builds?host=${host}&module=.&env=${this.publishEnv}}&key=builds`
  }

  async startPublish() {
    if (this.publishEnv === "debug") {
      let button = await quickcommand.showButtonBox(
        this.ubrowsers.map((item, index) => `${index + 1}. ${item}`)
      )
      const buildEntryPattern = this.ubrowsers[button.id]
      this.openBrowser({
        buildEntryPattern,
        description: `[${this.time}] - ${button.id + 1}`,
      })
    } else {
      this.ubrowsers.forEach((buildEntryPattern, index) =>
        this.openBrowser({
          buildEntryPattern,
          description: `[${this.time}] - ${index + 1}`,
        })
      )
    }

    this.republish()

    this.output()

    quickcommand.setTimeout(() => visit(this.jenkinsUrl), 2000)

    quickcommand.setTimeout(() => {
      // quickcommand.wakeUtools()
      visit(this.publishUrl)
    }, 10000)

    quickcommand.showWaitButton(() => {
      utools.outPlugin()
    }, "停止运行")
  }

  openBrowser({ buildEntryPattern, description }) {
    if (!buildEntryPattern) throw new Error("buildEntryPattern is required")

    /** https://u.tools/docs/developer/ubrowser.html */
    const u = utools.ubrowser.goto(`${this.jenkinsUrl}/build`)

    const branch = this.publishEnv === "prod" ? "master" : "pre"

    u.when("#choice-parameter-33702964895238218")
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
  }

  async republish() {
    const buttons = this.ubrowsers.map((item, index) => `${index + 1}. ${item}`)
    let button = await quickcommand.showButtonBox(buttons)
    const buildEntryPattern = this.ubrowsers[button.id]

    const entrys = buildEntryPattern.split(",")
    const newLen = Math.round(entrys.length / 2)
    const tempList = []
    while (entrys.length) {
      tempList.push(entrys.splice(0, newLen).join(","))
    }

    tempList.forEach((newBuildEntryPattern, index) =>
      this.openBrowser({
        buildEntryPattern: newBuildEntryPattern,
        description: `[${this.time}] ${button.id} - ${index + 1}`,
      })
    )

    let button2 = await quickcommand.showButtonBox(["停止运行", "继续"])
    if (button2.id === 0) {
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
        publishPage: this.publishPage,
        ignorePage: [...this.ignorePage],
        pageList: this.pageList,
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
  }
}

try {
  new Run()
} catch (e) {
  error(e.message)
}
