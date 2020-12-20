import { User } from 'discord.js';
import { google, Auth } from 'googleapis';
import { RedisClient } from 'redis';
import { PupiliClientOptions } from '../../../client/pupiliClientOptions';
import { GOOGLE_API_SCOPES } from '../../../util/constants';

export class GoogleAuthorization {
	oAuth2Client: Auth.OAuth2Client;
	oAuth2Options: PupiliClientOptions['google'];
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
		this.oAuth2Options = oAuthOptions;
		this.redisClient = redisClient;
	}

	generateAuthorizationURL(user: User) {
		this.redisClient.set(`auth-${user.id}`, 'PENDING');
		this.redisClient.expire(`auth-${user.id}`, 120); // expire after 2 minutes
		return `${this.oAuth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: GOOGLE_API_SCOPES,
			redirect_uri: `${this.oAuth2Options.redirects[0]}`,
			state: user.id,
		})}`;
	}

	getAuthorizationForUser(user: User, callback: (tokenString: string | null) => void) {
		this.redisClient.get(`auth-${user.id}`, (err, tokenString) => {
			if (err) throw new Error(`Error while getting authorization -- ${err}`);
			callback(tokenString);			
		});
	}

	async authorizeUser(user: User, authCode: string) {
		const token = await this.oAuth2Client.getToken(authCode);
		this.oAuth2Client.setCredentials(token.tokens);
		this.redisClient.persist(`auth-${user.id}`); // clear expire so it doesn't delete authorization
		this.redisClient.set(`auth-${user.id}`, JSON.stringify(token.tokens), (err) => {
			if (err) throw new Error(`Error while setting auth - ${err}`);
			this.redisClient.publish('auth', user.id);
		});
	}
}
