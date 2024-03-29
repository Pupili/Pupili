import { User } from 'discord.js';
import { RedisClient } from 'redis';
import { PupiliClient } from '../../client/pupiliClient';
import { TextChannel } from 'discord.js';
import { Message } from 'discord.js';
import { MessageStatus } from './messageStatus';

interface StoredMessage {
	channel: string;
	id: string;
}

export class MessageStore {
	client: PupiliClient;
	redisClient: RedisClient;
	user: User;

	constructor(client: PupiliClient, redisClient: RedisClient, user: User) {
		this.client = client;
		this.redisClient = redisClient;
		this.user = user;
	}

	getMessageStoreForUser(callback: (msg: StoredMessage | null) => void) {
		this.redisClient.get(`messageStore-${this.user.id}`, (err, str) => {
			if (err)
				throw new Error(
					`Error while getting message storage for user with id ${this.user.id} - ${err}`
				);
			callback(str ? JSON.parse(str) : null);
		});
	}

	setMessageStoreForUser(msg: StoredMessage | null) {
		if (msg)
			this.redisClient.set(`messageStore-${this.user.id}`, JSON.stringify(msg));
		else this.redisClient.del(`messageStore-${this.user.id}`);
	}

	async fetchMessageFromMessageStore() {
		let msg: Message | null = null;
		const _msg: StoredMessage | null = await new Promise(resolve => {
			this.getMessageStoreForUser(storedMessage => {
				resolve(storedMessage);
			});
		});
		if (_msg) {
			const resolvedChannel = this.client.channels.resolve(
				_msg.channel
			) as TextChannel;
			const fetchedMessage = await resolvedChannel.messages.fetch(_msg.id);
			msg = fetchedMessage;
		}
		return msg;
	}

	async updateMessageFromMessageStore(status: MessageStatus) {
		const msg = await this.fetchMessageFromMessageStore();
		if (!msg) return;
		let statusText: string;
		switch (status) {
			case MessageStatus.ERROR:
				statusText = ':x: Could not authorize user.';
				break;
			case MessageStatus.SUCCESS:
				statusText = ':white_check_mark: successfully authorized user';
				break;
			default:
				statusText = ':x: Why the fuck did you update me?';
				break;
		}
		await msg.edit(statusText, { embed: null });
		this.setMessageStoreForUser(null);
	}
}
