import express from 'express';
import { PrismaClient } from '@prisma/client';
import session from 'express-session';

const router = express.Router();
const prisma = new PrismaClient();


// Afficher le formulaire de création de rappel
router.get('/add-rappel', async (req, res) => {
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

// Traiter les données du formulaire de création de rappel
router.post('/add-rappel', async (req, res) => {
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


export default router;