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
    .action(function (tpl, arg) {
        log.info('编译单个或文件夹下的所有vue文件');
        if (tpl && arg) {
            build(tpl, arg);
        } else {
            log.error('正确命令例子：vue-build-js main.vue all 编译所有, vue-build-js main.vue watch 监听修改编译');
        }
    })
program.parse(process.argv)