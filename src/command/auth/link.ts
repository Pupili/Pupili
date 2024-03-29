import { Command } from 'discord-akairo';
import { MessageEmbed } from 'discord.js';
import { Message } from 'discord.js';
import { UserModel } from '../../model/user';
import { MessageStatus } from '../../structure/store/messageStatus';
import { MessageStore } from '../../structure/store/messageStore';
import { ONE_MINUTE_MS } from '../../util/constants';

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
			if (_msg)
				await messageStore.updateMessageFromMessageStore(MessageStatus.ERROR);

			messageStore.setMessageStoreForUser({
				channel: outputMessage.channel.id,
				id: outputMessage.id,
			});

			setTimeout(async () => {
				await messageStore.updateMessageFromMessageStore(MessageStatus.ERROR);
			}, ONE_MINUTE_MS);
		});
	}
}
