import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { UserModel } from '../../model/user';

export default class UnlinkCommand extends Command {
	constructor() {
		super('unlink', {
			aliases: ['unlink'],
		});
	}

	async exec(msg: Message) {
		const user = await UserModel.findUserByID(msg.author.id);
		if (!user || !user.authCredentials)
			return msg.channel.send(':x: User is not authorized.');

		await this.client.googleAuthorization.unauthorizeUser(msg.author);

		msg.channel.send(':white_check_mark: successfully unauthorized user');
	}
}
