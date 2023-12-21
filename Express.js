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


app.use(logger);

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
        utilisateur_id: true,
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
    const { groupName } = req.body;
    const creatorId = req.session.user.utilisateur_id; // Utilisez utilisateur_id ici

    // Vérifier si le nom du groupe est unique
    const existingGroup = await prisma.groupes.findFirst({
      where: {
        nom_groupe: groupName,
      },
    });

    if (existingGroup) {
      return res.status(400).json({ error: 'Le nom du groupe existe déjà' });
    }

    // Créer le groupe
    const group = await prisma.groupes.create({
      data: {
        nom_groupe: groupName,
        createur_id: creatorId,
      },
    });

    // Ajouter le créateur du groupe à la table utilisateurs_groupes
    await prisma.utilisateurs_groupes.create({
      data: {
        utilisateur_id: creatorId,
        groupe_id: group.groupe_id,
      },
    });

    return res.redirect('/add-user-to-group');
  } catch (error) {
    console.error('Erreur lors de la création du groupe:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la création du groupe' });
  }
});

// Ajouter un utilisateur à un groupe
app.post('/add-user-to-group', async (req, res) => {
  console.log(req.body);
  try {
    const { groupId, userId } = req.body;

    // Vérifier si groupId et userId sont fournis
    if (!groupId || !userId) {
      return res.status(400).json({ error: 'groupId et userId sont requis' });
    }

    // Vérifier si le groupe existe
    const group = await prisma.groupes.findUnique({
      where: {
        groupe_id: Number(groupId),
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Groupe introuvable' });
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.utilisateurs.findUnique({
      where: {
        utilisateur_id: Number(userId),
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Vérifier si l'utilisateur est déjà membre du groupe
    const existingMembership = await prisma.utilisateurs_groupes.findFirst({
      where: {
        utilisateur_id: Number(userId),
        groupe_id: Number(groupId),
      },
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'L\'utilisateur est déjà membre de ce groupe' });
    }

    // Ajouter l'utilisateur au groupe
    const userGroup = await prisma.utilisateurs_groupes.create({
      data: {
        utilisateur_id: Number(userId),
        groupe_id: Number(groupId),
      },
    });

    // Rediriger vers le tableau de bord une fois l'utilisateur ajouté
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur au groupe:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de l\'ajout de l\'utilisateur au groupe' });
  }
});

// Traiter les données du formulaire de création de rappel
app.post('/add-rappel', async (req, res) => {
  console.log(req.body);
  if (!req.session.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  
  const { groupe_id, nom_rappel, date_echeance, heure_echeance, description, couleur } = req.body;

  // Convertir groupe_id en nombre
  const groupeIdNumber = Number(groupe_id);

  // Vérifier si le groupe_id existe dans la table groupes
  const groupe = await prisma.groupes.findUnique({
    where: {
      groupe_id: groupeIdNumber,
    },
  });

  if (!groupe) {
    console.error(`Erreur: Le groupe_id ${groupeIdNumber} n'existe pas dans la table groupes.`);
    return res.status(400).json({ error: `Le groupe_id ${groupeIdNumber} n'existe pas dans la table groupes.` });
  }

  // Vérifiez si heure_echeance et couleur sont présents
  if (heure_echeance === undefined || heure_echeance === null || couleur === undefined || couleur === null) {
    return res.status(400).json({ error: 'heure_echeance et couleur sont requis' });
  }

  try {
    const { nom_rappel, date_echeance, heure_echeance, description, couleur } = req.body;
  
  const dateTimeEcheance = new Date(`${date_echeance}T${heure_echeance}`).toISOString();

  // Créer le rappel
  const rappel = await prisma.rappels.create({
    data: {
      nom_rappel,
      date_echeance: new Date(date_echeance), // Utilisez date_echeance ici
      description,
      heure_echeance: new Date(dateTimeEcheance), // Convertissez heure_echeance en Date
      couleur,
      groupes: {
        connect: {
          groupe_id: groupeIdNumber,
        },
      },
    },
  });
  
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Erreur lors de la création du rappel:', error);                     
    res.status(500).json({ error: 'Une erreur est survenue lors de la création du rappel' });
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
app.get('/add-user-to-group', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  try {
    const creatorId = req.session.user.utilisateur_id; // Utilisez utilisateur_id ici
    const groups = await prisma.groupes.findMany({
      where: {
        createur_id: creatorId,
      },
    });
    const users = await prisma.utilisateurs.findMany();
    res.render('add-user-to-group', { groups, users });
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes ou des utilisateurs:', error);
    res.status(500).send('Une erreur est survenue lors de la récupération des groupes ou des utilisateurs');
  }
});


app.get('/dashboard', async (req, res) => {
  if (req.session.user) {
    try {
      const userId = req.session.user.utilisateur_id;

      // Récupérez les groupes de l'utilisateur
      const userGroups = await prisma.utilisateurs_groupes.findMany({
        where: {
          utilisateur_id: userId,
        },
        include: {
          groupe: {
            include: {
              createur: {
                select: {
                  username: true,
                  utilisateur_id: true,
                },
              },
              utilisateurs_groupes: {
                include: {
                  utilisateur: {
                    select: {
                      username: true,
                      utilisateur_id: true,
                    },
                  },
                },
              },
              rappels: {
                orderBy: {
                  date_echeance: 'desc',
                },
              },
            },
          },
        },
      });

      // Récupérez les groupes à partir des adhésions de groupe
      const groups = userGroups.map((userGroup) => userGroup.groupe);

      let rappels = groups.flatMap((group) => group.rappels.map((rappel) => {
        let dateEcheance = new Date(rappel.date_echeance);
        let heureEcheance = new Date(rappel.heure_echeance);
        let dateHeureEcheance = new Date(
          dateEcheance.getFullYear(),
          dateEcheance.getMonth(),
          dateEcheance.getDate(),
          heureEcheance.getHours(),
          heureEcheance.getMinutes(),
          heureEcheance.getSeconds()
        );
        let heure = heureEcheance.toTimeString().substring(0, 5);
        return {
          ...rappel,
          heure_echeance: heure,
          dateHeureEcheance,
          groupName: group.name, // Ajoutez le nom du groupe
        };
      }));
      
      // Triez les rappels par date et heure d'échéance les plus proches à la plus éloignée
      rappels.sort((a, b) => a.dateHeureEcheance - b.dateHeureEcheance);
      
      // Renvoyez les groupes, les rappels et le nom d'utilisateur à la vue
      res.render('dashboard', { username: req.session.user.username, groups, rappels });
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes de l\'utilisateur:', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des groupes de l\'utilisateur' });
    }
  } else {
    res.redirect('/login');
  }
});

// Afficher le formulaire de création de rappel
app.get('/add-rappel', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  try {
    const userId = req.session.user.utilisateur_id;

    // Récupérez les groupes de l'utilisateur
    const userGroups = await prisma.utilisateurs_groupes.findMany({
      where: {
        utilisateur_id: userId,
      },
      include: {
        groupe: true,
      },
    });

    // Récupérez les groupes à partir des adhésions de groupe
    const groups = userGroups.map((userGroup) => userGroup.groupe);

    // Renvoyez les groupes à la vue
    res.render('add-rappel', { groups });
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes de l\'utilisateur:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des groupes de l\'utilisateur' });
  }
});

app.listen(port, () => {
  console.log(`Le serveur fonctionne sur le port ${port}`);
});