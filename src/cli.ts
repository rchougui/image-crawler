import os from 'node:os';
import { main } from './main';

const [_, __, url, depthArg] = process.argv;

if (!url || !depthArg) {
  console.log('Please provide a valid URL and Depth limit');
  console.log('Usage: node crawler.js [URL] [DepthLimit]');
  process.exit(0);
}

const maxDepth = parseInt(depthArg, 10);

if (isNaN(maxDepth)) {
  console.log('Invalid depthlimit');
  process.exit(0);
}

main(url, maxDepth, os.availableParallelism());
