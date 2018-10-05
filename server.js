const restify = require('restify');
const graphqlHTTP = require('express-graphql');
const models = require('./models');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportConfig = require('./services/auth');
const MongoStore = require('connect-mongo')(session);
const schema = require('./schema/schema');
const app = restify.createServer();
// Replace with your mongoLab URI
if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
};
const MONGO_URI = process.env.MONGO_URI

// Mongoose's built in promise library is deprecated, replace it with ES2015 Promise
mongoose.Promise = global.Promise;

// Connect to the mongoDB instance and log a message
// on success or failure
mongoose.connect(MONGO_URI);
mongoose.connection
    .once('open', () => console.log('Connected to Mongo Cloud Atlas instance.'))
    .on('error', error => console.log('Error connecting to Mongo Cloud Atlas:', error));

// Configures express to use sessions.  This places an encrypted identifier
// on the users cookie.  When a user makes a request, this middleware examines
// the cookie and modifies the request object to indicate which user made the request
// The cookie itself only contains the id of a session; more data about the session
// is stored inside of MongoDB.
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SECRET,
  store: new MongoStore({
    url: MONGO_URI,
    autoReconnect: true
  })
}));

// Passport is wired into express as a middleware. When a request comes in,
// Passport will examine the request's session (as set by the above config) and
// assign the current user to the 'req.user' object.  See also servces/auth.js
app.use(passport.initialize());
app.use(passport.session());
app.post('/graphql', graphqlHTTP({
  schema,
  graphiql: false
}));

app.get('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}));

app.get('/', restify.plugins.serveStatic({
  directory: __dirname + '/dist/index.html',
}));

app.listen(process.env.PORT || 8000, function () {
    console.log('Express server is running on port 8000');
});
