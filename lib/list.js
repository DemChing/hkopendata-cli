module.exports = (opts, type = 'list') => new Promise(async resolve => {
    try {
        const Installed = await require('./installed')(opts);
        const Digest = {
            stats: {
                'up to date': {
                    color: 'blue',
                    entries: [],
                },
                'available to download': {
                    color: 'green',
                    entries: [],
                },
                missed: {
                    color: 'red',
                    entries: [],
                },
                outdated: {
                    color: 'yellow',
                    entries: [],
                },
                modified: {
                    color: 'magenta',
                    entries: [],
                },
            },
            count: 0,
        };
        Installed.map(entry => {
            if (!entry.installed) {
                if (!opts.all && !opts.file && !opts.package) return;
                Digest.stats['available to download'].entries.push(entry);
            } else if (entry.installed.removed) {
                Digest.stats.missed.entries.push(entry);
            } else if (entry.installed.modified) {
                Digest.stats.modified.entries.push(entry);
            } else if (entry.md5 !== entry.installed.md5) {
                Digest.stats.outdated.entries.push(entry);
            } else {
                Digest.stats['up to date'].entries.push(entry);
            }
            Digest.count++;
        })

        resolve(Digest);
    } catch (e) {
        resolve(false);
    }
})