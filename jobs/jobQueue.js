const amqp = require('amqplib');
const {makePost, validateJob} = require('./jobQueueService');

async function setupQueue () {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  // Declare an exchange for delayed messages
  await channel.assertExchange('delayed-exchange', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'direct' } });

  // Declare a queue bound to the exchange
  await channel.assertQueue('postJobs', { durable: true });
  await channel.bindQueue('postJobs', 'delayed-exchange', '');

  return channel;
}

async function enqueuePostJob (channel, job) {
  // Convert job to JSON and enqueue it
  const message = Buffer.from(JSON.stringify(job));
  const headers = { 'x-delay': job.scheduledTime - Date.now() };
  await channel.publish('delayed-exchange', '', message, { headers });
}

const getExistingQueue = async () => {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  // Ensure the exchange and queue are declared as expected
  await channel.assertExchange('delayed-exchange', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'direct' } });
  await channel.assertQueue('postJobs', { durable: true });
  await channel.bindQueue('postJobs', 'delayed-exchange', '');

  return channel;
};

async function startWorker (channel) {
  // Consume post jobs from the queue
  await channel.consume('postJobs', async (message) => {
    const job = JSON.parse(message.content.toString());
    console.log(`Executing post job: ${job.message_id}`);
    console.log(`${job.content}`);
    console.log(`${job.website}`);
    console.log(`${job.scheduledTime}`);
    console.log(Date.now());
    if (job.content !== 'Bridge job to ensure continuity') {
      await makePost(job);
    }
    
    // Acknowledge the message to remove it from the queue
    channel.ack(message);
  });
}

module.exports = { setupQueue, enqueuePostJob, startWorker, getExistingQueue };
