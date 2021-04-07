#!/usr/bin/env node

const program = require('commander')
const log = require('tracer').colorConsole();
const build = require('./build');
const {version, description} = require("../package.json");

program
    .version(version)
    .description(description)
program
    .command('* <tpl> <arg>')
    .option('-o, --output <target>', '编译目录,默认是源文件同级')
    .action(function (tpl, arg, options) {
        log.info('编译单个或文件夹下的所有vue文件');
        if (tpl && arg) {
            build(tpl, arg, options.output);
        } else {
            log.error('正确命令例子：vue-build-js main.vue all 编译所有, vue-build-js main.vue watch 监听修改编译');
        }
    })
program.parse(process.argv)