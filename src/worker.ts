import { threadId, parentPort } from 'node:worker_threads';
import { ImageResult, WorkTask, WorkerOutput } from './main';
import { load } from 'cheerio';
import { URL } from 'node:url';

parentPort?.on('message', async (task) => {
  const { url, depth } = task;
  console.log(`Worker thread: ${threadId} | Visiting: ${url}`);
  parentPort?.postMessage(await parseUrl(url, depth));
});

async function parseUrl(url: string, currentDepth: number) {
  try {
    // Fetch the HTML content of the URL
    const response = await fetch(url);
    const html = await response.text();

    // Load the HTML into Cheerio
    const $ = load(html);

    // Extract all links
    const links: WorkTask[] = [];
    $('a').each((i, element) => {
      const link = $(element).attr('href');
      if (link) {
        // convert to absolute url
        const newUrl = new URL(link, url).href;
        // forward links to be pushed to the main queue
        // increase their depth as 1 step over current depth
        links.push({ url: newUrl, depth: currentDepth + 1 });
      }
    });

    // Extract all images
    const images: ImageResult[] = [];
    const foundImages = new Set<string>();
    $('img').each((i, element) => {
      const imageUrl = $(element).attr('src');
      if (imageUrl) {
        // convert to absolute url
        const newImgUrl = new URL(imageUrl, url).href;
        if (!foundImages.has(newImgUrl)) {
          foundImages.add(newImgUrl);
          images.push({
            imageUrl: newImgUrl,
            depth: currentDepth,
            sourceUrl: url,
          });
        }
      }
    });

    // Output the extracted links and images
    const output: WorkerOutput = {
      url,
      links,
      images,
    };
    return output;
  } catch (error) {
    console.error('Error fetching URL:', (error as Error)?.message);
    return { url, links: [], images: [] };
  }
}
