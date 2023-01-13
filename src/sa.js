let input = quickcommand.readClipboard()

input = decodeURIComponent(input)

input = Buffer.from(input, "base64").toString()

console.log(JSON.stringify(JSON.parse(input), null, 2))

module.exports = () => {}
