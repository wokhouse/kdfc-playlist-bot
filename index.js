require('dotenv').config();
const kdfc = require('./src');

kdfc.bot();
setInterval(kdfc.bot, 10000);
