import express from 'express';
import { PrismaClient } from '@prisma/client';
import { engine } from 'express-handlebars';

const app = express();
const prisma = new PrismaClient();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');

app.use(express.json());

// User routes
app.post('/register', async (req, res) => {
  try {
    // Extract the user data from the request body
    const { username, email, password } = req.body;

    // Perform validation on the user data (e.g., check for required fields, validate email format, etc.)

    // Create a new user in the database using the Prisma client
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password,
      },
    });

    // Return a success response with the newly created user
    res.status(201).json(newUser);
  } catch (error) {
    // Handle any errors that occur during the registration process
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
});

app.post('/login', async (req, res) => {
  // Login logic
});

// Group routes
app.post('/group', async (req, res) => {
  // Group creation logic
});

app.post('/group/:id/invite', async (req, res) => {
  // Invitation logic
});

// Reminder routes
app.post('/reminder', async (req, res) => {
  // Reminder creation logic
});

app.listen(3010, () => {
  console.log('Server is running on port 3010');
});