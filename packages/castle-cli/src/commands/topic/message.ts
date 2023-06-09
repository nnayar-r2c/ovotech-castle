import * as commander from 'commander';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { loadConfigFile } from '../../config';
import { header, Output } from '../../output';
import { Kafka } from 'kafkajs';
import { readFileSync } from 'fs';

interface Options {
  config?: string;
  message: string;
  key?: string;
  partition?: number;
  schemaFile: string;
  keySchemaFile?: string;
  verbose?: 1 | 2 | 3 | 4;
}
export const castleTopicMessage = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('message')
    .arguments('<topic>')
    .description(
      `Produce an ad-hoc message for a topic.
You need to specify schema file (with --schema-file) and message content as json (--message).
If you define --key-schema-file as well you can encode your keys too.

Example:
  castle topic message my-topic --schema-file my-schema.json --message '{"text":"other"}'
  castle topic message my-topic --schema-file my-schema.json --message '{"text":"other"}' --key my-key
  castle topic message my-topic --schema-file my-schema.json --key-schema-file key-schema.json --message '{"text":"other"}' --key '{"id":10}'
  castle topic message my-topic --schema-file my-schema.json --message '{"text":"other"}' -vvvv
`,
    )
    .option('-P, --partition <partition>', 'the partion to send this on', (val) => parseInt(val))
    .option('-K, --key <key>', 'message key')
    .requiredOption('-M, --message <message>', 'the JSON message to be sent')
    .requiredOption('-S, --schema-file <schema>', 'path to the schema file')
    .option('-E, --key-schema-file <schema>', 'optional path to the key schema file')
    .option('-C, --config <config>', 'config file with connection deails')
    .option(
      '-v, --verbose',
      'Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level',
      (_, prev) => Math.min(prev + 1, 4),
      0,
    )
    .action(
      async (
        topic,
        {
          config: configFile,
          message: messageJson,
          verbose,
          schemaFile,
          keySchemaFile,
          key,
          partition,
        }: Options,
      ) => {
        await output.wrap(false, async () => {
          const config = await loadConfigFile({ file: configFile, verbose, output });
          const schema = JSON.parse(readFileSync(schemaFile, 'utf8'));
          const keySchema = keySchemaFile
            ? JSON.parse(readFileSync(keySchemaFile, 'utf8'))
            : undefined;
          const messages = [
            {
              value: JSON.parse(messageJson),
              key: (keySchema && key ? JSON.parse(key) : key) ?? null,
              partition,
            },
          ];

          const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
          const kafka = new Kafka(config.kafka);
          const avroKafka = new AvroKafka(schemaRegistry, kafka);

          output.log(header(`Produce message in`, topic, config));
          const producer = avroKafka.producer();
          await producer.connect();

          try {
            await producer.send({ messages, schema, keySchema, topic });
            output.success('Success');
          } finally {
            producer.disconnect();
          }
        });
      },
    );
