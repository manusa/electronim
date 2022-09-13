# How to Contribute

TODO

## Running tests

This project uses some ECMAScript modules for in-browser page rendering.

To be able to test this with Jest, we need to follow some considerations:
- [Jest: ECMAScript Modules](https://jestjs.io/docs/ecmascript-modules)
- [Jest: Meta: Native support for ES Modules #9430 (issue)](https://github.com/facebook/jest/issues/9430)

To run the tests, in case we're using an older version of NodeJS (<19), we need to set the environment variable `NODE_OPTIONS` to `--experimental-vm-modules`:
```bash
NODE_OPTIONS=--experimental-vm-modules npm test
```
