import { PupiliClient } from './client/pupiliClient';

require('dotenv').config();

export const client = new PupiliClient({
	owners: process.env.OWNER_IDS?.split(',')!,
	google: {
		clientId: process.env.GOOGLE_CLIENT_ID!,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		redirects: process.env.GOOGLE_CLIENT_REDIRECTS?.split(',')!,
	},
	redis: {
		ip: process.env.REDIS_IP!,
		port: parseInt(process.env.REDIS_PORT!),
	},
});

client.start(process.env.BOT_TOKEN!);
