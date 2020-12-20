import { Command } from 'discord-akairo';
import { MessageEmbed } from 'discord.js';
import { Message } from 'discord.js';

export default class LinkCommand extends Command {
	constructor() {
		super('link', {
			aliases: ['link'],
		});
	}

	async exec(msg: Message) {
		this.client.googleAuthorization.getAuthorizationForUser(
			msg.author,
			async authorization => {
				if (authorization)
					return msg.channel.send(':x: User is already authorized.');
				if (authorization == 'PENDING')
					return msg.channel.send(':x: User has a pending authorization.');

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

				this.client.redisPublisherClient.set(
					`messageStore-${msg.author.id}`,
					JSON.stringify({
						channel: outputMessage.channel.id,
						id: outputMessage.id,
					})
				);
			}
		);
	}
}
