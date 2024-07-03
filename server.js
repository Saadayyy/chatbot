const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const { loadFinancialData, loadKeywords, getFinancialData, generateResponse } = require('./financialLogic.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Load financial data and keywords
Promise.all([loadFinancialData(), loadKeywords()]).then(() => {
  console.log('Financial data and keywords loaded');
}).catch(err => {
  console.error('Failed to load financial data and keywords:', err);
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Send a welcome message to the user
  socket.emit('message', 'Welcome to the Financial Co-pilot Chatbot!');

  let userInfo = {};
  let userContext = {};

  // Ask for the user's name
  socket.emit('message', 'What is your name?');

  // Handle incoming messages
  socket.on('message', (message) => {
    console.log('Message received:', message);
    // Process the message
    if (!userInfo.name) {
      userInfo.name = message.trim(); // Assume the first message is the name
      socket.emit('message', `Thank you, ${userInfo.name}! Now, please provide your ID.`);
    } else if (!userInfo.id) {
      userInfo.id = parseInt(message.trim()); // Assume the second message is the ID
      const financialData = getFinancialData();
      const userRecord = financialData.users.find(u => u.name.toLowerCase() === userInfo.name.toLowerCase() && u.id === userInfo.id);
      if (userRecord) {
        socket.emit('message', `Hello, ${userInfo.name}! How can I assist you today? Would you like to ask about:\n- Spendings\n- Savings\n- Overview stocks\n- Income\n- Other\n by typing exit you leave there current questions.`);
      } else {
        socket.emit('message', 'Sorry, the provided ID is incorrect for the name you provided.');
        userInfo = {}; // Reset userInfo
        socket.emit('message', 'Please provide your name again.');
      }
    } else {
      // Once name and ID are provided, handle the user's queries
      const response = generateResponse(message, userInfo, userContext);
      socket.emit('message', response);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    // Reset user info on disconnection
    userInfo = {};
    userContext = {};
  });
});

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
