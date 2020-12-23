import { Command } from 'discord-akairo';
import { MessageEmbed } from 'discord.js';
import { Message } from 'discord.js';
import { UserModel } from '../../model/user';
import humanizeDuration from 'humanize-duration';

export default class UserInfoCommand extends Command {
	constructor() {
		super('userinfo', {
			aliases: ['userinfo', 'uinfo'],
		});
	}

	async exec(msg: Message) {
		const outputMessage = await msg.channel.send(
			`${process.env.LOADING_EMOJI} loading user data...`
		);
		const user = await UserModel.findUserByID(msg.author.id);
		if (!user || !user.authCredentials)
			return outputMessage.edit(
				':x: User is not authorized or user does not have any data.'
			);

		const embed = new MessageEmbed()
			.setTitle(`Showing user info for ${msg.author.tag}`)
			.addField('Email', user.googleUserInfo.email)
			.addField(
				'Expiring in',
				humanizeDuration(user.authCredentials.expiry_date! - Date.now(), {
					largest: 3,
					round: true,
				})
			)
			.setThumbnail(user.googleUserInfo.avatarUrl)
			.setColor('BLUE');

		await msg.author
			.send(embed)
			.catch(() => {
				outputMessage.edit(':x: Could not send user a direct message.');
			})
			.then(() => {
				outputMessage.edit(
					':white_check_mark: successfully sent a direct message with user info'
				);
			});
	}
}
