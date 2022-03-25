const build = require("./bin/build");

build('./test', 'init', './dist');
build("./test", 'all', './dist');
build("./test", 'watch', './dist');