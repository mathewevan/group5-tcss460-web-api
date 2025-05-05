import express, { Router } from 'express';

import { signinRouter } from './login';
import { registerRouter } from './register';
import { passRouter} from './pass';

const authRoutes: Router = express.Router();

authRoutes.use(signinRouter, registerRouter);
authRoutes.use('/password', passRouter);

export { authRoutes };
