import { ListenerHandler } from 'discord-akairo';
import { CommandHandler } from 'discord-akairo';
import { AkairoClient } from 'discord-akairo';
import { createClient, RedisClient } from 'redis';
import { GoogleAuthorization } from '../structure/google/googleAuthorization';
import { PupiliClientOptions } from './pupiliClientOptions';

export class PupiliClient extends AkairoClient {
	commandHandler: CommandHandler;
	listenerHandler: ListenerHandler;

	redisClient: RedisClient;

	googleAuthorization: GoogleAuthorization;

	constructor(options: PupiliClientOptions) {
		super(
			{
				ownerID: options.owners,
			},
			{
				disableMentions: 'everyone',
			}
		);

		this.redisClient = createClient({
			host: options.redis.ip,
			port: options.redis.port,
		});

		this.googleAuthorization = new GoogleAuthorization(
			options.google,
			this.redisClient
		);

		this.listenerHandler = new ListenerHandler(this, {
			directory: './src/listener',
		});

		this.commandHandler = new CommandHandler(this, {
			directory: './src/command',
			prefix: '!',
		});

		this.commandHandler.useListenerHandler(this.listenerHandler);

		this.listenerHandler.loadAll();
		this.commandHandler.loadAll();
	}

	start(token: string) {
		this.login(token);
	}
}

declare module 'discord-akairo' {
	interface AkairoClient {
		commandHandler: CommandHandler;
		listenerHandler: ListenerHandler;
		redisClient: RedisClient;
		googleAuthorization: GoogleAuthorization;
	}
}
