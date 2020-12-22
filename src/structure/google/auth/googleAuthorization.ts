import { User } from 'discord.js';
import { google } from 'googleapis';
import { RedisClient } from 'redis';
import { PupiliClient } from '../../../client/pupiliClient';
import { PupiliClientOptions } from '../../../client/pupiliClientOptions';
import { UserModel } from '../../../model/user';
import { GOOGLE_API_SCOPES } from '../../../util/constants';

export class GoogleAuthorization {
	client: PupiliClient;
	oAuth2Options: PupiliClientOptions['google'];
	redisClient: RedisClient;

	constructor(
		client: PupiliClient,
		oAuthOptions: PupiliClientOptions['google'],
		redisClient: RedisClient
	) {
		this.client = client;
		this.oAuth2Options = oAuthOptions;
		this.redisClient = redisClient;
	}

	buildOAuth2ClientFromOpts() {
		return new google.auth.OAuth2({
			clientId: this.oAuth2Options.clientId,
			clientSecret: this.oAuth2Options.clientSecret,
			redirectUri: this.oAuth2Options.redirects[0],
		});
	}

	generateAuthorizationURL(user: User) {
		return `${this.buildOAuth2ClientFromOpts().generateAuthUrl({
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
		const oAuth2Client = this.buildOAuth2ClientFromOpts();
		const token = await oAuth2Client.getToken(authCode);
		console.log(token);
		oAuth2Client.setCredentials(token.tokens);
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
		const oAuth2Client = this.buildOAuth2ClientFromOpts();
		oAuth2Client.setCredentials(dbUser.authCredentials);
		await oAuth2Client.revokeCredentials()
			.catch((err) => {
				console.log(`Could not revoke access token, removing anyways... ${err}`);
			});
		await dbUser.remove();
		await this.client.oAuthRefreshScheduler.refreshScheduler();
	}
}
