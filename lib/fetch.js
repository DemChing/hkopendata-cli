const HOST = 'raw.githubusercontent.com';
const BASE_PATH = 'DemChing/hkopendata/master';

module.exports = (path, callback) => {
    require('https').get({
            host: HOST,
            path: `${BASE_PATH}/${path}`,
            method: 'GET'
        }, res => {
            if (res.statusCode === 200) {
                callback(res);
            } else {
                callback(false);
            }
        })
        .on('error', err => (console.error(err), callback(false)))
}