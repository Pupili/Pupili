import { Listener } from 'discord-akairo';
import { MessageStore } from '../../structure/store/messageStore';

export default class AuthMessagedReceivedListener extends Listener {
	constructor() {
		super('authMessageReceived', {
			emitter: 'redis',
			event: 'message',
		});
	}

	async exec(channel: string, msg: string) {
		if (channel == 'auth') {
			const messageStore = new MessageStore(
				this.client,
				this.client.redisPublisherClient,
				this.client.users.resolve(msg)!
			);
			messageStore.getMessageStoreForUser(async _msg => {
				if (!_msg)
					throw new Error(
						`Received message from auth channel, however couldn't get message store`
					);
				const fetchedMessage = await messageStore.fetchMessageFromMessageStore();
				if (fetchedMessage)
					fetchedMessage.edit(':white_check_mark: successfully authorized', {
						embed: null,
					});
			});
		}
	}
}
