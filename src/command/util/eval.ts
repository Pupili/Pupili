import { Message } from 'discord.js';
import { inspect } from 'util';
import { Command } from 'discord-akairo';

export default class EvalCommand extends Command {
	constructor() {
		super('eval', {
			aliases: ['eval'],
			ownerOnly: true,
			args: [
				{
					id: 'expression',
					match: 'text'
				}
			]
		});
	}

	async exec(msg: Message, { expression }: { expression: string }) {
		let content: string;
		try {
			let evaled = eval(expression);
			if (typeof evaled !== 'string') evaled = inspect(evaled);
			content = `\`\`\`xl\n${this.clean(evaled)}\`\`\``;
		} catch (err) {
			content = `\`ERROR\` \`\`\`xl\n${this.clean(err.toString())}\n\`\`\``;
		}
		if (content.length > 2000) {
			console.log(content);
			return msg.author.send('you fucking idiot check your logs');
		}
		msg.channel.send(content);
	}

	private clean(text: string) {
		text = text
			.replace(/`/g, '`' + String.fromCharCode(8203))
			.replace(/@/g, '@' + String.fromCharCode(8203))
			.replace(new RegExp(this.client.token!, 'g'), '[token redacted]');
		return text;
	}
}