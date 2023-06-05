A small script that performs web scraping by using worker threads (simple worker pool implementation) to process multiple tasks concurrently and Cheerio to extract link and image elements.
It maintains a queue of links as tasks to be processed, tracks the processing and completed tasks, and stores the results.
The main function initializes the necessary data structures, creates worker threads, assigns tasks to them, and handles the completion of tasks. Once all tasks are completed, it writes the results to a JSON file and exits the process.
This excerise is completed by Riadh Chougui, as a part of Dataloop AI interview.
