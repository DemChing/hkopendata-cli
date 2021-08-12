const HKOPENDATA = 'hkopendata';
const BOLD_HKOPENDATA = '\033[1m' + HKOPENDATA + '\033[0m';

module.exports = {
    name: HKOPENDATA,
    nameBold: BOLD_HKOPENDATA,
    description: `Data manangement tools for NPM package ${BOLD_HKOPENDATA} (https://www.npmjs.com/package/${HKOPENDATA}).`,
    issues: `Visit https://github.com/DemChing/hkopendata-cli/issues to report issues.`,
    notInstalled: `${BOLD_HKOPENDATA} not installed.`,
    installConfirm: `Do you want to install it now?`,
    installNow: `Install ${BOLD_HKOPENDATA} now...`,
    installManually: `Run \`npm i ${HKOPENDATA}\` or \`yarn add ${HKOPENDATA}\` to install manually.`,
    updateManually: `Run \`npm i ${HKOPENDATA}@latest\` or \`yarn add ${HKOPENDATA}@latest\` to update manually.`,
    pullSuggest: `Run \`${HKOPENDATA} pull\` to update or fix missing files.`,
    pullSuggestForce: `Run \`${HKOPENDATA} pull --force\` to force download files.`,
    selectAction: `Select an action:`,
    selectFiles: `Select which file(s) to be processed:`,
    downloadConfirm: `Proceed to download?`,
    downloadCancel: `Download cancelled`,
    actionSelectFiles: ['Skip all', 'Process all', 'Select manually'],
    updateHistory: `Update history...`,
    failDownload: `Fail to retrieve \`downloads.json\`.`,
    networkIssue: `Please check your network connection and retry.`,
}