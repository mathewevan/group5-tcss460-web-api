//express is the framework we're going to use to handle requests
import express, { Request, Response, Router } from 'express';
//Access the connection to Postgres Database
import {
    pool,
    validationFunctions,
    credentialingFunctions,
} from '../../core/utilities';

export interface Auth {
    email: string;
    password: string;
}

export interface AuthRequest extends Request {
    auth: Auth;
}

const isStringProvided = validationFunctions.isStringProvided;
const generateHash = credentialingFunctions.generateHash;
const generateSalt = credentialingFunctions.generateSalt;

const passRouter: Router = express.Router();

passRouter.patch(
    '/changepassword',
    (request: AuthRequest, response: Response) => {
        const email = request.body.email;
        const oldPass = request.body.oldPassword;
        const newPass = request.body.newPassword;

        const theQuery = `SELECT salted_hash, salt, Account_Credential.account_id 
                        FROM Account_Credential
                        INNER JOIN Account ON Account_Credential.account_id = Account.account_id
                        WHERE Account.email=$1`;

        if (!isStringProvided(email) || !isStringProvided(oldPass)) {
            console.error('Invalid email or oldPass');
            response.status(400).send({
                message:
                    'Invalid or missing email / oldPass - please refer to documentation',
            });
        }
        if (newPass < 7 || !isStringProvided(newPass)) {
            // check for valid password
            console.error('New Password is invalid or missing.');
            response.status(400).send({
                message:
                    'Invalid or missing new password - please refer to documentation',
            });
        }

        pool.query(theQuery, [email])
            .then((result) => {
                if (result.rowCount === 0) {
                    console.error('User not found');
                    response.status(400).send({
                        message: 'Invalid Credentials',
                    });
                    return;
                }

                //Retrieve the salt used to create the salted-hash provided from the DB
                const salt = result.rows[0].salt;

                //Retrieve the salted-hash password provided from the DB
                const storedSaltedHash = result.rows[0].salted_hash;

                // Generate a hash based on the stored salt and the provided password
                const providedSaltedHash = generateHash(oldPass, salt);

                //Did our salted hash match their salted hash?
                if (storedSaltedHash === providedSaltedHash) {
                    const newSalt = generateSalt(32); // Create a new salt for the new password
                    const newSaltedHash = generateHash(newPass, newSalt); // Create a new salted hash for new password

                    // Update the password in the database
                    const updateQuery = `UPDATE Account_Credential
                                         SET salted_hash=$1, salt=$2
                                         WHERE account_id=$3`;
                    const updateValues = [
                        newSaltedHash,
                        newSalt,
                        result.rows[0].account_id,
                    ];

                    pool.query(updateQuery, updateValues)
                        .then(() => {
                            response.json({
                                message: 'Password updated successfully',
                            });
                        })
                        .catch((error) => {
                            console.error(
                                'Error updating password in DB',
                                error
                            );
                            response.status(500).send({
                                message: 'Server error - contact support',
                            });
                        });
                } else {
                    console.error('Old password does not match');
                    response.status(400).send({
                        message: 'Invalid Credentials',
                    });
                }
            })
            .catch((error) => {
                console.error('DB Query error on PATCH /password');
                console.error(error);
                response.status(500).send({
                    message: 'Server error - contact support',
                });
            });
    }
);

export { passRouter };
