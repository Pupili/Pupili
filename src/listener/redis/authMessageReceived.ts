import { Listener } from 'discord-akairo';
import { TextChannel } from 'discord.js';

export default class AuthMessagedReceivedListener extends Listener {
	constructor() {
		super('authMessageReceived', {
			emitter: 'redis',
			event: 'message'
		});
	}

	async exec(channel: string, msg: string) {
		if (channel == 'auth') {
			this.client.redisPublisherClient.get(
				`messageStore-${msg}`,
				async (err, outputMessageString) => {
					if (err || !outputMessageString)
						throw new Error(
							`Received message from auth channel, however couldn't get message store - ${err}`
						);

					const outputMessage: { channel: string; id: string } = JSON.parse(
						outputMessageString
					);

					const resolvedChannel = this.client.channels.resolve(
						outputMessage.channel
					) as TextChannel;
					const fetchedMessage = await resolvedChannel.messages.fetch(
						outputMessage.id
					);

					fetchedMessage.edit(':white_check_mark: successfully authorized', {
						embed: null,
					});
				}
			);
		}
	}
}
