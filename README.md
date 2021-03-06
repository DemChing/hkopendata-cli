# hkopendata-cli
Command line interface for managing supplementary data in NPM package [hkopendata](https://github.com/DemChing/hkopendata).

## Installation
Please __DO NOT__ install globally.
```
npm i hkopendata-cli
```

To use this CLI, you need to install `npx` if you did not install before. It is recommended to install globally as it is a useful package to execute binaries in local package.
```
npm i -g npx
```

## Information
This cli will create a directory `.hkopendata` in the project root (`process.env.PWD`) if not exist. All data will be stored in it. Modify or delete files inside with caution or unexpected error may occur.

For more information, check [here](https://github.com/DemChing/hkopendata/tree/master/downloads#readme).

## Usage
### List downloaded data
```
npx hkopendata list
```

### Update or download data
By default, it will update all outdated files in `.hkopendata`
```
// update outdated files
npx hkopendata pull

// get latest files from github (https://github.com/DemChing/hkopendata/tree/master/downloads)
// Use space to separate multiple packages or files
npx hkopendata pull [package|file]
```

### Options
```
  -V, --version            output the version number
  -a, --all                select all files
  -p, --package <package>  select specific package, use comma to separate multiple packages
  -f, --file <file>        select specific file name, use comma to separate multiple files
  -y, --yes                yes to all
  -F, --force              force update
  -h, --help               display help for command
```