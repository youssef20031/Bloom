import { Kafka, logLevel } from 'kafkajs';

let kafkaInstance = null;
let producer = null;
let consumer = null;
let kafkaEnabled = false;
let configuredBrokers = [];

export async function initKafka() {
  const brokersEnv = process.env.KAFKA_BROKERS;
  if (!brokersEnv) {
    console.log('🛈 Kafka disabled: KAFKA_BROKERS env var not set. Skipping Kafka initialization.');
    return;
  }
  configuredBrokers = brokersEnv.split(',').map(b => b.trim()).filter(Boolean);
  if (configuredBrokers.length === 0) {
    console.log('🛈 Kafka disabled: No valid brokers parsed from KAFKA_BROKERS.');
    return;
  }

  try {
    kafkaInstance = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'bloom-app',
      brokers: configuredBrokers,
      logLevel: logLevel.NOTHING
    });

    producer = kafkaInstance.producer();
    consumer = kafkaInstance.consumer({ groupId: process.env.KAFKA_CONSUMER_GROUP || 'bloom-group' });

    await producer.connect();
    await consumer.connect();
    kafkaEnabled = true;
    console.log(`✅ Kafka connected (brokers: ${configuredBrokers.join(', ')})`);

    // Example subscription (optional commands topic)
    try {
      await consumer.subscribe({ topic: 'support-ticket-commands', fromBeginning: false });
      consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const valueStr = message.value ? message.value.toString() : '';
          console.log(`📨 Kafka message received topic=${topic} partition=${partition} value=${valueStr}`);
          // TODO: Implement handling logic for inbound commands if required.
        }
      });
    } catch (subErr) {
      console.error('⚠️ Kafka consumer subscription error:', subErr);
    }
  } catch (err) {
    console.error('❌ Kafka initialization failed:', err);
  }
}

export function isKafkaEnabled() {
  return kafkaEnabled;
}

export function getKafkaBrokers() {
  return configuredBrokers;
}

export async function produceKafkaEvent(topic, key, payload) {
  if (!kafkaEnabled) return; // Silently no-op if disabled
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: key ? String(key) : undefined,
            value: JSON.stringify(payload),
            headers: {
              'x-event-type': payload?.type || 'unknown',
              'x-produced-at': new Date().toISOString()
            }
        }
      ]
    });
  } catch (err) {
    console.error(`❌ Failed to produce Kafka event to topic ${topic}:`, err);
  }
}

export async function shutdownKafka() {
  if (!kafkaEnabled) return;
  try {
    await producer.disconnect();
    await consumer.disconnect();
    console.log('🛑 Kafka producer & consumer disconnected');
  } catch (err) {
    console.error('⚠️ Error during Kafka shutdown:', err);
  }
}

