const chalk = require('chalk');
module.exports = {
    Success: chalk.green,
    Error: chalk.red,
    Warn: chalk.yellow,
    Bold: chalk.bold,
    Chalk: (text, fn) => {
        if (typeof chalk[fn] === 'function') return chalk[fn](text);
        return text;
    }
}