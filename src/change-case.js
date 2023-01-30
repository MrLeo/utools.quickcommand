;(async () => {
  // console.log(`[enterData] -> ${quickcommand.enterData}`)
  let payload = quickcommand.enterData.payload

  if (/(^|\/)pages\//.test(payload)) {
    const replaceReg = /.*\/?pages\/([^\/]*)\/.*/
    payload = payload.replace(replaceReg, "$1")
  }

  if (/\.vue$/.test(payload)) {
    const replaceReg = /(.*\/)?([^\.]*)\.vue$/
    payload = payload.replace(replaceReg, "$2")
  }

  quickcommand
    .showSelectList(
      [
        // { title: ``, description: `` },
        { title: _.camelCase(payload), description: `Foo Bar  →  fooBar` },
        { title: _.snakeCase(payload), description: `Foo Bar  →  foo_bar` },
        { title: _.kebabCase(payload), description: `Foo Bar  →  foo-bar` },
        { title: _.startCase(payload), description: `Foo Bar  →  Foo Bar` },
        { title: _.lowerCase(payload), description: `Foo Bar  →  foo bar` },
        { title: _.upperCase(payload), description: `Foo Bar  →  FOO BAR` },
        { title: _.toLower(payload), description: `Foo Bar  →  foobar` },
        { title: _.toUpper(payload), description: `Foo Bar  →  FOOBAR` },
        {
          title: _.snakeCase(payload).replace(/_/gi, "."),
          description: `Foo Bar  →  foo_bar  →  foo.bar`,
        },
        {
          title: _.snakeCase(payload).replace(/_/gi, "/"),
          description: `Foo Bar  →  foo_bar  →  foo/bar`,
        },
        {
          title: `/${_.snakeCase(payload).replace(/_/gi, "/")}`,
          description: `Foo Bar → foo_bar  →  /foo/bar`,
        },
        {
          title: payload.replace(/[_\-\.\s]+/gi, "/"),
          description: `_-.\\s  →  /`,
        },
        {
          title: payload.replace(/[_\.\/\s]+/gi, "-"),
          description: `_./\\s  →  -`,
        },
        {
          title: payload.replace(/[\-\.\/\s]+/gi, "_"),
          description: `-./\\s  →  _`,
        },
        {
          title: payload.replace(/[_\-\/\s]+/gi, "."),
          description: `_-/\\s  →  .`,
        },
        {
          title: payload.replace(/[_\-\.\/]+/gi, " "),
          description: `_-./  →  \\s`,
        },
      ],
      { optionType: "json", closeOnSelect: true }
    )
    .then((choise) => {
      const txt = choise.title
      utools.copyText(txt)
      send(txt)
      message(`${txt} 已复制`)
      utools.hideMainWindow()
      utools.outPlugin()
    })
})()
