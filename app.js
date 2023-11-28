import express from 'express';
import { engine } from 'express-handlebars';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const users = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 24 },
        { name: 'Jack', age: 26 },
    ];

    res.render('home', { isHome: true, users: users });
});

app.get('/add-contact', (req, res) => {
    res.render('add-contact');
});

app.post('/add-contact', async (req, res) => {
    const { firstName, lastName, email, phone, street, city, state, zip } = req.body;

    await prisma.contact.create({
        data: {
            firstName,
            lastName,
            email,
            phone,
            addresses: {
                create: {
                    street,
                    city,
                    state,
                    zip,
                },
            },
        },
    });

    res.redirect('/');
});

app.get('/update-contact/:id', async (req, res) => {
    const contact = await prisma.contact.findUnique({
        where: { id: Number(req.params.id) },
        include: { addresses: true },
    });

    if (!contact) {
        return res.status(404).send('Contact not found');
    }

    res.render('update-contact', { contact });
});

app.post('/update-contact/:id', async (req, res) => {
    const { firstName, lastName, email, phone, street, city, state, zip } = req.body;

    await prisma.contact.update({
        where: { id: Number(req.params.id) },
        data: {
            firstName,
            lastName,
            email,
            phone,
            addresses: {
                update: {
                    where: { contactId: Number(req.params.id) },
                    data: { street, city, state, zip },
                },
            },
        },
    });

    res.redirect('/');
});

app.listen(3010);