const express = require('express');
const router = express.Router();

router.post('/smart-reply', (req, res) => {
  const { message } = req.body;
  const replies = {
    hi: ['Hello!', 'Hey there!'],
    bye: ['Goodbye!', 'See you later!'],
    thanks: ['You’re welcome!', 'No problem!'],
  };
  const suggestion = replies[message.toLowerCase()] || ['Cool!', 'Nice!'];
  res.json(suggestion);
});

module.exports = router;