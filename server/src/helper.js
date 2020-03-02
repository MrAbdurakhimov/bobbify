/*
 * Helper of Application
 * Version: 2.0.0
 * Author: Genemator
 */

// Exporting emaill from file
export const isEmail = (emaill) => {

	// Email Pattern on Regex
	const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	// Checking email with given pattern below
	return regex.test(emaill);
};

// Checking id and converting it to string
export const toString = (id = "") => {

	// Returning id of user
	return `${id}`;
};