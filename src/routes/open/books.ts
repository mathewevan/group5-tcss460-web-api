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

booksRouter.post(
    '/',
    (request: Request, response: Response) => {
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        const theQuery =
            'INSERT INTO BOOKS(id, isbn13, authors, publication_year, original_title, title, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *';
        const values = [
            request.body.id,
            request.body.isbn13,
            request.body.authors,
            request.body.publication_year,
            request.body.original_title,
            request.body.title,
            request.body.rating_avg,
            request.body.rating_count,
            request.body.ratings_1_star,
            request.body.ratings_2_star,
            request.body.ratings_3_star,
            request.body.ratings_4_star,
            request.body.ratings_5_star,
            request.body.image_url,
            request.body.image_small_url,
        ];

        pool.query(theQuery, values)
            .then((result) => {
                // result.rows array are the records returned from the SQL statement.
                // An INSERT statement will return a single row, the row that was inserted.
                response.status(201).send({
                    entry: result.rows[0],
                });
            })
            .catch((error) => {
                if (
                    error.detail != undefined &&
                    (error.detail as string).endsWith('already exists.')
                ) {
                    console.error('Name exists');
                    response.status(400).send({
                        message: 'Name exists',
                    });
                } else {
                    //log the error
                    console.error('DB Query error on POST');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error - contact support',
                    });
                }
            });
    }
);





export { booksRouter };
