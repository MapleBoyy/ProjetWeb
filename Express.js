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

app.post('/user/dashboard', async (req, res) => {
  try {
    const { title, description } = req.body;

    // Create a new reminder in the database
    const reminder = await prisma.reminders.create({
      data: {
        nom_rappel,
        description,
        date_echeance,
        heure_echeance,
        couleur,
        groupe_id,
      },
    });

    // Redirect the user to the dashboard page
    res.redirect('/dashboard');

  } catch (error) {
    console.error('Erreur de création du rappel:', error);
    res.status(500).json({ error: 'Erreur survenue pendant la création du rappel' });
  }
});

// User routes
app.get('/register', (_req, res) => {
  res.render('register');
});

app.get('/login', (_req, res) => {
  res.render('login');
});

app.get('/group/:groupId/dashboard', async(req, res) => {
  try {
    const { groupId } = req.params;
    const reminders = await prisma.reminders.findMany({
      where: {
        group_id: Number(groupId),
      },
    });
  res.render('dashboard', { reminders });
  } catch (error) {
    console.error('Erreur lors de la récupération des rappels:', error);
    res.status(500).json({ error: 'Erreur survenue pendant la récupération des rappels' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});