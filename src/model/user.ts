import { getModelForClass, prop } from '@typegoose/typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { Auth } from 'googleapis';

export class User {
	@prop({ required: true })
	public userId!: string;

	@prop({ required: true })
	public authCredentials!: Auth.Credentials;

	static async findUserByID(this: ModelType<User>, id: string) {
		return await this.findOne({ userId: id }).exec();
	}
}

export const UserModel = getModelForClass(User);
