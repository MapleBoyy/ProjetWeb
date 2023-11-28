import express from 'express';
import { engine } from 'express-handlebars';

// const express = require('express');
// const { resolve } = require('path');

const app = express();
const port = 3010;

const userRouter = express.Router();

const logger = (req, res, next) => {
  console.log(`IP: ${req.ip}, Method: ${req.method}, Route: ${req.originalUrl}, Date: ${new Date().toLocaleString()}`);
  next();
};



app.use(express.json());

app.use(logger);

app.use(express.static('static'));

app.get('/', (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/index.html'));
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.use('/tests', userRouter);

userRouter.get('/', (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/test.html'));
});

const validateNumberMiddleware = (req, res, next) => {
  const dynamicParam =  Number(req.params.name);
  console.log(typeof dynamicParam);
  if (isNaN(dynamicParam) || dynamicParam >= 10) {
    return res.status(400).json({ error: 'L\'argument doit être un nombre inferieur à 10.' });
  }
  next();
};



userRouter.get('/:name', validateNumberMiddleware, (req, res) => {
  var name = req.params.name;
  return res.json({ message: 'User Show', data: name });
});




// const { PrismaClient } = require('@prisma/client')

// const prisma = new PrismaClient()


/*app.get('/contacts', async(req, res) => {
  //res.sendFile(resolve(__dirname, 'pages/contact.html'));
  /*
  const newUser = await prisma.contact.create({
    data: {
        prenom: "Tristan",
        nom: "Guillemier",
        email: "t@gmail.com",
        tel: "0640130334",
      }
  })
  res.send(newUser);
  

  const contacts = await prisma.contact.findMany();
  res.send(contacts);
 
  
});
*/

app.get('/contacts', async(req, res) => {
  res.sendFile(resolve(__dirname, 'pages/contact.html'));
  const { prenom, nom, email, tel } = req;
  const newContact = await prisma.contact.create({
    data: {
      prenom,
      nom,
      email,
      tel,
    },
  });
  res.send(newContact); 
});


app.get('/contacts/:name', async(req, res) => {
  const name = req.params.name;
  const contact = await prisma.contact.findFirst({
    where: {
      nom: name
    }
  });
  if (contact) {
    res.send(contact);
  } else {
    res.status(404).send({ error: 'Utilisateur non trouvé' });
  }
});


// Configure Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/handlebar', (req, res) => {
  res.render('handlebar');
});