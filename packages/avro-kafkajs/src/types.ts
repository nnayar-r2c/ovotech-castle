import {
  EachMessagePayload,
  Batch,
  EachBatchPayload,
  Message,
  ProducerRecord,
  TopicMessages,
  ProducerBatch,
  KafkaMessage,
  ConsumerRunConfig,
} from 'kafkajs';
import { Schema } from 'avsc';

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export interface AvroEachMessagePayload<T = unknown, KT = KafkaMessage['key']>
  extends Omit<EachMessagePayload, 'message'> {
  message: AvroKafkaMessage<T, KT>;
}

export interface AvroBatch<T = unknown, KT = KafkaMessage['key']> extends Omit<Batch, 'messages'> {
  messages: AvroKafkaMessage<T, KT>[];
}

export interface AvroEachBatchPayload<T = unknown, KT = KafkaMessage['key']>
  extends Omit<EachBatchPayload, 'batch'> {
  batch: AvroBatch<T, KT>;
}

export type AvroEachMessage<T = unknown, KT = KafkaMessage['key']> = (
  payload: AvroEachMessagePayload<T, KT>,
) => Promise<void>;
export type AvroEachBatch<T = unknown, KT = KafkaMessage['key']> = (
  payload: AvroEachBatchPayload<T, KT>,
) => Promise<void>;

export interface AvroKafkaMessage<T = unknown, KT = KafkaMessage['key']>
  extends Omit<KafkaMessage, 'value' | 'key'> {
  schema: Schema | null;
  key: KT;
  value: T | null;
}

export interface AvroMessage<T = unknown, KT = Exclude<Message['key'], undefined>>
  extends Omit<Message, 'value' | 'key'> {
  key: KT;
  value: T;
}

export type AvroProducerRecordSchema =
  | { schema: Schema; keySchema?: Schema }
  | { subject: string; keySubject?: string };

export type AvroProducerRecord<T = unknown, KT = Message['key']> = Omit<
  ProducerRecord,
  'messages'
> & { messages: AvroMessage<T, KT>[] } & AvroProducerRecordSchema;

export type AvroTopicMessages<T = unknown, KT = Message['key']> = Omit<
  TopicMessages,
  'messages'
> & { messages: AvroMessage<T, KT>[] } & AvroProducerRecordSchema;

export interface AvroProducerBatch extends Omit<ProducerBatch, 'topicMessages'> {
  topicMessages: AvroTopicMessages<unknown, unknown>[];
}

export interface AvroConsumerRun<T = unknown, KT = KafkaMessage['key']>
  extends Omit<ConsumerRunConfig, 'eachBatch' | 'eachMessage'> {
  readerSchema?: Schema;
  encodedKey?: boolean;
  eachBatch?: (payload: AvroEachBatchPayload<T, KT>) => Promise<void>;
  eachMessage?: (payload: AvroEachMessagePayload<T, KT>) => Promise<void>;
}

export type TopicsAlias = { [key: string]: string };
