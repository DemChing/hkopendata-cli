const Path = require('path');
const LOCAL_PATH = `${process.env.PWD}/.hkopendata`;
const HKOPENDATA_ROOT = Path.dirname(require.resolve('hkopendata/data')).replace(/\\/g, '/');
const DOWNLOADS_NAME = `downloads.json`;
const HISTORY_NAME = `history.json`;

module.exports = {
    LOCAL_PATH: LOCAL_PATH,
    DOWNLOADS_NAME: DOWNLOADS_NAME,
    HISTORY_NAME: HISTORY_NAME,
    DATA_PATH: `${LOCAL_PATH}/data`,
    HISTORY_PATH: `${LOCAL_PATH}/${HISTORY_NAME}`,
    DOWNLOADS_PATH: `${LOCAL_PATH}/${DOWNLOADS_NAME}`,
    HKOPENDATA_ROOT: HKOPENDATA_ROOT,
    HKOPENDATA_PATH: `${HKOPENDATA_ROOT}/${DOWNLOADS_NAME}`,
    createIfNotExist: dest => {
        const fs = require('fs');
        let dir = Path.dirname(dest);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, {
            recursive: true
        })
    },
};