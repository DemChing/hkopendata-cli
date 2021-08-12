module.exports = path => new Promise(resolve => {
    const fs = require('fs');

    if (fs.existsSync(path)) {
        const crypto = require('crypto');
        let hash = crypto.createHash('md5');
        fs.createReadStream(path)
            .on('data', data => hash.update(data))
            .on('end', () => resolve(hash.digest('hex')))
            .on('error', () => resolve(false));
    } else {
        return resolve('File Not Exist');
    }
})