import { getModelForClass, prop } from '@typegoose/typegoose';
import { Auth } from 'googleapis';

export class User {
	@prop({ required: true })
	public userId!: string;

	@prop({ required: true })
	public authCredentials!: Auth.Credentials;
}

export const UserModel = getModelForClass(User);
