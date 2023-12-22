import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

//router.get create-group
router.get('/create-group', (req, res) => {
    if (req.session.user) {
      res.render('create-group', { username: req.session.user && req.session.user.username });
    } else {
      res.redirect('/login');
    }
});

// Créer un nouveau groupe
router.post('/create-group', async (req, res) => {
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

export default router;