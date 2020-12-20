import { User } from 'discord.js';
import { google, Auth } from 'googleapis';
import { RedisClient } from 'redis';
import { PupiliClientOptions } from '../../client/pupiliClientOptions';
import { GOOGLE_API_SCOPES } from '../../util/constants';

export class GoogleAuthorization {
	oAuth2Client: Auth.OAuth2Client;
	redisClient: RedisClient;

	constructor(
		oAuthOptions: PupiliClientOptions['google'],
		redisClient: RedisClient
	) {
		this.oAuth2Client = new google.auth.OAuth2({
			clientId: oAuthOptions.clientId,
			clientSecret: oAuthOptions.clientSecret,
			redirectUri: oAuthOptions.redirects[0],
		});
		this.redisClient = redisClient;
	}

	generateAuthorizationURL() {
		return this.oAuth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: GOOGLE_API_SCOPES,
		});
	}

	async isAuthorized(user: User) {
		let isAuthorized = false;
		this.redisClient.get(`auth-${user.id}`, (err, tokenString) => {
			if (err) throw new Error(`Error while checking authorization -- ${err}`);
			if (tokenString) isAuthorized = true;
		});
		return isAuthorized;
	}

	async authorizeUser(user: User, authCode: string) {
		const token = await this.oAuth2Client.getToken(authCode);
		this.oAuth2Client.setCredentials(token.tokens);
		this.redisClient.set(`auth-${user.id}`, JSON.stringify(token.tokens));
	}
}
