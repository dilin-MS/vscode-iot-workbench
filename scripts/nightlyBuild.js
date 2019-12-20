if (process.env.TRAVIS_EVENT_TYPE === "cron") {
    const packageJson = JSON.parse(fs.readFileSync('package.json'));

    const nightlyBuildName = "vscode-iot-workbench-nightly";
    const nightlyBuildDisplayName = "Azure IoT Device Workbench (Nightly)";
    const nightlyBuildPublisher = "dilin";
    packageJson.name = nightlyBuildName;
    packageJson.displayName = nightlyBuildDisplayName;
    packageJson.publisher = nightlyBuildPublisher;
    packageJson.aiKey = process.env['TEST_AIKEY'];

    const nightlyBuildVersion = yyyymmdd();
    packageJson.version = nightlyBuildVersion;

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
}

function yyyymmdd() {
  const date = new Date();
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return '' + y + (m < 10 ? '0':'') + m + (d < 10 ? '0' : '') + d;
}