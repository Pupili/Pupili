import { User } from 'discord.js';
import { google, Auth } from 'googleapis';
import { RedisClient } from 'redis';
import { PupiliClient } from '../../../client/pupiliClient';
import { PupiliClientOptions } from '../../../client/pupiliClientOptions';
import { UserModel } from '../../../model/user';
import { GOOGLE_API_SCOPES } from '../../../util/constants';

export class GoogleAuthorization {
	client: PupiliClient;
	oAuth2Client: Auth.OAuth2Client;
	oAuth2Options: PupiliClientOptions['google'];
	redisClient: RedisClient;

	constructor(
		client: PupiliClient,
		oAuthOptions: PupiliClientOptions['google'],
		redisClient: RedisClient
	) {
		this.client = client;
		this.oAuth2Client = new google.auth.OAuth2({
			clientId: oAuthOptions.clientId,
			clientSecret: oAuthOptions.clientSecret,
			redirectUri: oAuthOptions.redirects[0],
		});
		this.oAuth2Options = oAuthOptions;
		this.redisClient = redisClient;
	}

	generateAuthorizationURL(user: User) {
		return `${this.oAuth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: GOOGLE_API_SCOPES,
			redirect_uri: `${this.oAuth2Options.redirects[0]}`,
			state: user.id,
		})}`;
	}

	getAuthorizationForUser(
		user: User,
		callback: (tokenString: string | null) => void
	) {
		this.redisClient.get(`auth-${user.id}`, (err, tokenString) => {
			if (err) throw new Error(`Error while getting authorization -- ${err}`);
			callback(tokenString);
		});
	}

	async authorizeUser(user: User, authCode: string) {
		const token = await this.oAuth2Client.getToken(authCode);
		this.oAuth2Client.setCredentials(token.tokens);
		const doc = await UserModel.create({
			userId: user.id,
			authCredentials: token.tokens,
		});
		await doc.save();
		await this.client.oAuthRefreshScheduler.refreshScheduler();
		this.redisClient.publish('auth', user.id);
	}

	async unauthorizeUser(user: User) {
		const dbUser = await UserModel.findUserByID(user.id);
		if (!dbUser || !dbUser.authCredentials)
			throw new Error('Could not get auth credentials for user');
		this.oAuth2Client.credentials = dbUser!.authCredentials!;
		await this.oAuth2Client.revokeCredentials();
		await dbUser.remove();
		await this.client.oAuthRefreshScheduler.refreshScheduler();
	}
}
