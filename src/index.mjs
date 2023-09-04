#!/usr/bin/env zx

/**
 * https://github.com/google/zx
 */

/**
const { execFile } = require("child_process")
execFile('zx', ['D:/demo/index.js'], (error, stdout, stderr) => {
  utools.showNotification(stdout) // 系统将通知 fooBar
})
**/

import 'zx/globals'

const nodeVersion = await $`node -v`
console.log(nodeVersion)
