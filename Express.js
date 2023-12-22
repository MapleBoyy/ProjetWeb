import express from 'express';
import session from 'express-session';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import loginRouter from './js/Login.js';
import registerRouter from './js/Register.js';
import createGroupRouter from './js/Create-group.js';
import addUserRouter from './js/Add-User.js';
import dashboardRouter from './js/Dashboard.js';
import addRappelRouter from './js/Add-Rappel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3010;

app.engine('handlebars', engine({
  partialsDir: path.join(__dirname, '/views/partials/')
}));

app.set('view engine', 'handlebars');

app.use(express.static('static'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'votre clé secrète',
  resave: false,
  saveUninitialized: true,
}));

app.use(loginRouter);
app.use(registerRouter);
app.use(createGroupRouter);
app.use(addUserRouter);
app.use(dashboardRouter);
app.use(addRappelRouter);

app.listen(port, () => {
  console.log(`Le serveur fonctionne sur le port ${port}`);
});