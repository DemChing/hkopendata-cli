const LOCAL_PATH = `${process.env.PWD}/.hkopendata`;

module.exports = {
    LOCAL_PATH: LOCAL_PATH,
    DATA_PATH: `${LOCAL_PATH}/data`,
    HISTORY_PATH: `${LOCAL_PATH}/history.json`,
    DOWNLOADS_PATH: `${LOCAL_PATH}/downloads.json`,
    HKOPENDATA_PATH: `${require("path").dirname(require.resolve("hkopendata/data"))}/downloads.json`
};