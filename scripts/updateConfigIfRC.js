const fs = require('fs');

/**
 * If RC release, modify package.json and related template files.
 * TRAVIS_TAG =~ /^v?[0-9]+\.[0-9]+\.[0-9]+-[rR][cC]/:  RC release (eg. v0.10.18-rc, v0.10.18-rc2, etc.)
 */
if (process.env.TRAVIS_TAG) {
    const isTestVersion = /^v?[0-9]+\.[0-9]+\.[0-9]+-[rR][cC]/.test(process.env.TRAVIS_TAG || '');

    if (isTestVersion) {
      const packageJson = JSON.parse(fs.readFileSync('package.json'));

      const testName = "test-hawk-project-rc";
      const testDisplayName = "Test Hawk Project RC";
      const testPublisher = "dilin";
      modifyPackageJsonForNonProduction(packageJson, testName, testDisplayName, testPublisher);

      // Modify extensionId in template files
      const extensionIdPattern = /dilin.test-hawk-project/g;
      const rcExtensionId = 'dilin.test-hawk-project-rc';

      const arm7DevcontainerJsonFile = "resources/templates/arm7/devcontainer.json";
      const arm8DevcontainerJsonFile = "resources/templates/arm8/devcontainer.json";
      const x86DevcontainerJsonFile = "resources/templates/x86/devcontainer.json";
      const files = [arm7DevcontainerJsonFile, arm8DevcontainerJsonFile, x86DevcontainerJsonFile];
      files.forEach(filePath => {
        const originalJsonFile = fs.readFileSync(filePath).toString();
        const replaceJson = originalJsonFile.replace(extensionIdPattern, rcExtensionId);
        fs.writeFileSync(filePath, replaceJson);
      });

      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    }
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