const fs = require('fs');
const progress = require('cli-progress');
const Fetch = require('./fetch');

const {
    DOWNLOADS_NAME,
    DOWNLOADS_PATH,
    DATA_PATH,
    LOCAL_PATH,
    HKOPENDATA_ROOT,
    createIfNotExist
} = require('../path');
const BarConfig = {
    format: ' {bar} | "{file}" | {value}/{total}',
    hideCursor: true,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    clearOnComplete: true,
    stopOnComplete: true
};

const Get = async (opts, retry = 0) => {
    let dest = '',
        catalog = [];
    if (fs.existsSync(dest = `${LOCAL_PATH}/${DOWNLOADS_NAME}`) || fs.existsSync(dest = `${HKOPENDATA_ROOT}/${DOWNLOADS_NAME}`)) {
        catalog = JSON.parse(fs.readFileSync(dest, 'utf-8'));
    } else if (retry < 3) {
        await require('./downloads').Fetch();
        return Get(opts, retry + 1);
    } else {
        throw false;
    }

    return catalog.filter(entry => {
        let package = Boolean(opts.package && opts.package.length),
            file = Boolean(opts.file && opts.file.length);
        if ((package && opts.package.includes(entry.package)) || (file && opts.file.includes(entry.path)) || opts.all) return true;
        if (package || file) return false;
        return true;
    });
};

module.exports = {
    FetchMultiple: entries => new Promise(resolve => {
        let completed = [];
        console.log(`Retrieve ${entries.length} file(s)...`);

        const MultiBar = new progress.MultiBar(BarConfig);
        entries.map(entry => {
            const Bar = MultiBar.create(entry.size, 0, {
                file: entry.path
            });
            Fetch(`downloads/${entry.path}`, res => {
                let dest = `${DATA_PATH}/${entry.path}`;
                createIfNotExist(dest);

                const file = fs.createWriteStream(dest),
                    size = parseInt(res.headers['content-length']);

                Bar.setTotal(size);
                res.pipe(file);

                res.on('data', data => Bar.increment(data.length))
                    .on('error', () => Bar.stop());

                file.on('finish', () => {
                    file.close();
                    completed.push(entry)
                });
            })
        });

        MultiBar.on('stop', () => resolve(completed));
    }),
    Fetch: () => new Promise(resolve => {
        console.log(`Retrieve latest ${DOWNLOADS_NAME}...`);

        Fetch(`data/${DOWNLOADS_NAME}`, res => {
            if (res) {
                createIfNotExist(DOWNLOADS_PATH);

                const file = fs.createWriteStream(DOWNLOADS_PATH),
                    size = parseInt(res.headers['content-length']),
                    Bar = new progress.Bar(BarConfig);

                Bar.start(size, 0);

                res.pipe(file);

                res.on('data', data => Bar.increment(data.length))
                    .on('error', () => {
                        Bar.stop();
                        resolve(false);
                    });

                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else {
                resolve(false);
            }
        })
    }),
    Get,
}