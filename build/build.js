/**
 * Created by zhengqiguang on 2017/4/13.
 */
var UglifyJs = require("uglify-js");
var fs = require("fs");

var result = UglifyJs.minify("../src/index.js");

fs.writeFileSync("../dist/depositary.js", result.code);

