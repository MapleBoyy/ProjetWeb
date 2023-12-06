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
app.use(express.static('static'));

// User routes
app.post('/user/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the username already exists
    const existingUsername = await prisma.utilisateurs.findFirst({
      where: {
        username,
      },
    });

    if (existingUsername) {
      return res.status(400).json({ error: 'Le pseudo existe déjà' });
    }

    // Check if the email already exists
    const existingEmail = await prisma.utilisateurs.findFirst({
      where: {
        email,
      },
    });

    if (existingEmail) {
      return res.status(400).json({ error: 'L\'email existe déjà' });
    }

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

    // Redirect the user to the login page
    res.redirect('/login');
  } catch (error) {
    console.error('Erreur pendant l inscription:', error);
    res.status(500).json({ error: 'Une erreur est arrivé pendant l inscription' });
  }
});


app.post('/user/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user in the database
    const user = await prisma.utilisateurs.findFirst({
      where: {
        username,
      },
    });

    // If the user doesn't exist, send an error
    if (!user) {
      return res.status(400).json({ error: 'User does not exist' });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // If the passwords match, send a success message
    if (isPasswordValid) {
      return res.redirect('/dashboard');
    } else {
      // If the passwords don't match, send an error
      return res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});


// User routes
app.get('/register', (_req, res) => {
  res.render('register');
});

app.get('/login', (_req, res) => {
  res.render('login');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});