require('dotenv').config();
const kdfc = require('./src');

kdfc.bot();
setInterval(kdfc.bot, 60000);
