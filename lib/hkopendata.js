const exec = require('child_process').exec;

const CheckInstalled = callback => {
    exec('npm ls hkopendata && npm show hkopendata version', (err, stdout) => {
        if (err) callback(false);
        else {
            let m = stdout.match(/hkopendata@(\d+\.\d+\.\d+)/),
                m2 = stdout.match(/^(\d+\.\d+\.\d+)$/m);
            callback(m ? m[1] : true, m2 ? m2[1] : false);
        }
    })
}

const Install = callback => {
    const child = exec('npm i hkopendata', err => callback(!Boolean(err)));
    child.stdout.on('data', process.stdout.write)
    child.stderr.on('data', process.stderr.write)
}

module.exports = {
    CheckInstalled,
    Install
}