/* eslint-disable no-console */

const errorHandler = error => {
  console.error(error);
  process.exit(1);
};

module.exports = errorHandler;
