import {
	getModelForClass,
	modelOptions,
	prop,
	Severity,
} from '@typegoose/typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { Auth } from 'googleapis';

@modelOptions({ options: { allowMixed: Severity.ALLOW } })
export class User {
	@prop({ required: true })
	public userId!: string;

	@prop({ required: true })
	public googleUserInfo!: {
		email: string;
		avatarUrl: string;
	};

	@prop({ required: true })
	public authCredentials!: Auth.Credentials;

	static async findUserByEmail(this: ModelType<User>, email: string) {
		return await this.findOne({ 'googleUserInfo.email': email }).exec();
	}

	static async findUserByID(this: ModelType<User>, id: string) {
		return await this.findOne({ userId: id }).exec();
	}
}

export const UserModel = getModelForClass(User);
