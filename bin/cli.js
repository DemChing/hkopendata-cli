const commander = require('commander');
const inquirer = require('inquirer');
const PackageJson = require('../package.json');
const Version = PackageJson.version;

const {
    CheckInstalled,
    Install
} = require('../lib/hkopendata');
const {
    Success,
    Error,
    Warn,
    Bold,
    Chalk,
} = require('../lib/color');
const Message = require('../lib/message');
const {
    Fetch,
    FetchMultiple,
} = require('../lib/downloads');

const Write = data => process.stdout.write(data);
const Section = (data, suf = 2, pre = 1) => {
    Write('\n'.repeat(pre));
    Write(data);
    Write('\n'.repeat(suf));
}
const OK = () => Section(Success('Completed'), 1, 0);
const FAIL = () => Section(Error('Failed'), 1, 0);

class Command extends commander.Command {
    createCommand(name) {
        if (name === 'info') return new commander.Command(name);
        const cmd = new Command(name);
        cmd.option('-a, --all', 'select all files')
            .option('-d, --detail', 'show detail')
            .option('-f, --file <files...>', 'select specific file(s), space separated')
            .option('-p, --package <packages...>', 'select specific package(s), space separated')
            .option('-y, --yes', 'yes to all')
            .option('-F, --force', 'force checking / update')
            .option('--skip-check', `do not check if ${Message.name} is installed`);

        return cmd;
    }
}

const Prerequisite = opts => new Promise(resolve => {
    let prefilled = {};
    if (opts.skipCheck) return resolve(true);
    if (opts.yes) prefilled.continue = true;
    CheckInstalled((currentVersion, latestVersion) => {
        if (!currentVersion) {
            Section(Message.notInstalled);
            return inquirer
                .prompt({
                    type: 'confirm',
                    name: 'continue',
                    message: Message.installConfirm,
                    default: false,
                }, prefilled)
                .then((ans) => {
                    if (ans.continue) {
                        Section(Message.installNow, 1)
                        Install(success => {
                            if (success) {
                                OK();
                                resolve(true);
                            } else {
                                FAIL();
                                Section(Message.installManually, 1);
                                resolve(false);
                            }
                        })
                    } else {
                        Section(Message.installManually, 1);
                        resolve(false);
                    }
                })
        } else if (typeof currentVersion === 'string') {
            if (latestVersion && currentVersion !== latestVersion) {
                Section(`${Bold(`${Message.name} ${Error(`v${latestVersion}`)}`)} is available to update.`, 1);
                Section(Message.updateManually, 3)
            } else {
                Section(`${Bold(`${Message.name} ${Warn(`v${currentVersion}`)}`)} ${latestVersion ? 'is up to date' : 'in use'}.`);
            }
        }
        return resolve(true);
    })
})

const toTable = arr => {
    arr = arr.flat().map(v => ` - ${v}`);
    let table = [],
        i = 0;
    while (i < arr.length) {
        let col = 0,
            row = [];
        while (col < 3 && i < arr.length) {
            row.push(arr[i]);
            i++;
            col++;
        }
        table.push(row)
    }

    let maxWidth = [0, 0, 0];
    table.map(row => {
        row.map((col, i) => {
            if (col.length > maxWidth[i]) maxWidth[i] = col.length;
        })
    });

    maxWidth = maxWidth.map(v => v + 4 - (v % 4));
    return table.map(row => row.map((col, i) => {
        return col + ' '.repeat(maxWidth[i] - col.length);
    }).join('')).join('\n');
}

const list = async (opts, type = 'list') => {
    if (opts.force) {
        let fetchSuccess = await Fetch();
        if (fetchSuccess) {
            OK();
        } else {
            FAIL();
        }
    }

    if (typeof currentVersion === 'string') {
        if (latestVersion && currentVersion !== latestVersion) {
            Section(`${Bold(`${Message.name} ${Error(`v${latestVersion}`)}`)} is available to update.`, 1);
            Section(Message.updateManually, 3)
        } else {
            Section(`${Bold(`${Message.name} ${Warn(`v${currentVersion}`)}`)} ${latestVersion ? 'is up to date' : 'in use'}.`);
        }
    }

    const List = await require('../lib/list')(opts, type);

    if (!List) {
        Section(`${Message.failDownload}\n${Message.networkIssue}`);
        return false;
    }

    let digest = [`${Bold(Success(List.count))} files`],
        detail = [];
    for (let key in List.stats) {
        let {
            digest: _digest,
            names
        } = parseStats({
            key,
            count: List.count,
            ...List.stats[key]
        });
        if (_digest) {
            digest.push(_digest);
            detail.push(names);
        }
    }

    Section(`Found ${digest.join(', ')}.`, 1);
    if (opts.detail) {
        Section(toTable(detail));
    }

    return List;
}

