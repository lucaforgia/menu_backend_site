# Navigation Menu Backend

Demo.
Server to run [menu_backend_ember](https://github.com/lucaforgia/menu-backend-ember) and [menu_react](https://github.com/lucaforgia/menu_react) web stuff. Expressjs, MongoDb, Mongoose, Promise, Mocha, Chai, Supertest, React.

## Prerequisites

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM)
* [Bower](http://bower.io/)
* [MongoDb](https://www.mongodb.org/)

## Installation

* `git clone <repository-url>` this repository
* change into the new directory
* `npm install`
* `bower install`

## Running

* `mongod` to start the Db
* `npm start` to start the server
* go to localhost:3000 to see the stuff running
* the server use the menu_backend db. No need to create one via terminal, mongoose does the job.

## Developing

* `mongod` to start the Db
* `npm run dev` to start [nodemon](https://github.com/remy/nodemon)
* go to localhost:3000 to see the stuff running
* after every changed `nodemon` will restar the server


## Testing

To run the Mocha tests, the MongoDb must be running. **The tests clear the Db at the end of the process.**

	npm test

## Linter

	npm run lint
