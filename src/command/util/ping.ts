import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class PingCommand extends Command {
	constructor() {
		super('ping', {
			aliases: ['ping'],
		});
	}

	async exec(msg: Message) {
		msg.channel.send(':white_check_mark: pong!');
	}
}
