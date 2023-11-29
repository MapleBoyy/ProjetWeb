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

// Login logic
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.password !== password) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }
  res.json(user);
});

// Group creation logic
app.post('/group', async (req, res) => {
  const { name } = req.body;
  const group = await prisma.group.create({ data: { name } });
  res.status(201).json(group);
});

// Invitation logic
app.post('/group/:id/invite', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const invitation = await prisma.invitation.create({
    data: { groupId: parseInt(id, 10), userId },
  });
  res.status(201).json(invitation);
});

// Reminder creation logic
app.post('/reminder', async (req, res) => {
  const { message, userId } = req.body;
  const reminder = await prisma.reminder.create({
    data: { message, userId },
  });
  res.status(201).json(reminder);
});

app.listen(3010, () => {
  console.log('Server is running on port 3010');
});