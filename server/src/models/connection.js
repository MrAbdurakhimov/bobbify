/*
 * Connection Cluster of Application
 * Version: 2.0.0
 * Author: Genemator
 */

// Importing modules
import {OrderedMap} from 'immutable'
import {ObjectID} from 'mongodb'
import _ from 'lodash'

// Warming up registers for new cluster
export default class Connection {
    constructor(app) {
        this.app = app;
        this.connections = OrderedMap();
        this.modelDidLoad();
    }

    decodeMesasge(msg) {
        let messageObject = null;
        try {
            messageObject = JSON.parse(msg);
        }
        catch (err) {
            console.log("An error decode the socket message", msg);
        }
        return messageObject;
    }

    sendToMembers(userId, obj) {
        const query = [
            {
                $match: {
                    members: {$all: [new ObjectID(userId)]}
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'members',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            {
                $unwind: {
                    path: '$users'
                }
            },
            {
                $match: {'users.online': {$eq: true}}
            },
            {
                $group: {
                    _id: "$users._id"
                }
            }
        ];
        const users = [];
        this.app.db.collection('channels').aggregate(query, (err, results) => {
           // console.log("found members array who is chatting with current user", results);
            if (err === null && results) {
                _.each(results, (result) => {
                    const uid = _.toString(_.get(result, '_id'));
                    if (uid) {
                        users.push(uid);
                    }
                });

                // This is list of all connections is chatting with current user
                const memberConnections = this.connections.filter((con) => _.includes(users, _.toString(_.get(con, 'userId'))));
                if (memberConnections.size) {
                    memberConnections.forEach((connection) => {
                        const ws = connection.ws;
                        this.send(ws, obj);
                    });
                }
            }
        })
    }

    sendAll(obj) {
        // Send socket messages to all clients.
        this.connections.forEach((con) => {
            const ws = con.ws;
            this.send(ws, obj);
        });
    }

    send(ws, obj) {
        const message = JSON.stringify(obj);
        ws.send(message);
    }

    doTheJob(socketId, msg) {
        const action = _.get(msg, 'action');
        const payload = _.get(msg, 'payload');
        const userConnection = this.connections.get(socketId);
        switch (action) {
            case 'create_message':
                if (userConnection.isAuthenticated) {
                    let messageObject = payload;
                    messageObject.userId = _.get(userConnection, 'userId');
                    console.log("Got message from client about creating new message", payload);
                    this.app.models.message.create(messageObject).then((message) => {
                        console.log("Message created", message);
                        const channelId = _.toString(_.get(message, 'channelId'));
                        this.app.models.channel.load(channelId).then((channel) => {
                            console.log("got channel of the message created", channel);
                            const memberIds = _.get(channel, 'members', []);
                            _.each(memberIds, (memberId) => {
                                memberId = _.toString(memberId);
                                const memberConnections = this.connections.filter((c) => _.toString(c.userId) === memberId);
                                memberConnections.forEach((connection) => {
                                    const ws = connection.ws;
                                    this.send(ws, {
                                        action: 'message_added',
                                        payload: message,
                                    })
                                })
                            });
                        })
                        // Message created successful.
                        // eslint-disable-next-line no-unused-vars
                    }).catch(err => {
                        // Send back to the socket client who sent this messagse with error
                        const ws = userConnection.ws;
                        this.send(ws, {
                            action: 'create_message_error',
                            payload: payload,
                        })
                    })
                }
                break;
            // eslint-disable-next-line no-case-declarations
            case 'create_channel':
                let channel = payload;
                const userId = userConnection.userId;
                channel.userId = userId;
                this.app.models.channel.create(channel).then((chanelObject) => {
                    // Successful created channel ,
                    console.log("Successful created new channel", typeof userId, chanelObject);
                    // Let send back to all members in this channel  with new channel  created
                    // eslint-disable-next-line no-unused-vars
                    let memberConnections = [];
                    const memberIds = _.get(chanelObject, 'members', []);
                    // Fetch all users has memberId
                    const query = {
                        _id: {$in: memberIds}
                    };
                    const queryOptions = {
                        _id: 1,
                        name: 1,
                        created: 1,
                    };
                    this.app.models.user.find(query, queryOptions).then((users) => {
                        chanelObject.users = users;
                        _.each(memberIds, (id) => {
                            const userId = id.toString();
                            const memberConnection = this.connections.filter((con) => `${con.userId}` === userId);
                            if (memberConnection.size) {
                                memberConnection.forEach((con) => {
                                    const ws = con.ws;
                                    const obj = {
                                        action: 'channel_added',
                                        payload: chanelObject,
                                    };
                                    // Send to socket client matching userId in channel members.
                                    this.send(ws, obj);
                                })
                            }
                        });
                    });
                });
                break;
            // eslint-disable-next-line no-case-declarations
            case 'auth':
                const userTokenId = payload;
                let connection = this.connections.get(socketId);
                if (connection) {
                    // Let find user with this token and verify it.
                    this.app.models.token.loadTokenAndUser(userTokenId).then((token) => {
                        const userId = token.userId;
                        connection.isAuthenticated = true;
                        connection.userId = `${userId}`;
                        this.connections = this.connections.set(socketId, connection);
                        // Now send back to the client you are verified.
                        const obj = {
                            action: 'auth_success',
                            payload: 'You are verified',
                        };
                        this.send(connection.ws, obj);
                        //Send to all socket clients connection
                        const userIdString = _.toString(userId);
                        this.sendToMembers(userIdString, {
                            action: 'user_online',
                            payload: userIdString,
                        });
                        this.app.models.user.updateUserStatus(userIdString, true);
                        // eslint-disable-next-line no-unused-vars
                    }).catch((err) => {
                        // send back to socket client you are not logged.
                        const obj = {
                            action: 'auth_error',
                            payload: "An error authentication your account: " + userTokenId
                        };
                        this.send(connection.ws, obj);
                    })}
                break;
            default:
                break;
        }
    }

    modelDidLoad() {
        this.app.wss.on('connection', (ws) => {
            const socketId = new ObjectID().toString();
            const clientConnection = {
                _id: `${socketId}`,
                ws: ws,
                userId: null,
                isAuthenticated: false,
            };
            // Save this connection client to cache.
            this.connections = this.connections.set(socketId, clientConnection);
            // Listen any message from websocket client.
            ws.on('message', (msg) => {
                const message = this.decodeMesasge(msg);
                this.doTheJob(socketId, message);
            });

            ws.on('close', () => {
                const closeConnection = this.connections.get(socketId);
                const userId = _.toString(_.get(closeConnection, 'userId', null));
                // Let remove this socket client from the cache collection.
                this.connections = this.connections.remove(socketId);
                if (userId) {
                    // Now find all socket clients matching with userId
                    const userConnections = this.connections.filter((con) => _.toString(_.get(con, 'userId')) === userId);
                    if (userConnections.size === 0) {
                        // This mean no more socket clients is online with this userId. now user is offline.
                        this.sendToMembers(userId, {
                            action: 'user_offline',
                            payload: userId
                        });
                        // Update user status into database
                        this.app.models.user.updateUserStatus(userId, false);
                    }
                }
            });
        });
    }
}