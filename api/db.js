import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand} from '@aws-sdk/lib-dynamodb';

// Use environment variables for credentials; rely on default provider chain if not set
const region = process.env.AWS_REGION || 'eu-north-1';
const credentials = (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
  : undefined;

const client = new DynamoDBClient({
  region,
  credentials,
});

const docClient = DynamoDBDocumentClient.from(client);

export {docClient, PutCommand};
