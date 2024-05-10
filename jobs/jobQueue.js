const amqp = require('amqplib');

async function setupQueue() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  // Declare an exchange for delayed messages
  await channel.assertExchange('delayed-exchange', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'direct' } });

  // Declare a queue bound to the exchange
  await channel.assertQueue('postJobs', { durable: true });
  await channel.bindQueue('postJobs', 'delayed-exchange', '');

  return channel;
}

async function enqueuePostJob(channel, job) {
  // Convert job to JSON and enqueue it
  const message = Buffer.from(JSON.stringify(job));
  const headers = { 'x-delay': job.scheduledTime - Date.now() };
  await channel.publish('delayed-exchange', '', message, { headers });
}

async function startWorker(channel) {
  // Consume post jobs from the queue
  await channel.consume('postJobs', async (message) => {
    const job = JSON.parse(message.content.toString());
    console.log(`Executing post job: ${job.id}`);
    console.log(`${job.content}`)
    // Execute the post job (e.g., post to social media platform)
    // Implement your logic here to handle the job

    // Acknowledge the message to remove it from the queue
    channel.ack(message);
  });
}

// Usage
(async () => {
  // Setup RabbitMQ connection and channel
  const channel = await setupQueue();

  // Start the worker to process jobs from the queue
  startWorker(channel);

  // Example: Enqueue a post job with a 5-second delay
  const job = {
    id: 'first',
    userId: 'user123',
    content: 'Hello, world!',
    scheduledTime: Date.now() + 5000, // 5 seconds from now
  };

  await enqueuePostJob(channel, job); // Enqueue the job for processing

  const job2 = {
    id: 'second',
    userId: 'fuckity',
    content: 'fuckity, world!',
    scheduledTime: Date.now() + 35000, // 35 seconds from now
  };

  await enqueuePostJob(channel, job2);

  const job3 = {
    id: 'turd',
    userId: 'fuckity',
    content: 'howdy do buckaroo',
    scheduledTime: Date.now() + 85000 // 35 seconds from now
  };

  await enqueuePostJob(channel, job3);
})();
