//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';
import express, { Request, Response, Router } from 'express';

const booksRouter: Router = express.Router();

const isStringProvided = validationFunctions.isStringProvided;
const isNumberProvided = validationFunctions.isNumberProvided;
//
// const format = (resultRow) =>
//     `{${resultRow.priority}} - [${resultRow.name}] says: ${resultRow.message}`;
//
// const formatKeep = (resultRow) => ({
//     ...resultRow,
//     formatted: `{${resultRow.priority}} - [${resultRow.name}] says: ${resultRow.message}`,
// });
//
// function mwValidAuthorQuery(
//     request: Request,
//     response: Response,
//     next: NextFunction
// ) {
//     const priority: string = request.query.priority as string;
//     if (
//         validationFunctions.isStringProvided(priority) &&
//         parseInt(priority) >= 1 &&
//         parseInt(priority) <= 3
//     ) {
//         next();
//     } else {
//         console.error('Author name does not exist or invalid input type');
//         response.status(400).send({
//             message:
//                 'Author name does not exist or invalid input type',
//         });
//     }
// }

// get by ISBN
booksRouter.get('/isbn/:isbn13', (request: Request, response: Response) => {
    const theQuery =
        'SELECT * FROM BOOKS WHERE isbn13 = $1';
    const values = [request.params.isbn13];

    pool.query(theQuery, values)
        .then((result) => {
            if (result.rowCount > 0) {
                response.send({
                    entries: result.rows
                });
            } else {
                response.status(404).send({
                    message: 'ISBN13 not found',
                });
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET by ISBN13');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});

//get by author
booksRouter.get('/authors/:author', (request: Request, response: Response) => {
    const theQuery =
        "SELECT * FROM BOOKS WHERE authors ILIKE '%' || $1 || '%'";
    const values = [request.params.author];

    pool.query(theQuery, values)
        .then((result) => {
            if (result.rowCount > 0) {
                response.send({
                    entries: result.rows
                });
            } else {
                response.status(404).send({
                    message: 'Author name not found',
                });
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET by Author');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});

booksRouter.get('/', (request: Request, response: Response) => {
    response.send('<h1>Hello Books!</h1>');
});

booksRouter.post('/', (request: Request, response: Response) => {
    response.send('<h1>Hello Books!</h1>');
});

export { booksRouter };
