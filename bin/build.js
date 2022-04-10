let file = "",
    target;

const babel = require("@babel/core");
const path = require('path')
const Chokidar = require('chokidar');
const fs = require('fs');
const log = require('tracer').colorConsole();
// 引入cheerio模块
const DntlyCssJson = require('dntly-cssjson');
const app_path = path.join(__dirname.replace(/\\/g, '/').replace('/node_modules/vue-build-js', ''), '../');

const {
    v4: uuidv4
} = require('uuid');

module.exports = function (f, arg, output) {
    file = f;
    target = output;
    if (arg == 'init') {
        initDist(file, target);
        return;
    }
    if (arg == 'all') {
        if (!fs.existsSync(path.join(app_path, target))) {
            fs.mkdirSync(path.join(app_path, target));
        }
        fs.writeFileSync(path.join(app_path, target, '/index.js'), compileTs(fs.readFileSync(path.join(__dirname, '/index.ts'))));
        fs.writeFileSync(path.join(app_path, target, '/vue-loader.js'), compileTs(fs.readFileSync(path.join(__dirname, '/vue-loader.ts'))));
        fs.copyFileSync(path.join(app_path, file, '/index.html'), path.join(app_path, target, '/index.html'));
        fs.copyFileSync(path.join(app_path, file, '/route.json'), path.join(app_path, target, '/route.json'));
        getFiles(path.join(file, '/'), [".vue", ".ts"]);
        return;
    }
    const watcher = Chokidar.watch([path.join(file, '/')], {
        // ignored: /(^|[\/\\])\../,
        persistent: true,
        usePolling: true,
    });
    const watchAction = function ({ event, eventPath }) {
        if (path.extname(eventPath) === '.vue') {
            log.info(`Has been ${event}ed, file: ${eventPath}`);
            // 这里进行文件更改后的操作
            compileFile(eventPath);
        }
        if (path.extname(eventPath) === '.ts') {
            log.info(`Has been ${event}ed, file: ${eventPath}`);
            // 这里进行文件更改后的操作
            const d = compileTs(fs.readFileSync(eventPath));
            const newFile = eventPath.replace('.ts', '.min.js');
            saveFile(newFile, changeContent('(function () {var exports = {}; ' + d + ' define(function () {return exports;});})();', newFile));
            log.debug(eventPath + " 编译完成!");
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
                                const d = compileTs(fs.readFileSync(f));
                                const newFile = f.replace('.ts', '.min.js');
                                saveFile(newFile, changeContent('(function () {var exports = {}; ' + d + ' define(function () {return exports;});})();', newFile));
                                log.debug(f + " 编译完成!");
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
    try {
        const d = babel.transformSync(code, {
            presets: ['@babel/preset-env'],
            minified: true
        });
        return d.code;
    } catch (e) {
        console.error(e);
        return 'console.log(' + e.message + ');';
    }
}

function compileTs(code) {
    try {
        const d = babel.transformSync(code, {
            filename: 'cache.build.ts',
            presets: ['@babel/preset-env', '@babel/preset-typescript'],
            minified: true,
            "comments": false
        });
        return d.code;
    } catch (e) {
        console.error(e);
        return 'console.log(' + e.message + ');';
    }
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
    html = html.trim();
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
    if (html.substring(0, 10) == '<template>' && html.substring(html.length - 11, html.length) == '</template>') {
        html = html.substring(10, html.length - 11);
    }
    const data = {
        script: script,
        style: DntlyCssJson.jsonToCss(css),
        html: `<div class="${classId}">${html}</div>`
    };
    if (scriptStart == '<script>') {
        let d = compileJs(importList + 'const _default_script = ' + script);
        data.script = d;
        d = compileJs('const _default_template = ' + JSON.stringify(data) + '\n_default_template;');
        const list = eval(d);
        const newFile = f.replace('.vue', '.min.js');
        saveFile(newFile, changeContent(`(function () {` + list.script + '\nvar _config=' + JSON.stringify({
            template: list.html,
            style: list.style
        }) + ';_default_script.template = _config["template"];' + '_default_script.style = _config["style"];define(function () {return _default_script;});})();', newFile));
        log.debug(f + " 编译完成!");
        return list.script;
    } else {
        let d = compileTs(importList + 'const _default_script = ' + script);
        data.script = d;
        d = compileTs('const _default_template = ' + JSON.stringify(data) + '\n_default_template;');
        const list = eval(d);
        const newFile = f.replace('.vue', '.min.js');
        saveFile(newFile, changeContent(`(function () {` + list.script + '\nvar _config=' + JSON.stringify({
            template: list.html,
            style: list.style
        }) + ';_default_script.template = _config["template"];' + '_default_script.style = _config["style"];define(function () {return _default_script;});})();', newFile));
        log.debug(f + " 编译完成!");
        return list.script;
    }
}

function getTargetPath(p) {
    let f = p.replace(/\\/g, '/');
    if (target) {
        const newFile = path.join(app_path, target).replace(/\\/g, '/');
        f = newFile + f.replace(file.replace('./', ''), '');
    }
    return f;
}

function saveFile(p, content) {
    let f = getTargetPath(p);
    mkdirsSync(path.dirname(f));
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

// 获取文件中的依赖
function getRequireList(str, f) {
    const reg = /require((\S*)")/g;
    const res = str.match(reg);
    let requireList = [];
    if (res == null) {
        return {
            list: requireList,
            str: str
        };
    }
    res.forEach(r => {
        if (r.substring(9, r.length - 1).substring(0, 1) != '.') {
            str = str.replace(r + ")", r.substring(9, r.length - 1));
        } else {
            if (r.indexOf('.vue') > -1) {
                const o = r.substring(0, r.length - 5) + '.min"';
                requireList.push(path.join(o.substring(9, o.length - 1)).replace(/\\/g, '/'));
                str = str.replace(r, o);
            } else {
                let o = r.substring(0, r.length - 1) + '.min"';
                const e = path.join(o.substring(9, o.length - 1)).replace(/\\/g, '/');
                let vp = path.join(app_path, path.dirname(f), e);
                vp = vp.substring(0, vp.length - 4);
                if (fs.existsSync(vp + '.js')) {
                    o = r;
                    requireList.push(e.substring(0, e.length - 4));
                } else {
                    requireList.push(e);
                }
                str = str.replace(r, o);
            }
        }
    });
    requireList.forEach((e, i) => {

    })
    return {
        list: requireList,
        str: str
    };
}

// 生成依赖配置文件
function changeContent(str, f) {
    const d = getRequireList(str, f);
    const data = readAllImport(d.list, f, getTargetPath(f));
    const modules = {};
    const listModules = [];
    data.forEach((l, i) => {
        if (modules[l] == null) {
            modules[l] = i;
            listModules.push(l);
        }
    });
    saveFile(f.replace('.min.js', '.config.json'), JSON.stringify(listModules));
    return d.str;
}

// 处理依赖项
function readAllImport(list, f, origin) {
    let data = [];
    list.forEach(e => {
        let vp = path.join(app_path, path.dirname(f), e);
        // 处理动态引入的js库
        if (fs.existsSync(vp + '.js')) {
            const newPath = path.join(path.dirname(f), e);
            let c = getTargetPath(newPath) + '.js';
            fs.writeFileSync(c, fs.readFileSync(vp + '.js'));
            data.push(path.relative(origin, c).substring(3).replace('.js', '').replace(/\\/g, '/'));
        } else {
            const newPath = path.join(path.dirname(f), e.replace('.min.min', '.min'));
            let c = getTargetPath(newPath) + '.js';
            data.push(path.relative(origin, c).substring(3).replace('.js', '').replace(/\\/g, '/'));
            if (!fs.existsSync(c)) {
                let l = newPath.replace(/\\/g, '/').replace('.min', '.vue');
                if (fs.existsSync(l)) {
                    compileFile(l);
                }
                l = newPath.replace(/\\/g, '/').replace('.min', '.ts');
                if (fs.existsSync(l)) {
                    const f = l;
                    const d = compileTs(fs.readFileSync(f));
                    const newFile = f.replace('.ts', '.min.js');
                    saveFile(newFile, changeContent('(function () {var exports = {}; ' + d + ' define(function () {return exports;});})();', newFile));
                }
            }
            const d = fs.readFileSync(c).toString();
            const b = getRequireList(d, f);
            data = readAllImport(b.list, newPath, origin).concat(data);
        }
    });
    return data;
}

function initDist(file, target) {
    if (!fs.existsSync(path.join(app_path, file))) {
        fs.mkdirSync(path.join(app_path, file));
    }
    if (!fs.existsSync(path.join(app_path, file, '/pages'))) {
        fs.mkdirSync(path.join(app_path, file, '/pages'));
    }
    const route = [
        {
            "path": "/",
            "component": "./pages/index"
        },
        {
            "path": "/about",
            "component": "./pages/about"
        }
    ];
    fs.writeFileSync(path.join(app_path, file, '/route.json'), JSON.stringify(route, null, 2));
    fs.copyFileSync(path.join(__dirname, '/index.html'), path.join(app_path, file, '/index.html'));
    fs.copyFileSync(path.join(__dirname, '/index.vue'), path.join(app_path, file, '/pages/index.vue'));
    fs.copyFileSync(path.join(__dirname, '/about.vue'), path.join(app_path, file, '/pages/about.vue'));
}