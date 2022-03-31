// import chalk from "chalk";
import fs from 'fs';
import ncp from "ncp";
import path from "path";
import { promisify } from "util";
import { fileURLToPath } from 'url';
// import {execa} from 'execa';
import {projectInstall} from 'pkg-install';
import Listr from 'listr';
const access = promisify(fs.access);
const copy = promisify(ncp);
const chalk = require('chalk');
const execa = require('execa');
async function copyTemplateFiles(options) {
    return copy(options.templateDirectory, options.targetDirectory,{
        clobber: false,
    });
}

async function initGit(options){
    const result =  await execa('git', ['init'], {
        cwd: options.targetDirectory,
    });
    if(result.failed){
        return Promise.reject(new Error('Failed to initialize Git'));
    }
    return;
}
export async function createProject(options){
    options = {
        ...options,
        targetDirectory : options.targetDirectory || process.cwd(),
    };
    const currentFileUrl = import.meta.url;
    const templateDir = path.resolve(
        fileURLToPath(import.meta.url),
        '../../templates',
        options.template.toLowerCase()
    );

    options.templateDirectory = templateDir;
try{
    await access(templateDir, fs.constants.R_OK);
}
catch(e){
    console.error('%s Invalid template name', chalk.red.bold('ERROR'));
    process.exit(1);
}
const tasks = new Listr([
    {
        title : 'Copy Project Files',
        task : () => copyTemplateFiles(options),
    },
    {
        title: 'Initialize Git',
        task : () => initGit(options),
        enabled : () => options.git,
    },
    {
        title: 'Install dependencies',
        task: ()=>  projectInstall({
             cwd: options.targetDirectory,
        }),
        skip:()=> !options.runInstall? 'Pass --install to automatically install' : undefined,
    },
]);
await tasks.run();
await copyTemplateFiles(options);
console.log('%s Project ready', chalk.green.bold('DONE'));
return true;
}