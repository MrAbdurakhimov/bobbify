/*
 * Main File of Application
 * Version: 2.0.0
 * Author: Genemator
 */

// Importing modules
import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {Server} from 'uws';
import AppRouter from './app-router'
import Model from './models'
import Database from './database'
import path from 'path'

// Creating Express App
const PORT = 3001;
const app = express();
app.server = http.createServer(app);

// In case of Morganisation
// app.use(morgan('dev'));

// Header usage
app.use(cors({
    exposedHeaders: "*"
}));

// Showing limit of json weigh
app.use(bodyParser.json({
    limit: '50mb'
}));

// WSS and Express
app.wss = new Server({
	server: app.server
});


// Static WWW Files use Express
const wwwPath = path.join('www');
app.use('/', express.static(wwwPath));

// Connecting to Mongo Database
new Database().connect().then((db) => {
	console.log("Successful connected to database.");
	app.db = db;
}).catch((err) => {
	throw(err);
});


// Connecting and registering Models & Routers
app.models = new Model(app);
app.routers = new AppRouter(app);

// Starting to listen a port and host the application
app.server.listen(process.env.PORT || PORT, () => {
        console.log(`App is running on port ${app.server.address().port}`);
});

// Exporting the app
export default app;