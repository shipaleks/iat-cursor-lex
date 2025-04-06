const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'iat-cursor-lex',
  location: 'europe-central2'
};
exports.connectorConfig = connectorConfig;

