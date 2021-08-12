const {
    DATA_PATH,
    HKOPENDATA_ROOT
} = require('../path');

module.exports = opts => new Promise(resolve => {
    require('./downloads').Get(opts)
        .then(Catalog => {
            const History = require('./history').Get();
            const MD5 = require('./md5');
            const fs = require('fs');
            const Installed = [];

            if (opts.force || !History) {
                Catalog.map(entry => {
                    let directory,
                        history = History ? History.filter(h => h.path === entry.path)[0] : false;

                    if (fs.existsSync(`${DATA_PATH}/${entry.path}`)) {
                        directory = DATA_PATH;
                    } else if (fs.existsSync(`${HKOPENDATA_ROOT}/${entry.path}`)) {
                        directory = HKOPENDATA_ROOT;
                    }

                    if (history && !directory) directory = DATA_PATH;

                    if (!directory) return Installed.push(Promise.resolve({
                        ...entry,
                        installed: false
                    }));

                    Installed.push(MD5(`${directory}/${entry.path}`)
                        .then(res => res ? {
                            ...entry,
                            installed: {
                                directory,
                                md5: res === 'File Not Exist' ? false : res,
                                modified: history && history.md5 !== res,
                                removed: res === 'File Not Exist',
                            }
                        } : false))
                });
            } else if (History) {
                let history = {};
                History.map(({
                    path,
                    md5
                }) => history[path] = md5);

                Catalog.map(v => {
                    let installed = v.path in history ? {
                        directory: DATA_PATH,
                        md5: history[v.path],
                        modified: false,
                        removed: !fs.existsSync(`${DATA_PATH}/${v.path}`)
                    } : false;
                    Installed.push(Promise.resolve({
                        ...v,
                        installed
                    }))
                })
            }

            return Promise.all(Installed)
                .then(res => resolve(res.filter(v => v !== false)));
        })
        .catch(() => resolve(false))
})