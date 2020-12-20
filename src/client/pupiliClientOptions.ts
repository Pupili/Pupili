export interface PupiliClientOptions {
	owners: string[];
	google: {
		clientId: string;
		clientSecret: string;
		redirects: string[];
	};
	redis: {
		ip: string;
		port: number;
	};
}
