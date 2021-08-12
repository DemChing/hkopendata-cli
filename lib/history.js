const fs = require('fs');
const {
    HISTORY_NAME,
    HISTORY_PATH,
    createIfNotExist,
} = require('../path');

const Get = () => {
    if (fs.existsSync(HISTORY_PATH)) {
        try {
            return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8')) || [];
        } catch (e) {}
    }
    return false;
}
module.exports = {
    Get,
    Merge: entries => new Promise(resolve => {
        const History = Get() || [];

        let inHistory = History.map(v => v.path),
            append = [];
        entries.map(entry => {
            let index = inHistory.indexOf(entry.path);
            if (index === -1) {
                append.push(entry)
            } else {
                History[index].md5 = entry.md5;
                History[index].size = entry.size;
            }
        })

        createIfNotExist(HISTORY_PATH);
        fs.writeFile(HISTORY_PATH, JSON.stringify(History.concat(append)), err => resolve(!err));
    })
}