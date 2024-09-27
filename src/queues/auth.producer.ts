import { config } from '@auth/config';
import { winstonLogger } from '@hamzelotfalinezhad/shared-library';
import { Channel } from 'amqplib';
import { Logger } from 'winston';
import { createConnection } from '@auth/queues/connection';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authServiceProducer', 'debug');

export async function publishDirectMessage(
  channel: Channel,
  exchangeName: string,
  routingKey: string,
  message: string,
  logMessage: string
): Promise<void> {
  try {
    if (!channel) {
      channel = await createConnection() as Channel;
    }
    // await channel.assertExchange(exchangeName, 'direct');
    await channel.assertExchange(exchangeName, 'direct', { durable: true }); // Make the exchange durable
    channel.publish(exchangeName, routingKey, Buffer.from(message));
    // channel.publish(exchangeName, routingKey, Buffer.from(message),
    //   {
    //     persistent: true // Ensure the message is persisted to disk so even after crash, the message do not lost
    //   });
    log.info(logMessage);
  } catch (error) {
    log.log('error', 'AuthService Provider publishDirectMessage() method error:', error);
  }
}
