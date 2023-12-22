import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/dashboard', async (req, res) => {
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



export default router;