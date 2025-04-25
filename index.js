require('dotenv').config()   //env config
const express = require('express')  //express backage
const mongoose = require('mongoose') //mongoose backge 
const routes = require('./routes/Register')
const Devicerouter = require('./routes/Devicedefault')
const cors = require('cors')
const session = require('express-session')
const DataRouter = require('./routes/ThinkspeakData')
const sessionConnect = require('connect-mongodb-session')(session)


const app = express() 

const corsOptions = {  // orgin setup to front end 
    origin: ['http://localhost:4001', 'https://3zn7kpnd-4001.inc1.devtunnels.ms', 'https://05v7w8hs-4001.inc1.devtunnels.ms', 'https://dkgsdb5n-4001.inc1.devtunnels.ms'], 
    credentials: true,  
};

// Use CORS middleware
app.use(cors(corsOptions));
app.set("trust proxy",1)
app.use(express.json())
app.use(express.urlencoded({extended: true}))


const Store = new sessionConnect({
    uri: process.env.DB_CONNECTION_STRING ,
    collection: 'session',
});

app.use(session({
    secret: process.env.SECUREKEY,
    resave: false,
    saveUninitialized: false,
    store: Store,
    // cookie:{
    //     secure: true,
    //     httpOnly: true,
    //     sameSite: 'none'
    // }
    
}));

mongoose.connect(process.env.DB_CONNECTION_STRING)  // mongoose connection and env db password links
.then(()=>console.log('Mongodb Connected successfully!'))
.catch((err)=>console.log('Error found on mongodb connection: ',err))


app.listen(3001,()=>{   //which port
    console.log("Server stared on localhost")
})

app.use('/api', routes)
app.use('/api',Devicerouter)
app.use('/api',DataRouter)
// app.use('/api',ticktrouter)


// app.get('/api', (req, res)=>{
//     return res.json("Hello")
// })