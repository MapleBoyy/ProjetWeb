import express from 'express';
import { engine } from 'express-handlebars';

const app = express();
const port = 3010;

const userRouter = express.Router();

const logger = (req, _res, next) => {
  console.log(`IP: ${req.ip}, Method: ${req.method}, Route: ${req.originalUrl}, Date: ${new Date().toLocaleString()}`);
  next();
};

// Apply the logger middleware
app.use(logger);

// Configure Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// User routes
userRouter.get('/register', (_req, res) => {
  res.render('register');
});

userRouter.post('/register', async (_req, _res) => {
  // Handle registration
});

// Apply the user router
app.use('/user', userRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});