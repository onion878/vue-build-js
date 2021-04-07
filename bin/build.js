let file = "";

const babel = require("@babel/core");
const path = require('path')
const Chokidar = require('chokidar');
const fs = require('fs');
const log = require('tracer').colorConsole();
// 引入cheerio模块
const DntlyCssJson = require('dntly-cssjson');

const {v4: uuidv4} = require('uuid');

module.exports = function (f, arg) {
    file = f;
    if (arg == 'all') {
        getFiles(path.join(file, '/'), ".vue");
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
                    if (path.extname(url + file) === ext) {
                        compileFile(url + file);
                    }
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
    let scriptStart = '<script>';
    if (content.indexOf('<script lang="ts">') > -1) {
        scriptStart = '<script lang="ts">';
    }
    let script = content.split(scriptStart)[1].split('</script>')[0].replace('export default', '').trim();
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
                newKey.push('.' + classId + ' ' + d);
            });
            css[newKey.join(',')] = e;
            delete css[k];
        }
    }

    const data = {
        script: script,
        style: DntlyCssJson.jsonToCss(css),
        html: `<div class="${classId}">${html}</div>`
    };
    if (scriptStart == '<script>') {
        compileJs('const _default_script = ' + script + '\n_default_script;').then(d => {
            data.script = d;
            compileJs('const _default_template = ' + JSON.stringify(data) + '\n_default_template;').then(d => {
                fs.writeFileSync(f.replace('.vue', '.min.js'), d);
                log.debug(f + " 编译完成!");
            });
        });
    } else {
        compileTs('const _default_script = ' + script + '\n_default_script;').then(d => {
            data.script = d;
            compileTs('const _default_template = ' + JSON.stringify(data) + '\n_default_template;').then(d => {
                fs.writeFileSync(f.replace('.vue', '.min.js'), d);
                log.debug(f + " 编译完成!");
            });
        });
    }
}
