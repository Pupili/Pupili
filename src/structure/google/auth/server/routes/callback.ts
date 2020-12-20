import { Router } from 'express';
import { client } from '../../../../../app';

export const router = Router();

router.get('/', async (req, res) => {
	if (!req.query.state || !req.query.code)
		return res.status(400).json({ ok: false, error: 'INVALID_REQUEST' });
	const user = await client.users.fetch(req.query.state.toString());
	if (!user) return res.status(400).json({ ok: false, error: 'BAD_USER' });
	await client.googleAuthorization.authorizeUser(
		user,
		req.query.code.toString()
	);
	return res.status(200).json({ ok: true });
});
