/* eslint-disable @typescript-eslint/no-var-requires */
// This file is needed to load the worker.ts file with ts-node in developement environment 
// it won't affect built code in production
// reference: https://github.com/TypeStrong/ts-node/issues/676#issuecomment-470898116

const path = require('path');
require('ts-node').register();
require(path.resolve(__dirname, './worker.ts'));
