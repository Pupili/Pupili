import { Command } from 'discord-akairo';
import { MessageEmbed } from 'discord.js';
import { Message } from 'discord.js';
import { UserModel } from '../../model/user';
import { MessageStore } from '../../structure/store/messageStore';

export default class LinkCommand extends Command {
	constructor() {
		super('link', {
			aliases: ['link'],
		});
	}

	async exec(msg: Message) {
		const user = await UserModel.findUserByID(msg.author.id);
		if (user && user.authCredentials)
			return msg.channel.send(':x: User is already authorized.');

		const authUrl = this.client.googleAuthorization.generateAuthorizationURL(
			msg.author
		);

		const embed = new MessageEmbed()
			.setDescription(
				`[Click this url to link your Google account with your Discord account](${authUrl})`
			)
			.setColor('BLUE');

		const outputMessage = await msg.channel.send(
			`${process.env.LOADING_EMOJI} Waiting for authorization...`,
			{ embed: embed }
		);

		const messageStore = new MessageStore(
			this.client,
			this.client.redisPublisherClient,
			msg.author
		);

		messageStore.getMessageStoreForUser(async _msg => {
			if (_msg) {
				const fetchedMessage = await messageStore.fetchMessageFromMessageStore();
				if (fetchedMessage)
					fetchedMessage.edit(':x: Could not authorize.', { embed: null });
			}
			messageStore.setMessageStoreForUser({
				channel: outputMessage.channel.id,
				id: outputMessage.id,
			});
		});
	}
}
