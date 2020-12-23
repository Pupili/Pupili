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
		const user = await UserModel.findUserByID(msg.author.id);
		if (!user || !user.authCredentials)
			return msg.channel.send(
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
				msg.channel.send(':x: Could not send user a direct message.');
			})
			.then(() => {
				msg.channel.send(
					':white_check_mark: successfully sent a direct message with user info'
				);
			});
	}
}
