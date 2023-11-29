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
    const { username, email, password } = req.body;

    const newUser = await prisma.utilisateurs.create({
      data: {
        username,
        email,
        password,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
});

// Login logic
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.utilisateurs.findUnique({ where: { username } });
  if (!user || user.password !== password) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }
  res.json(user);
});

// Group creation logic
app.post('/group', async (req, res) => {
  const { name, createur_id } = req.body;
  const group = await prisma.groupes.create({ data: { nom_groupe: name, createur_id } });
  res.status(201).json(group);
});

// Reminder creation logic
app.post('/reminder', async (req, res) => {
  const { nom_rappel, description, date_echeance, heure_echeance, couleur, groupe_id } = req.body;
  const reminder = await prisma.rappels.create({
    data: { nom_rappel, description, date_echeance, heure_echeance, couleur, groupe_id },
  });
  res.status(201).json(reminder);
});

app.listen(3010, () => {
  console.log('Server is running on port 3010');
});