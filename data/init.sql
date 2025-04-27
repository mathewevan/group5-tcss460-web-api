-- Active: 1710457548247@@127.0.0.1@5432@tcss460@public
-- Create the books table
DROP DATABASE IF EXISTS TCSS460Books;
-- GO

CREATE DATABASE TCSS460Books;
-- GO

DROP TABLE IF EXISTS Demo;
DROP TABLE IF EXISTS BOOKS;
DROP TABLE IF EXISTS Account_Credential;
DROP TABLE IF EXISTS Account;
DROP TABLE IF EXISTS problem_rows;
DROP TABLE IF EXISTS duplicate_isbn_rows;
DROP TABLE IF EXISTS duplicate_isbns;
DROP TABLE IF EXISTS staging_books;




CREATE TABLE Demo (DemoID SERIAL PRIMARY KEY,
                        Priority INT,
                        Name TEXT NOT NULL UNIQUE,
                        Message TEXT
);

CREATE TABLE Account (Account_ID SERIAL PRIMARY KEY,
                      FirstName VARCHAR(255) NOT NULL,
		              LastName VARCHAR(255) NOT NULL,
                      Username VARCHAR(255) NOT NULL UNIQUE,
                      Email VARCHAR(255) NOT NULL UNIQUE,
                      Phone VARCHAR(15) NOT NULL UNIQUE,
                      Account_Role int NOT NULL
);


CREATE TABLE Account_Credential (Credential_ID SERIAL PRIMARY KEY,
                      Account_ID INT NOT NULL,
                      Salted_Hash VARCHAR(255) NOT NULL,
                      salt VARCHAR(255),
                      FOREIGN KEY(Account_ID) REFERENCES Account(Account_ID)
);

CREATE TABLE BOOKS (id INT PRIMARY KEY,
        isbn13 BIGINT,
        authors TEXT,
        publication_year INT,
        original_title TEXT,
        title TEXT,
        rating_avg FLOAT,
        rating_count INT,
        rating_1_star INT,
        rating_2_star INT,
        rating_3_star INT,
        rating_4_star INT,
        rating_5_star INT,
        image_url TEXT,
        image_small_url TEXT
    );

-- Create a staging table with ALL VARCHAR columns to avoid type conversion errors
CREATE TABLE staging_books (
                               book_id INT,
                               isbn13 BIGINT,
                               authors TEXT,
    original_publication_year INT,
    original_title TEXT,
    title TEXT,
    average_rating FLOAT,
    ratings_count INT,
    ratings_1 INT,
    ratings_2 INT,
    ratings_3 INT,
    ratings_4 INT,
    ratings_5 INT,
    image_url TEXT,
    small_image_url TEXT
);
-- GO

-- Import CSV using BULK INSERT with less restrictive error handling
COPY staging_books
    FROM '/docker-entrypoint-initdb.d/books.csv' -- Use the appropriate file path
    DELIMITER ',' CSV HEADER;
-- GO

-- Create a table to identify duplicate ISBNs
CREATE TEMP TABLE duplicate_isbns AS
SELECT
    isbn13,
    COUNT(*) AS occurrence_count
FROM staging_books
WHERE isbn13 IS NOT NULL
GROUP BY isbn13
HAVING COUNT(*) > 1;

-- Insert only non-duplicate ISBNs and valid data into the final table
INSERT INTO books
SELECT
    book_id,
    isbn13,
    authors,
    original_publication_year,
    original_title,
    title,
    average_rating,
    ratings_count,
    ratings_1,
    ratings_2,
    ratings_3,
    ratings_4,
    ratings_5,
    image_url,
    small_image_url
FROM staging_books s
WHERE

  isbn13 IS NOT NULL
  -- Skip any ISBNs identified as duplicates
  AND NOT EXISTS (SELECT * FROM duplicate_isbns d WHERE d.isbn13 = s.isbn13);
-- GO

-- SELECT *
-- FROM books
-- GO

-- Optional: Log all duplicate ISBNs for review
SELECT s.*
    INTO duplicate_isbn_rows
FROM staging_books s
    JOIN duplicate_isbns d ON s.isbn13 = d.isbn13;
-- GO

-- SELECT *
-- FROM duplicate_isbn_rows
-- GO

-- Optional: Log the problematic rows for investigation
SELECT * INTO problem_rows
FROM staging_books
WHERE
    book_id = 0
   OR original_publication_year = 0
   OR average_rating = 0;
-- GO

-- SELECT *
-- FROM problem_rows
-- GO

-- Drop the temporary tables
DROP TABLE problem_rows;
DROP TABLE duplicate_isbn_rows;
DROP TABLE duplicate_isbns;
DROP TABLE staging_books;

-- DROP TABLE books;
-- GO



-- COPY books
-- FROM '/docker-entrypoint-initdb.d/books.csv'
-- DELIMITER ','
-- CSV HEADER;