const parseStats = (opts) => {
    let digest = '',
        names = [];
    if (opts.entries.length) {
        digest = `${opts.entries.length === opts.count ? 'all' : Bold(Chalk(opts.entries.length, opts.color))} ${opts.key}`;
        names = opts.entries.map(v => Chalk(v.path, opts.color))
    }
    return {
        digest,
        names
    };
}

const program = new Command();

program
    .name(Message.name)
    .version(Version);

program
    .command('info')
    .description('show information of this project')
    .action(() => {
        Section(`> ${PackageJson.name} v${Version} by ${PackageJson.author}`, 1);
        Section(`  ${Message.description}`, 1);
        Section(`  ${Message.issues}`, 1);
    });

program
    .command('list')
    .description('list downloaded files')
    .action(async opts => {
        if (!(await Prerequisite(opts))) return;
        const List = await list(opts);
        if (!List) return;

        const {
            stats,
            count
        } = List;

        if (stats['up to date'].entries.length < count) Section(Message.pullSuggest, 1);
    })

program
    .command('pull')
    .description('get downloaded files from remote')
    .action(async opts => {
        if (!(await Prerequisite(opts))) return;

        const Query = opts => new Promise(resolve => {
            let prefilled = {},
                choices = Message.actionSelectFiles;
            if (opts.yes) prefilled.action = choices[1];
            else console.log();

            inquirer.prompt({
                type: 'list',
                name: 'action',
                message: `Found ${opts.digest}:\n\n${toTable(opts.names)}\n\n${Message.selectAction}`,
                default: choices[opts.default || 0],
                choices
            }, prefilled).then(ans => {
                if (ans.action === choices[0]) {
                    resolve([])
                } else if (ans.action === choices[1]) {
                    resolve(opts.files)
                } else {
                    inquirer.prompt({
                        type: 'checkbox',
                        name: 'files',
                        message: Message.selectFiles,
                        choices: opts.files,
                    }).then(ans => {
                        resolve(ans.files)
                    })
                }
            })
        })

        const Size = number => {
            let prefix = ['', 'k', 'm'],
                i = 0;
            while (number > 1e3) {
                number /= 1024;
                i++;
            }
            return `${parseFloat(number.toFixed(2))}${prefix[i]}b`;
        }

        const QueryDownload = (files, size) => new Promise(resolve => {
            if (files.length === 0) return resolve(false);
            let prefilled = {};
            if (opts.yes) prefilled.download = true;
            else console.log()
            inquirer.prompt({
                type: 'confirm',
                name: 'download',
                message: `${Message.downloadConfirm} ( ${files.length} file(s) ~${Size(size)} )`
            }).then(ans => resolve(ans.download))
        })

        const List = await list(opts, 'pull');
        if (!List) return;

        const {
            count,
            stats
        } = List;

        if (stats['up to date'].entries.length === count) {
            if (!opts.force) Section(Message.pullSuggestForce);
            return;
        }

        const AllEntries = [];
        let processFiles = [];
        for (let key in stats) {
            AllEntries.push(...stats[key].entries);
            if (key === 'up to date') continue;
            if (!stats[key].entries.length) continue;
            processFiles = processFiles.concat(await Query({
                ...opts,
                default: key === 'modified' || key === 'removed' ? 0 : 1,
                files: stats[key].entries.map(v => v.path),
                ...parseStats({
                    key,
                    count,
                    ...stats[key],
                })
            }))
        }
        let size = AllEntries.filter(v => processFiles.includes(v.path))
            .reduce((p, c) => p += c.size || 100, 0)

        if (await QueryDownload(processFiles, size)) {
            Section(`${Bold(`${Chalk(processFiles.length, processFiles.length ? 'green' : 'red')} file(s)`)} will be downloaded.`);

            const ProcessEntries = AllEntries.filter(v => processFiles.includes(v.path));
            let completed = await FetchMultiple(ProcessEntries);

            if (completed.length === ProcessEntries.length) {
                OK();
            } else if (completed.length === 0) {
                FAIL();
            } else {
                Section(Warn(`Completed ${completed.length} / ${ProcessEntries.length}`), 1, 0);
            }
            const UpdateEntries = AllEntries.filter(v => !processFiles.includes(v.path) && v.installed)
                .map(v => {
                    if (!v.installed.removed && !v.installed.modified) v.md5 = v.installed.md5;
                    return v;
                })
                .concat(completed)
                .map(v => {
                    let _v = JSON.parse(JSON.stringify(v));
                    delete _v.installed;
                    return _v;
                })
            if (UpdateEntries.length) {
                Section(Message.updateHistory, 1);
                if (await require('../lib/history').Merge(UpdateEntries)) {
                    OK();
                } else {
                    FAIL();
                }
            }
        } else {
            Section(Warn(Message.downloadCancel));
        }
    })

program.parseAsync();