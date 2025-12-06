const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withPodfileFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = await fs.promises.readFile(file, 'utf8');
      
      // Check if already patched to avoid duplication
      if (contents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        return config;
      }

      // Add the fix to the beginning of the post_install block
      const regex = /post_install do \|installer\|/;
      
      if (regex.test(contents)) {
        contents = contents.replace(
          regex,
          `post_install do |installer|
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end`
        );
        await fs.promises.writeFile(file, contents);
      } else {
        console.warn('Could not find post_install block in Podfile to patch');
      }

      return config;
    },
  ]);
};

module.exports = withPodfileFix;
