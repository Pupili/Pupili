import { ListenerHandler } from 'discord-akairo';
import { CommandHandler } from 'discord-akairo';
import { AkairoClient } from 'discord-akairo';
import { createClient, RedisClient } from 'redis';
import { GoogleAuthorization } from '../structure/google/auth/googleAuthorization';
import { init } from '../structure/google/auth/server/server';
import { OAuthRefreshScheduler } from '../structure/scheduler/oAuthRefreshScheduler';
import { PupiliClientOptions } from './pupiliClientOptions';

export class PupiliClient extends AkairoClient {
	commandHandler: CommandHandler;
	listenerHandler: ListenerHandler;

	redisPublisherClient: RedisClient;
	redisSubscriberClient: RedisClient;

	googleAuthorization: GoogleAuthorization;

	oAuthRefreshScheduler: OAuthRefreshScheduler;

	constructor(options: PupiliClientOptions) {
		super(
			{
				ownerID: options.owners,
			},
			{
				disableMentions: 'everyone',
			}
		);

		this.redisPublisherClient = createClient({
			host: options.redis.ip,
			port: options.redis.port,
		});

		this.redisSubscriberClient = createClient({
			host: options.redis.ip,
			port: options.redis.port,
		});

		this.googleAuthorization = new GoogleAuthorization(
			this,
			options.google,
			this.redisPublisherClient
		);

		init();

		this.oAuthRefreshScheduler = new OAuthRefreshScheduler(
			this.googleAuthorization
		);

		this.listenerHandler = new ListenerHandler(this, {
			directory: './src/listener',
		});

		this.commandHandler = new CommandHandler(this, {
			directory: './src/command',
			prefix: '!',
		});

		this.listenerHandler.setEmitters({
			redis: this.redisSubscriberClient,
		});

		this.commandHandler.useListenerHandler(this.listenerHandler);

		this.listenerHandler.loadAll();
		this.commandHandler.loadAll();
	}

	async start(token: string) {
		await this.login(token);
		await this.oAuthRefreshScheduler.refreshScheduler();
	}
}

declare module 'discord-akairo' {
	interface AkairoClient {
		commandHandler: CommandHandler;
		listenerHandler: ListenerHandler;
		redisSubscriberClient: RedisClient;
		redisPublisherClient: RedisClient;
		googleAuthorization: GoogleAuthorization;
		oAuthRefreshScheduler: OAuthRefreshScheduler;
		
		start(token: string): Promise<void>;
	}
}
