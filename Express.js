import express from 'express';
import { PrismaClient } from '@prisma/client';
import { engine } from 'express-handlebars';
import bcrypt from 'bcrypt';
import session from 'express-session';
import hbs from 'hbs';

const app = express();
const prisma = new PrismaClient();
const port = 3010;

const logger = (req, _res, next) => {
  console.log(`IP: ${req.ip}, Méthode: ${req.method}, Route: ${req.originalUrl}, Date: ${new Date().toLocaleString()}`);
  next();
};
// Appliquer le middleware logger
app.use(logger);

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Ajouter cette ligne
app.use(express.static('static'));
app.use(session({
  secret: 'votre clé secrète',
  resave: false,
  saveUninitialized: true,
}));

hbs.registerPartials(new URL('./views/partials', import.meta.url));

// Routes utilisateur
app.post('/user/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si le nom d'utilisateur existe déjà
    const existingUsername = await prisma.utilisateurs.findFirst({
      where: {
        username,
      },
    });

    if (existingUsername) {
      return res.status(400).json({ error: 'Le pseudo existe déjà' });
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await prisma.utilisateurs.findFirst({
      where: {
        email,
      },
    });

    if (existingEmail) {
      return res.status(400).json({ error: 'L\'email existe déjà' });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.utilisateurs.create({
      data: {
        username,
        email,
        password: hashedPassword, // Stocker le mot de passe hashé
      },
    });

    // Rediriger l'utilisateur vers la page de connexion
    res.redirect('/login');
  } catch (error) {
    console.error('Erreur pendant l inscription:', error);
    res.status(500).json({ error: 'Une erreur est arrivé pendant l inscription' });
  }
});

app.post('/user/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Trouver l'utilisateur dans la base de données
    const user = await prisma.utilisateurs.findFirst({
      where: {
        username,
      },
      select: {
        utilisateur_id: true, // Assurez-vous d'inclure l'id ici
        username: true,
        password: true,
      },
    });

    // Si l'utilisateur n'existe pas, envoyer une erreur
    if (!user) {
      return res.status(400).json({ error: 'L\'utilisateur n\'existe pas' });
    }

    // Comparer le mot de passe fourni avec le mot de passe hashé stocké
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Si les mots de passe correspondent, envoyer un message de succès
    if (isPasswordValid) {
      req.session.user = user;
      req.session.save(err => {
        if(err) {
          console.error('Erreur lors de la sauvegarde de la session:', err);
          return res.status(500).json({ error: 'Une erreur est survenue pendant la connexion' });
        }
        return res.redirect('/dashboard');
      });
    } else {
      // Si les mots de passe ne correspondent pas, envoyer une erreur
      return res.status(401).json({ error: 'Mot de passe invalide' });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Une erreur est survenue pendant la connexion' });
  }
});

// Créer un nouveau groupe
app.post('/create-group', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  try {
    console.log(req.session.user.utilisateur_id, "test"); // Utilisez utilisateur_id ici
  } catch (error) {
    console.error('Error logging user id:', error);
  }

  try {
    const { groupName } = req.body;
    const creatorId = req.session.user.utilisateur_id; // Utilisez utilisateur_id ici

    // Vérifier si le nom du groupe est unique et si le créateur est le même
    const existingGroup = await prisma.groupes.findUnique({
      where: {
        nom_groupe: groupName,
        createur_id: creatorId,
      },
    });

    if (existingGroup) {
      return res.status(400).json({ error: 'Le nom du groupe existe déjà pour cet utilisateur' });
    }

    // Créer le groupe
    const group = await prisma.groupes.create({
      data: {
        nom_groupe: groupName,
        createur_id: creatorId,
      },
    });

    res.status(201).json({ message: 'Groupe créé avec succès', group });
  } catch (error) {
    console.error('Erreur lors de la création du groupe:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la création du groupe' });
  }
});

// Ajouter un utilisateur à un groupe
app.post('/add-user-to-group', async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    // Vérifier si le groupe existe
    const group = await prisma.groupes.findUnique({
      where: {
        groupe_id: groupId,
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Groupe introuvable' });
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.utilisateurs.findUnique({
      where: {
        utilisateur_id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Ajouter l'utilisateur au groupe
    // Cette partie doit être mise à jour en fonction de votre schéma de base de données
    // car il n'est pas clair comment vous gérez la relation entre les utilisateurs et les groupes

    res.status(200).json({ message: 'Utilisateur ajouté au groupe avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur au groupe:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de l\'ajout de l\'utilisateur au groupe' });
  }
});

//-----------------------APP.GET-----------------------//

// Routes utilisateur
app.get('/register', (_req, res) => {
  res.render('register');
});

app.get('/login', (_req, res) => {
  res.render('login');
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect('/login');
  });
});

//app.get create-group
app.get('/create-group', (req, res) => {
  if (req.session.user) {
    res.render('create-group', { username: req.session.user && req.session.user.username });
  } else {
    res.redirect('/login');
  }
});

//app.get add-user-to-group
app.get('/add-user-to-group', (req, res) => {
  if (req.session.user) {
    res.render('add-user-to-group');
  } else {
    res.redirect('/login');
  }
});


app.get('/dashboard', (req, res) => {
  if (req.session.user) {
    res.render('dashboard', { username: req.session.user && req.session.user.username && req.session.user.id});
  } else {
    res.redirect('/login');
  }
});

app.listen(port, () => {
  console.log(`Le serveur fonctionne sur le port ${port}`);
});