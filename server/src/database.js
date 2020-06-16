/*
 * Database of Application
 * Version: 2.0.0
 * Author: Genemator
 */

// Importing modules
import {MongoClient} from 'mongodb'

// Url path of MongoDB Server
// If it's public MongoDB server,
// with you own credentials!
const URL = 'mongodb://localhost:27017/bobbify';

// Exporting variables to another js
export default class Database{
	// Connect function with error handlers
	connect(){
		// eslint-disable-next-line no-undef
		return new Promise((resolve, reject) => {
			// Connecting here
			MongoClient.connect(URL, (err, db) => {
				//Now handling errors
				return err ? reject(err) : resolve(db);
			});
		});
	}
}