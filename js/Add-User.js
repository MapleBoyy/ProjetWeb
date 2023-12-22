import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

//app.get add-user-to-group
router.get('/add-user-to-group', async (req, res) => {
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

// Ajouter un utilisateur à un groupe
router.post('/add-user-to-group', async (req, res) => {
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

export default router;

