/*
 * Router of Application
 * Version: 2.0.0
 * Author: Genemator
 */

// Importing modules
import _ from 'lodash'

// Starting Router class
export default class AppRouter {

    // New Router app
    constructor(app) {
        this.app = app;
        this.setupRouter = this.setupRouter.bind(this);
        this.setupRouter();
    }

    // Setting up routes
    setupRouter() {

        // Initializing apps
        const app = this.app;

        // If works well, then console that it works
        console.log("APp ROuter works!");


        /**
         * @description: The Users Route
         * @endpoint: /api/users
         * @method: POST
         **/
        app.post('/api/users', (req, res) => {
            const body = req.body;
            app.models.user.create(body).then((user) => {
                _.unset(user, 'password');
                return res.status(200).json(user);
            }).catch(err => {
                return res.status(503).json({error: err});
            })
        });


        /**
         * @description: Getting info of user
         * @endpoint: /api/users/me
         * @method: GET
         **/
        app.get('/api/users/me', (req, res) => {
            let tokenId = req.get('authorization');
            if (!tokenId) {
                // Get token from query
                tokenId = _.get(req, 'query.auth');
            }

            app.models.token.loadTokenAndUser(tokenId).then((token) => {
                _.unset(token, 'user.password');
                return res.json(token);
            }).catch(err => {
                return res.status(401).json({
                    error: err
                })
            });
        });


        /**
         * @description: Search user
         * @endpoint: /api/users/search
         * @method: POST
         **/
        app.post('/api/users/search', (req, res) => {
            const keyword = _.get(req, 'body.search', '');
            app.models.user.search(keyword).then((results) => {
                return res.status(200).json(results);
            }).catch(() => {
                return res.status(404).json({
                    error: 'Not found.'
                })
            })
        });


        /**
         * @description: Get User ID
         * @endpoint: /api/users/:id
         * @method: GET
         **/
        app.get('/api/users/:id', (req, res) => {
            const userId = _.get(req, 'params.id');
            app.models.user.load(userId).then((user) => {
                _.unset(user, 'password');
                return res.status(200).json(user);
            }).catch(err => {
                return res.status(404).json({
                    error: err,
                })
            })
        });


        /**
         * @description: User Login
         * @endpoint: /api/users/login
         * @method: POST
         **/
        app.post('/api/users/login', (req, res) => {
            const body = _.get(req, 'body');
            app.models.user.login(body).then((token) => {
                _.unset(token, 'user.password');
                return res.status(200).json(token);
            }).catch(err => {
                return res.status(401).json({
                    error: err
                })
            })
        });


        /**
         * @endpoint: /api/channels/:id
         * @method: GET
         **/
        app.get('/api/channels/:id', (req, res) => {
            const channelId = _.get(req, 'params.id');
            console.log(channelId);
            if (!channelId) {
                return res.status(404).json({error: {message: "Not found."}});
            }
            app.models.channel.load(channelId).then((channel) => {
                // Fetch all uses belong to memberId
                const members = channel.members;
                const query = {
                    _id: {$in: members}
                };
                const options = {_id: 1, name: 1, created: 1};
                app.models.user.find(query, options).then((users) => {
                    channel.users = users;
                    return res.status(200).json(channel);
                }).catch(() => {
                    return res.status(404).json({error: {message: "Not found."}});
                });
            }).catch(() => {
                return res.status(404).json({error: {message: "Not found."}});
            })
        });


        /**
         * @description: Get Channel messages
         * @endpoint: /api/channels/:id/messages
         * @method: GET
         **/
        app.get('/api/channels/:id/messages', (req, res) => {
            let tokenId = req.get('authorization');
            if (!tokenId) {
                // Get token from query
                tokenId = _.get(req, 'query.auth');
            }
            app.models.token.loadTokenAndUser(tokenId).then((token) => {
                const userId = token.userId;
                // Make sure user are logged in
                // Check if this user is inside of channel members. other retun 401.
                let filter = _.get(req, 'query.filter', null);
                if (filter) {
                    filter = JSON.parse(filter);
                    console.log(filter);
                }
                const channelId = _.toString(_.get(req, 'params.id'));
                const limit = _.get(filter, 'limit', 50);
                const offset = _.get(filter, 'offset', 0);
                // Load channel
                this.app.models.channel.load(channelId).then((c) => {
                    const memberIds = _.get(c, 'members');
                    const members = [];
                    _.each(memberIds, (id) => {
                        members.push(_.toString(id));
                    });
                    if (!_.includes(members, _.toString(userId))) {
                        return res.status(401).json({error: {message: "Access denied"}});
                    }
                    this.app.models.message.getChannelMessages(channelId, limit, offset).then((messages) => {
                        return res.status(200).json(messages);
                    }).catch(() => {
                        return res.status(404).json({error: {message: "Not found."}});
                    })
                }).catch(() => {
                    return res.status(404).json({error: {message: "Not found."}});
                })
            }).catch(() => {
                return res.status(401).json({error: {message: "Access denied"}});
            });
        });


        /**
         * @description: Get my channels
         * @endpoint: /api/me/channels
         * @method: GET
         **/
        app.get('/api/me/channels', (req, res) => {
            let tokenId = req.get('authorization');
            if (!tokenId) {
                // Get token from query
                tokenId = _.get(req, 'query.auth');
            }
            app.models.token.loadTokenAndUser(tokenId).then((token) => {
                const userId = token.userId;
                const query = [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'members',
                            foreignField: '_id',
                            as: 'users',
                        }
                    },
                    {
                        $match: {
                            members: {$all: [userId]}
                        }
                    },
                    {
                        $project: {
                            _id: true,
                            title: true,
                            lastMessage: true,
                            created: true,
                            updated: true,
                            userId: true,
                            users: {
                                _id: true,
                                name: true,
                                created: true,
                                online: true
                            },
                            members: true,
                        }
                    },
                    {
                        $sort: {updated: -1, created: -1}
                    },
                    {
                        $limit: 50,
                    }
                ];
                app.models.channel.aggregate(query).then((channels) => {
                    return res.status(200).json(channels);
                }).catch(() => {
                    return res.status(404).json({error: {message: "Not found."}});
                })
                // eslint-disable-next-line no-unused-vars
            }).catch(err => {
                return res.status(401).json({
                    error: "Access denied."
                })
            });
        });


        /**
         * @description: Logging out session
         * @endpoint: /api/me/logout
         * @method: GET
         **/
        app.get('/api/me/logout', (req, res) => {
            let tokenId = req.get('authorization');
            if (!tokenId) {
                // Get token from query
                tokenId = _.get(req, 'query.auth');
            }
            app.models.token.loadTokenAndUser(tokenId).then((token) => {
                app.models.token.logout(token);
                return res.status(200).json({
                    message: 'Successful.'
                });
                // eslint-disable-next-line no-unused-vars
            }).catch(err => {
                return res.status(401).json({error: {message: 'Access denied'}});
            })
        })
    }
}













