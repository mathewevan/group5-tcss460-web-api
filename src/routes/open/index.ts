import express, { Router } from 'express';

import { messageRouter } from './message';
import { booksRouter } from './books_old';

const openRoutes: Router = express.Router();

openRoutes.use('/message', messageRouter);
openRoutes.use('/books_old', booksRouter)

export { openRoutes };
