//express is the framework we're going to use to handle requests
import express, { NextFunction, Request, Response, Router } from 'express';
//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';

const bookRouter: Router = express.Router();

const isStringProvided = validationFunctions.isStringProvided;
const isNumberProvided = validationFunctions.isNumberProvided;

/**
 * @api {get} /isbn/:isbn13 Request to retrieve a book by ISBN
 * @apiName GetBookByISBN
 * @apiGroup Book (Closed)
 * @apiDescription Retrieves a single book based on the provided ISBN-13 number. Closed route, requires auth. token.
 *
 * @apiParam {String} isbn13 The ISBN-13 number of the book.
 *
 * @apiSuccess {Object} entry Details of the found book.
 *
 * @apiError (Error 404) NotFound No book found with the specified ISBN-13.
 * @apiError (Error 500) ServerError Internal server error.
 */
bookRouter.get(
    '/isbn/:isbn13',
    async (request: Request, response: Response) => {
        const theQuery = 'SELECT * FROM BOOKS WHERE isbn13 = $1';
        const values = [request.params.isbn13];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        entry: result.rows[0],
                    });
                } else {
                    response.status(404).send({
                        message: 'ISBN13 not found',
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET /:isbn13');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

/**
 * @api {get} /author/:author Request to retrieve books by Author
 * @apiName GetBooksByAuthor
 * @apiGroup Book (Closed)
 * @apiDescription Retrieves all books that match the given author's name (partial matches allowed). Closed route, requires auth. token.
 *
 * @apiParam {String} author Author name or part of the name to search for.
 *
 * @apiSuccess {Object[]} entries List of books written by the specified author.
 *
 * @apiError (Error 400) InvalidParameter Invalid or missing author parameter.
 * @apiError (Error 404) NotFound No books found for the specified author.
 * @apiError (Error 500) ServerError Internal server error.
 */
bookRouter.get(
    '/author/:author',
    async (request: Request, response: Response) => {
        const theQuery =
            "SELECT * FROM BOOKS WHERE authors ILIKE '%' || $1 || '%'";
        const values = [request.params.author];
        try {
            if (!isStringProvided(request.params.author)) {
                console.error('Invalid or missing author parameter');
                response.status(400).json({
                    message: 'Invalid or missing author parameter',
                });
                return;
            }
            const result = await pool.query(theQuery, values);
            if (result.rowCount > 0) {
                return response.json({ entries: result.rows });
            } else {
                return response.status(404).json({
                    message: 'No books found for that author',
                });
            }
        } catch (error) {
            console.error('DB Query error on GET /:author', error);
            return response.status(500).json({
                message: 'server error – contact support',
            });
        }
    }
);
/**
 * @api {post} / Request to add a book
 * @apiName AddBook
 * @apiGroup Book (Closed)
 * @apiDescription Adds a new book to the database. Closed route, requires auth. token.
 *
 * @apiBody {Number} id Unique ID of the book.
 * @apiBody {String} isbn13 ISBN-13 number of the book.
 * @apiBody {String} authors Author(s) of the book.
 * @apiBody {Number} publication_year Year the book was published.
 * @apiBody {String} original_title Original title of the book.
 * @apiBody {String} title Title of the book.
 * @apiBody {Number} rating_avg Average rating of the book.
 * @apiBody {Number} rating_count Total number of ratings.
 * @apiBody {Number} ratings_1_star Count of 1-star ratings.
 * @apiBody {Number} ratings_2_star Count of 2-star ratings.
 * @apiBody {Number} ratings_3_star Count of 3-star ratings.
 * @apiBody {Number} ratings_4_star Count of 4-star ratings.
 * @apiBody {Number} ratings_5_star Count of 5-star ratings.
 * @apiBody {String} image_url URL to the book's cover image.
 * @apiBody {String} image_small_url URL to the book's small cover image.
 *
 * @apiSuccess {Object} entry Details of the created book entry.
 *
 * @apiError (Error 400) InvalidData Invalid datatype or missing parameter.
 * @apiError (Error 400) DuplicateBook Book ID already exists.
 * @apiError (Error 500) ServerError Internal server error.
 */
bookRouter.post('/', async (request: Request, response: Response) => {
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

    try {
        if (
            !isNumberProvided(request.body.id) ||
            !isStringProvided(request.body.isbn13) ||
            !isStringProvided(request.body.authors) ||
            !isNumberProvided(request.body.publication_year) ||
            !isStringProvided(request.body.original_title) ||
            !isStringProvided(request.body.title) ||
            !isNumberProvided(request.body.rating_avg) ||
            !isNumberProvided(request.body.rating_count) ||
            !isNumberProvided(request.body.ratings_1_star) ||
            !isNumberProvided(request.body.ratings_2_star) ||
            !isNumberProvided(request.body.ratings_3_star) ||
            !isNumberProvided(request.body.ratings_4_star) ||
            !isNumberProvided(request.body.ratings_5_star) ||
            !isStringProvided(request.body.image_url) ||
            !isStringProvided(request.body.image_small_url)
        ) {
            console.error('Invalid datatype or missing parameter');
            response.status(400).send({
                message: 'Invalid datatype or missing parameter',
            });
            return;
        }
        const result = await pool.query(theQuery, values);
        response.status(201).send({
            entry: result.rows[0],
        });
    } catch (error) {
        if (error.detail && <string>error.detail.endsWith('exists.')) {
            console.error('book_id exists');
            return response.status(400).send({
                message: 'book_id exists',
            });
        } else {
            console.error('DB Query error on POST');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        }
    }
});

export { bookRouter };
