import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const router = express.Router();


router.use(express.json()); // Pour pouvoir lire le corps des requêtes JSON

router.get('/login', (_req, res) => {
    res.render('login');
  });

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect('/login');
  });
});

router.post('/user/login', async (req, res) => {
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

export default router;