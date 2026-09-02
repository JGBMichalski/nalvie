/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'SessionActivity',
  // The lock screen has to keep showing a live countdown while no app code is running
  deploymentTarget: '16.2',
  entitlements: {},
};
