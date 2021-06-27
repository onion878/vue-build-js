const build = require("./bin/build");

build("./test", 'all', './dist')
build("./test", 'watch', './dist')