let file = "",
    target;

const app_path = __dirname.replace(/\\/g, '/').replace('/node_modules/vue-build-js/bin', '');
const babel = require("@babel/core");
const path = require('path')
const Chokidar = require('chokidar');
const fs = require('fs');
const log = require('tracer').colorConsole();
// 引入cheerio模块
const DntlyCssJson = require('dntly-cssjson');

const {
    v4: uuidv4
} = require('uuid');
module.exports = function (f, arg, output) {
    file = f;
    target = output;
    if (arg == 'all') {
        getFiles(path.join(file, '/'), [".vue", ".ts"]);
        return;
    }
    const watcher = Chokidar.watch([path.join(file, '/')], {
        // ignored: /(^|[\/\\])\../,
        persistent: true,
        usePolling: true,
    });
    const watchAction = function ({
        event,
        eventPath
    }) {
        if (path.extname(eventPath) === '.vue') {
            log.info(`Has been ${event}ed, file: ${eventPath}`);
            // 这里进行文件更改后的操作
            compileFile(eventPath);
        }
        if (path.extname(eventPath) === '.ts') {
            log.info(`Has been ${event}ed, file: ${eventPath}`);
            // 这里进行文件更改后的操作
            compileTs(fs.readFileSync(eventPath)).then(d => {
                const newFile = eventPath.replace('.ts', '.min.js');
                saveFile(newFile, changeContent('(function () {var exports = {}; ' + d + ' define(function () {return exports;});})();', newFile));
                log.debug(eventPath + " 编译完成!");
            });
        }
    }
    watcher
        .on('ready', () => log.info(`Initial scan complete. Ready for changes.`))
        .on('add', p => log.info(`File ${p} has been added`))
        .on('change', p => watchAction({
            event: 'change',
            eventPath: p
        }))
        .on('unlink', p => watchAction({
            event: 'remove',
            eventPath: p
        }));
}

function getFiles(url, ext) {
    fs.readdir(url, function (err, files) {
        if (err) {
            return console.error(err);
        }
        files.forEach(function (file) {
            fs.stat(url + file, (err, stats) => {
                if (stats.isFile()) {
                    ext.forEach(e => {
                        if (path.extname(url + file) === e) {
                            if (e == '.vue') {
                                compileFile(url + file);
                            }
                            if (e == '.ts') {
                                const f = url + file;
                                compileTs(fs.readFileSync(f)).then(d => {
                                    const newFile = f.replace('.ts', '.min.js');
                                    saveFile(newFile, changeContent('(function () {var exports = {}; ' + d + ' define(function () {return exports;});})();', newFile));
                                    log.debug(f + " 编译完成!");
                                });
                            }
                        }
                    })
                } else if (stats.isDirectory()) {
                    getFiles(url + file + '/', ext)
                }
            })

        })
    })
}

function compileJs(code) {
    return new Promise(resolve => {
        babel.transformAsync(code, {
            presets: ['@babel/preset-env'],
            minified: true
        }).then(d => {
            resolve(d.code);
        });
    });
}

function compileTs(code) {
    return new Promise(resolve => {
        const d = babel.transformSync(code, {
            filename: 'cache.build.ts',
            presets: ['@babel/preset-env', '@babel/preset-typescript'],
            minified: true
        });
        resolve(d.code);
    });
}

function compileFile(f) {
    const content = fs.readFileSync(f).toString();
    let scriptStart = '<script>',
        scriptFlag = false,
        importList = '',
        script = null;
    if (content.indexOf('<script lang="ts">') > -1) {
        scriptStart = '<script lang="ts">';
        scriptFlag = true;
    }
    if (content.indexOf('<script>') > -1) {
        scriptStart = '<script>';
        scriptFlag = true;
    }
    if (scriptFlag === true) {
        let scriptAll = content.split(scriptStart)[1].split('</script>')[0];
        let a = scriptAll.split('export default');
        importList = a[0];
        script = a[1];
    }

    let html = "";
    content.split('\n').some((c, i) => {
        if (c.indexOf(scriptStart) > -1) {
            return true;
        }
        html = html + "\n" + c;
    });
    let style = "",
        flag = false;
    content.split('\n').some((c, i) => {
        if (c.indexOf('</style>') > -1) {
            return true;
        }
        if (flag) {
            style = style + "\n" + c;
        }
        if (c.indexOf('<style>') > -1) {
            flag = true;
        }
    });
    // 处理style
    const classId = '_' + uuidv4();
    const css = DntlyCssJson.cssToJson(style);
    for (let k in css) {
        if (Object.hasOwnProperty.call(css, k)) {
            const e = css[k];
            const newKey = [];
            k.split(',').forEach(d => {
                const prefix = d.trim().substring(0, 1);
                if (prefix != '@' && prefix != ':') {
                    newKey.push('.' + classId + ' ' + d);
                }
            });
            css[newKey.join(',')] = e;
            delete css[k];
        }
    }

    if (script == null) {
        script = "{}";
    }
    const data = {
        script: script,
        style: DntlyCssJson.jsonToCss(css),
        html: `<div class="${classId}">${html}</div>`
    };
    if (scriptStart == '<script>') {
        compileJs(importList + 'const _default_script = ' + script).then(d => {
            data.script = d;
            compileJs('const _default_template = ' + JSON.stringify(data) + '\n_default_template;').then(d => {
                const list = eval(d);
                const newFile = f.replace('.vue', '.min.js');
                saveFile(newFile, changeContent(`(function () {` + list.script + '\nvar _config=' + JSON.stringify({
                    template: list.html,
                    style: list.style
                }) + ';_default_script.template = _config["template"];' + '_default_script.style = _config["style"];define(function () {return _default_script;});})();', newFile));
                log.debug(f + " 编译完成!");
            });
        });
    } else {
        compileTs(importList + 'const _default_script = ' + script).then(d => {
            data.script = d;
            compileTs('const _default_template = ' + JSON.stringify(data) + '\n_default_template;').then(d => {
                const list = eval(d);
                const newFile = f.replace('.vue', '.min.js');
                saveFile(newFile, changeContent(`(function () {` + list.script + '\nvar _config=' + JSON.stringify({
                    template: list.html,
                    style: list.style
                }) + ';_default_script.template = _config["template"];' + '_default_script.style = _config["style"];define(function () {return _default_script;});})();', newFile));
                log.debug(f + " 编译完成!");
            });
        });
    }
}

function saveFile(p, content) {
    let f = p.replace(/\\/g, '/');
    if (target) {
        const newFile = path.join(app_path, target).replace(/\\/g, '/');
        f = newFile + f.replace(file.replace('./', ''), '');
        mkdirsSync(path.dirname(f));
    }
    log.info('生成文件:' + f);
    fs.writeFileSync(f, content);
}

function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) return true;
    if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
    }
}

function changeContent(str, file) {
    const reg = /require((\S*)")/g;
    const res = str.match(reg);
    const requireList = [];
    if (res == null) {
        saveFile(file.replace('.min.js', '.config.json'), JSON.stringify(requireList));
        return str;
    }
    res.forEach(r => {
        if (r.indexOf('.vue') > -1) {
            const o = r.substring(0, r.length - 5) + '.min"';
            requireList.push(o.substring(9, o.length - 1));
            str = str.replace(r, o);
        } else {
            const o = r.substring(0, r.length - 1) + '.min"';
            requireList.push(o.substring(9, o.length - 1));
            str = str.replace(r, o);
        }
    });
    saveFile(file.replace('.min.js', '.config.json'), JSON.stringify(requireList));
    return str;
}