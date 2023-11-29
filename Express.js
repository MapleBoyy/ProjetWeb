import express from 'express';
import { PrismaClient } from '@prisma/client';
import { engine } from 'express-handlebars';
import bcrypt from 'bcrypt';

const app = express();
const prisma = new PrismaClient();
const port = 3010;

const logger = (req, _res, next) => {
  console.log(`IP: ${req.ip}, Method: ${req.method}, Route: ${req.originalUrl}, Date: ${new Date().toLocaleString()}`);
  next();
};

// Apply the logger middleware
app.use(logger);

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this line

// User routes
app.post('/user/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.utilisateurs.create({
      data: {
        username,
        email,
        password: hashedPassword, // Store the hashed password
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Erreur pendant l inscription:', error);
    res.status(500).json({ error: 'Une erreur est arrivé pendant l inscription' });
  }
});

// User routes
app.get('/register', (_req, res) => {
  res.render('register');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});