#!/usr/bin/env node

const commander = require("commander");
const inquirer = require("inquirer");
const http = require('https');
const path = require("path");
const fs = require('fs');
const chalk = require("chalk");

const {
    DATA_PATH,
    HISTORY_PATH,
    DOWNLOADS_PATH
} = require("../path");

require("../postinstall");

let history = require(HISTORY_PATH),
    downloads;

function checkDownloads(force) {
    let retrieve = (callback) => {
        console.log("Retrieving latest", chalk.blue("downloads.json"));
        http.get("https://raw.githubusercontent.com/DemChing/hkopendata/master/downloads.json", (res) => {
            if (res.statusCode == 200) {
                const file = fs.createWriteStream(DOWNLOADS_PATH, "utf8");
                res.pipe(file);
                file.on("finish", () => {
                    callback();
                    file.close();
                })
            } else {
                callback(true);
            }
        }).on("error", (err) => {
            fs.unlinkSync(path);
            callback(true);
        });
    }
    return new Promise((resolve, reject) => {
        try {
            if (force) {
                retrieve((err) => err ? reject() : resolve());
            } else {
                require(DOWNLOADS_PATH);
                resolve();
            }
        } catch (e) {
            retrieve((err) => err ? reject() : resolve());
        }
    })
}

function downloadFile(list) {
    return new Promise((resolve) => {
        const parts = 50,
            size = list.reduce((p, c) => p + c.size, 0);
        let downloaded = 0,
            updateProgress = () => {
                let progress = Math.floor(downloaded / size * parts);
                if (progress > parts) progress = parts;
                let bar = chalk.green("█").repeat(progress) + chalk.red("░").repeat(parts - progress),
                    str = `  ${["─","│", "╱", "╲"][Math.floor(Date.now() / 125) % 4]} Downloading: ${bar} ${downloaded}/${size}\r`;
                if (downloaded >= size) {
                    resolve();
                }
                process.stdout.write(str)
            };
        list.map((file, i) => {
            http.get(`https://raw.githubusercontent.com/DemChing/hkopendata/master/downloads/${file.path}`, (res) => {
                if (res.statusCode == 200) {
                    let filePath = `${DATA_PATH}/${file.path}`;

                    if (!fs.existsSync(path.dirname(filePath))) {
                        fs.mkdirSync(path.dirname(filePath))
                    }
                    const f = fs.createWriteStream(filePath, "utf8");
                    res.pipe(f);
                    res.on("data", (chunk) => {
                        downloaded += chunk.length;
                        updateProgress();
                    })
                    f.on("finish", () => {
                        f.close();
                    })
                }
            })
        })
    })
}

async function getDownloads() {
    try {
        await checkDownloads(commander.force);
        downloads = require(DOWNLOADS_PATH);
    } catch (e) {
        console.error(`Cannot retrieve ${chalk.blue("downloads.json")}`);
    }
}

function getSelected(target, isHistory) {
    if (target.length == 0 && !commander.file && !commander.package && !commander.all) return history;
    let arr = isHistory ? history : downloads;
    if (commander.all) return arr;
    if (target.length > 0) {
        arr = arr.filter(v => target.reduce((p, c) => p || v.path.indexOf(c) != -1 || (v.package && v.package.indexOf(c) != -1), false));
    }
    if (commander.file) {
        let files = commander.file.split(",");
        arr = arr.filter(v => files.reduce((p, c) => p || v.path.indexOf(c) != -1, false));
    }
    if (commander.package) {
        let packages = commander.package.split(",");
        arr = arr.filter(v => packages.reduce((p, c) => p || (v.package && v.package.indexOf(c) != -1), false));
    }
    return arr;
}

function checkInstalled(callback) {
    const exec = require('child_process').exec;
    exec("npm ls hkopendata", (err) => {
        callback(err ? true : false);
    });
}

function processByte(byte) {
    const units = ["B", "KB", "MB", "GB"];
    let time = 0;
    while (byte > 1024) {
        byte /= 1024;
        time++;
    }
    return `${byte.toFixed(2)} ${units[time]}`
}

checkInstalled((err) => {
    if (err) {
        console.error("hkopendata is not installed")
    } else {
        commander
            .name("hkopendata")
            .version("0.1.0")
            .option("-a, --all", "select all files")
            .option("-p, --package <package>", "select specific package, use comma to separate multiple packages")
            .option("-f, --file <file>", "select specific file name, use comma to separate multiple files")
            .option("-y, --yes", "yes to all")
            .option("-F, --force", "force update");

        commander
            .command("pull [target...]")
            .description("update or download files")
            .action(async (target) => {
                await getDownloads();
                let list = getSelected(target),
                    installed = getSelected(target, true),
                    final = list.filter(v => installed.reduce((p, c) => p && (commander.force || c.path != v.path || c.md5 != v.md5), true));

                let size = final.reduce((p, c) => p + c.size, 0),
                    count = final.length,
                    ignored = list.length - final.length;

                if (list.length > 0) {
                    console.log(`Found ${chalk.yellow(list.length)} file(s):`);
                    console.log(list.map(v => `- ${chalk.blue(v.path)}`).join("\n") + "\n");

                    if (count > 0) {
                        let prefilled = {};
                        if (commander.yes) {
                            prefilled.continue = true
                        }
                        inquirer
                            .prompt({
                                type: "confirm",
                                name: "continue",
                                message: `Are you sure to download ${chalk.yellow(count)} file(s) (~${chalk.green(processByte(size))}${ignored ? `, ${chalk.red(ignored)} file(s) ignored` : ""})?`,
                                default: false,
                            }, prefilled)
                            .then((ans) => {
                                if (ans.continue) {
                                    console.log(`Download ${chalk.green(count)} file(s)`)
                                    return downloadFile(final)
                                } else {
                                    return Promise.reject()
                                }
                            })
                            .then(() => {
                                process.stdout.clearLine();
                                console.log(`${chalk.green("Completed")}\n`);

                                final.map(file => {
                                    if (history.filter(v => v.path == file.path).length > 0) {
                                        history = history.map(v => {
                                            if (v.path == file.path) {
                                                v.md5 = file.md5;
                                                v.size = file.size;
                                            }
                                            if (file.package) v.package = file.package;
                                            return v;
                                        })
                                    } else {
                                        let record = {
                                            path: file.path,
                                            size: file.size,
                                            md5: file.md5,
                                        };
                                        if (file.package) record.package = file.package;
                                        history.push(record)
                                    }
                                })
                                console.log("Update records");
                                fs.writeFile(HISTORY_PATH, JSON.stringify(history), err => {
                                    if (err) console.log(`${chalk.red("Failed")}`);
                                    else console.log(`${chalk.green("Completed")}`);
                                })

                            })
                            .catch(() => {
                                console.log(`${chalk.red("Aborted")}`)
                            })
                    } else {
                        console.log("All files are up to date");
                    }
                } else {
                    console.log("No record found");
                }
            })

        commander
            .command("list [target...]")
            .description("list downloaded files")
            .action(async (target) => {
                await getDownloads();
                let list = getSelected(target, true);
                if (list.length > 0) console.log(list.map(v => `- ${chalk.blue(v.path)}`).join("\n"));
                else console.log("No record found");
            })

        commander.parse(process.argv)

        if (commander.args.length == 0) commander.outputHelp();
    }
});