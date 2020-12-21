import { Command } from 'discord-akairo';
import { MessageEmbed } from 'discord.js';
import { Message } from 'discord.js';
import { UserModel } from '../../model/user';
import { TextChannel } from 'discord.js';

export default class LinkCommand extends Command {
	constructor() {
		super('link', {
			aliases: ['link'],
		});
	}

	async exec(msg: Message) {
		const user = await UserModel.findOne({ userId: msg.author.id }).exec();
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

		this.client.redisPublisherClient.get(
			`messageStore-${msg.author.id}`,
			async (err, outMessageString) => {
				if (err) throw new Error(`Could not retrieve message storage - ${err}`);
				if (outMessageString) {
					const outMessage: { channel: string; id: string } = JSON.parse(
						outMessageString
					);
					const resolvedChannel = this.client.channels.resolve(
						outMessage.channel
					) as TextChannel;
					const fetchedMessage = await resolvedChannel.messages.fetch(
						outMessage.id
					);
					if (fetchedMessage)
						fetchedMessage.edit(':x: Could not authorize.', { embed: null });
				}
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
