import { Listener } from 'discord-akairo';

export default class ReadyListener extends Listener {
	constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready'
		});
	}

	async exec() {
		console.log(`Ready on ${this.client.user!.tag}!`);

		this.client.redisSubscriberClient.subscribe(
			'auth',
			err => {
				if (err) throw new Error('Could not subscribe to auth channel');
			}
		);
	}
}