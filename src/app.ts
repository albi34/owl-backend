import express from 'express';
import compression from 'compression'; // compresses requests
import session from 'express-session';
import bodyParser from 'body-parser';
import lusca from 'lusca';
import mongo from 'connect-mongo';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import bluebird from 'bluebird';
import { MONGODB_URI, SESSION_SECRET } from './util/secrets';

const MongoStore = mongo(session);

import * as homeController from './controllers/home';
import * as itemController from './controllers/item';
import * as listController from './controllers/list';

const app = express();

const mongoUrl = MONGODB_URI;
mongoose.Promise = bluebird;

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
  })
  .catch(err => {
    console.log(
      `MongoDB connection error. Please make sure MongoDB is running. ${err}`,
    );
  });

app.set('port', process.env.PORT || 3000);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    store: new MongoStore({
      url: mongoUrl,
      autoReconnect: true,
    }),
  }),
);
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));

app.use(
  express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }),
);

/**
 * Owl List API.
 */
app.get('/', homeController.index, app);

app.get('/list', listController.getLists);
app.post('/list', listController.createList);
app.delete('/list/:id', listController.deleteList);

/**
 * Owl Item API.
 */
app.get('/item/:id', itemController.getItems);
app.post('/item', itemController.addOrUpdateItemToList);
app.delete('/item/:id', itemController.deleteItem);


export default app;
