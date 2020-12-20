import express from 'express';
import { router } from './routes/callback';

export function init(port?: number) {
	const server = express();

	server.use('/callback', router);

	server.listen(port || 3000, () => {
		console.log(`[AUTH SERVER] Listening on port ${port || 3000}`);
	});
}
