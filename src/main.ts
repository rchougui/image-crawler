import path from 'path';
import { Worker } from 'worker_threads';
import fs from 'fs';
export async function main(startUrl: string, maxDepth: number, maxWorkers = 4) {
  // Array to store available worker threads
  const _freeWorkers: Worker[] = [];
  // Queue to hold the tasks to be processed
  const _queue: WorkTask[] = [];
  // Set to track currently processing tasks
  const _processing = new Set<string>();
  // Set to track completed tasks
  const _done = new Set<string>();

  let _results: ImageResult[] = [];

  const runWorkerTask = (worker: Worker, task: WorkTask) => {
    _processing.add(task.url);
    // Send task to the worker thread
    worker.postMessage({ url: task.url, depth: task.depth });
  };
  const onfreeWorker = () => {
    for (let i = 0; i < _freeWorkers.length; i++) {
      const url = getNextTask();
      if (url == undefined && _processing.size == 0) {
        // All tasks completed, exit the process
        done();
      }
      const freeWorker = _freeWorkers.pop();
      // If there is a free worker and a task, assign
      if (freeWorker && url) runWorkerTask(freeWorker, url);
    }
  };
  const addNewWorker = () => {
    const worker = new Worker(path.resolve(__dirname, './worker.js'));

    worker.on('message', (output: WorkerOutput) => {
      const { url, links } = output;
      // Add the found images to the results
      appendResults(output.images);
      // Remove the task from the processing set
      _processing.delete(url);
      // Add the task to the completed set
      _done.add(url);
      // Add new tasks to the queue
      _queue.push(...links);
      // Add the worker back to the freeWorkers array
      _freeWorkers.push(worker);
      // Check if there are more tasks to assign to free workers
      onfreeWorker();
    });

    worker.once('error', (err) => {
      console.error(err);
      // Handle errors and continue with free workers
      // @todo: spawn new workers on exit ?
      onfreeWorker();
    });

    // Add the new worker to the freeWorkers array
    _freeWorkers.push(worker);
  };

  const appendResults = (foundImages: ImageResult[]) => {
    // Concatenate the found images to the results array
    _results = [..._results, ...foundImages];
  };
  const getNextTask = () => {
    let nextTask: WorkTask | undefined;
    while (!nextTask && _queue.length > 0) {
      const task = _queue.shift();
      // Skip tasks being processed or already completed
      if (task && (_processing.has(task.url) || _done.has(task.url))) continue;
      // Skip tasks that exceed the maximum depth
      if (task && task.depth > maxDepth) continue;
      nextTask = task;
    }
    // Return the next task to be processed, if any
    return nextTask;
  };

  const done = () => {
    const data = JSON.stringify(_results, undefined, 2);
    fs.writeFileSync('./results.json', data);
    console.log(_results);
    process.exit(0);
  };

  // Create worker threads
  for (let i = 0; i < maxWorkers; i++) addNewWorker();
  // Add the initial task to the processing set
  _processing.add(startUrl);
  // Start the first task
  runWorkerTask(_freeWorkers[0], { url: startUrl, depth: 0 });
}

export type WorkTask = {
  url: string;
  depth: number;
};
export type ImageResult = {
  imageUrl: string;
  sourceUrl: string;
  depth: number;
};
export type WorkerOutput = {
  url: string;
  links: WorkTask[];
  images: ImageResult[];
};
