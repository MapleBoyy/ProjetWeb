import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const router = express.Router();

router.use(express.json()); // Pour pouvoir lire le corps des requêtes JSON

router.get('/register', (_req, res) => {
    res.render('register');
  });

router.post('/user/register', async (req, res) => {
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

export default router;