const fs = require('fs');

/**
 * If Nightly Build, modify package.json and related template files.
 * TRAVIS_EVENT_TYPE === "cron" :                       Nightly Build
 */
if (process.env.TRAVIS_EVENT_TYPE === "cron") {
  const packageJson = JSON.parse(fs.readFileSync('package.json'));

  const nightlyBuildName = "test-hawk-project-nightly";
  const nightlyBuildDisplayName = "Test HAWK Project (Nightly)";
  const nightlyBuildPublisher = "dilin";
  modifyPackageJsonForNonProduction(packageJson, nightlyBuildName, nightlyBuildDisplayName, nightlyBuildPublisher);

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
}

/**
 * Update package.json with test name, displayName, publisher, ai aky.
 * Trim version number. Delete extension icon.
 * @param {*} packageJson package json oject
 * @param {*} testName test extension name
 * @param {*} testDisplayName test extension displate name
 * @param {*} testPublisher test publisher
 */
function modifyPackageJsonForNonProduction(packageJson, testName, testDisplayName, testPublisher) {
  packageJson.name = testName;
  packageJson.displayName = testDisplayName;
  packageJson.publisher = testPublisher;

  packageJson.aiKey = process.env['TEST_AIKEY'];

  const indexOfDash = packageJson.version.indexOf('-');
  if (indexOfDash > 0) {
    packageJson.version = packageJson.version.substring(0, indexOfDash);
  }

  delete packageJson.icon;
}