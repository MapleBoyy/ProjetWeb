//C:\Users\gabri\Documents\GitHub\ProjetWeb

const express = require('express');
const { resolve } = require('path');

const handlebars = require('express-handlebars');

const app = express();
const port = 3010;

const userRouter = express.Router();


// Si je veux accéder aux parametres depuis le routeur parent
const itemRouter = express.Router({ mergeParams: true });

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

// userRouter.get('/users',(req, res) => {
//   res.send('La liste des users');
// })

userRouter.get('/:name', (req, res) => {
  var name = req.params.name;
  return res.json({ message: 'User Show', data: name });
});


//-------------------------------------------------------------------------Middleware
const expressMiddleware = require('express');
const appMiddleware = expressMiddleware();

appMiddleware.use((req, res, next) => {
  const ipAddress = req.ip; 
  const currentDate = new Date().toLocaleString(); 
  const method = req.method; 
  const route = req.url; 

  console.log(`IP: ${ipAddress} - Date: ${currentDate} - Method: ${method} - Route: ${route}`);

  next(); 
});

appMiddleware.get('/', (req, res) => {
  res.send('Bienvenue sur la page d\'accueil !');
});

const portMiddleware = 3000;
appMiddleware.listen(portMiddleware, () => {
  console.log(`Serveur en cours d'exécution sur le port ${portMiddleware}`);
});

//CONTACTS
const {PrismaClient} = require ('@prisma/client');
const prisma = new PrismaClient();

const rtrContactts = express.Router();

app.use('/contact/', rtrContactts);
rtrContactts.get('createContact/:name', async(req, res) => {
  const newUser = await prisma.contact.create({
    data: {
      email: req.params.name + '@gmail.com',
      name: req.params.name, 
    },
  })
  res.jsonn(newUser);
})

rtrContactts.get('viewContact/:name', async(req, res)=> {
  const seeUser = await prisma.contact.create({
    data: {
      email: req.params.name + '@gmail.com',
      name: req.params.name,
    },
  })
})




//HANDLEBARS

app.set('afficher le moteur', 'hbs');
app.engine('hbs', handlebars({
  layoutsDir: __dirname + '/views/layouts',
  extname: 'hbs'
  }));
app.use(express.static('public'))

app.get('/', (req, res)=>{
  res.render('main', {layout : 'index'});
});
app.listen(port, ()=> console.log('App listening to port ${port}'));

app.engine('hbs', handlebars({ 
  layoutsDir : __dirname + '/views/layouts', 
  extname : 'hbs', 
  //nouveau paramètre de configuration 
  defaultLayout : 'planB', 
  }));
  app.get('/', (req, res) => { 
  //au lieu de res.render('main', {layout: 'index'}); 
  res.render('main'); 
  });

  app.engine('hbs', handlebars({ 
    layoutsDir : __dirname + '/views/layouts', 
    extname : 'hbs', 
    defaultLayout : 'planB', 
    //nouveau paramètre de configuration 
    partialsDir : __dirname + '/views/partials/' 
    }));
    app.get('/', (req, res) => { 
    //Utilisation du fichier index.hbs au lieu de planB 
    res.render('main', {layout: 'index'});});