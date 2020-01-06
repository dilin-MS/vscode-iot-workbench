const fs = require('fs');

/**
 * If Production release, update configuration in package.json.
 * BUILD_SOURCEBRANCHNAME =~ /^v?[0-9]+\.[0-9]+\.[0-9]+$/: Production release (eg. v0.10.18)
 */
console.log(process.env.BUILD_SOURCEBRANCHNAME);
if (process.env.BUILD_SOURCEBRANCHNAME) {
    const isProduction = /^v?[0-9]+\.[0-9]+\.[0-9]+$/.test(process.env.BUILD_SOURCEBRANCHNAME || '');

    if (isProduction) {
      const packageJson = JSON.parse(fs.readFileSync('package.json'));

      // Update resource link
      const codeGenUrl = "https://aka.ms/iot-codegen-cli-for-workbench";
      packageJson.codeGenConfigUrl = codeGenUrl;

      // Update production AI Key
      packageJson.aiKey = process.env['PROD_AIKEY'];

      console.log(packageJson);

      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    }
  }
