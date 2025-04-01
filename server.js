// requirements and usage
require('dotenv').config()
var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongoose = require('mongoose')

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));
mongoose.Promise = Promise

// Variables and Constants
var censoredWords = process.env.CENSORED_WORDS.split(',');
const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@learning-node.36yqgef.mongodb.net/?retryWrites=true&w=majority&appName=learning-node`;

var Message = mongoose.model('Message', {
    name: String,
    message: String
})

// Message functions
app.get('/messages', async (req, res) => {
    try {
        const messages = await Message.find({});
        res.send(messages);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});


app.post('/messages', async (req, res) => {
    try {
        const { name, message } = req.body;

        const containsCensored = censoredWords.some(word =>
            message.toLowerCase().includes(word)
        );

        if (containsCensored) {
            console.log(`Message from ${name} blocked due to censorship.`);
            return res.status(403).send('Message contains inappropriate content');
        }

        const msg = new Message({ name, message });
        await msg.save();
        io.emit('message', req.body);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

io.on('connection', (socket) =>{
    console.log('user connected')
})


// DB connection
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));


    // Server connection
var server = http.listen(3000, () => {
    console.log('server is listening on port', server.address().port)
})