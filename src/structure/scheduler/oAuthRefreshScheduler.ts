import { DocumentType } from '@typegoose/typegoose';
import { User, UserModel } from '../../model/user';
import { GoogleAuthorization } from '../google/auth/googleAuthorization';

const EXPIRING_SOON_MS = 2.592e8; // 3 days
const REFRESH_MS = 4.32e7; // 12 hours

export class OAuthRefreshScheduler {
	private timeouts: Map<NodeJS.Timeout, DocumentType<User>>;
	googleAuthorization: GoogleAuthorization;

	constructor(googleAuthorization: GoogleAuthorization) {
		this.timeouts = new Map();
		this.googleAuthorization = googleAuthorization;
	}

	async refreshScheduler() {
		this.timeouts.forEach((_u, t) => clearTimeout(t));
		const expiringSoon = await UserModel.find({
			'authCredentials.expiry_date': { $lte: Date.now() + EXPIRING_SOON_MS },
		});
		expiringSoon.forEach(u => {
			if (!u.authCredentials.expiry_date) return this.refreshToken(u);
			const expireTime = u.authCredentials.expiry_date - Date.now();
			const timeout = setTimeout(() => this.refreshToken(u), expireTime);
			this.timeouts.set(timeout, u);
		});
		setTimeout(() => this.refreshScheduler(), REFRESH_MS);
	}

	refreshToken(u: DocumentType<User>) {
		const oAuth2Client = this.googleAuthorization.buildOAuth2ClientFromOpts();
		console.log(`Refreshing token for ${u.userId}...`);
		oAuth2Client.setCredentials({
			refresh_token: u.authCredentials.refresh_token
		});
		oAuth2Client.refreshAccessToken(
			async (err, tokens) => {
				if (err || !tokens)
					throw new Error(
						`Error while refreshing access token for user ${u.userId} - ${err}`
					);
				await u.updateOne({
					authCredentials: tokens,
				});
				this.refreshScheduler();
			}
		);
	}
}
