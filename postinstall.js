const {
    LOCAL_PATH,
    HISTORY_PATH,
    DOWNLOADS_PATH,
    HKOPENDATA_PATH
} = require("./path");
const fs = require("fs");
const chalk = require("chalk");

console.error = (str) => {
    console.log(`${chalk.red("error:")} ${str.replace(/^error: /i, "")}`);
    process.exit(1);
}

try {
    if (!fs.existsSync(LOCAL_PATH)) {
        console.log(`Create local directory ${chalk.blue(".hkopendata")}`)
        fs.mkdirSync(LOCAL_PATH);
        console.log(chalk.green("Completed"))
    };
} catch (e) {
    console.error(chalk.red("Failed"))
}
try {
    if (!fs.existsSync(HISTORY_PATH)) {
        console.log(`Create ${chalk.blue("history.json")}`)
        fs.writeFileSync(HISTORY_PATH, "[]");
        console.log(chalk.green("Completed"))
    }
} catch (e) {
    console.error(chalk.red("Failed"))
}

try {
    if (!fs.existsSync(DOWNLOADS_PATH) && fs.existsSync(HKOPENDATA_PATH)) {
        console.log(`Copy ${chalk.blue("downloads.json")} from package ${chalk.yellow("hkopendata")}`)
        fs.copyFileSync(HKOPENDATA_PATH, DOWNLOADS_PATH);
        console.log(chalk.green("Completed"))
    }
} catch (e) {
    console.error(chalk.red("Failed"))
}