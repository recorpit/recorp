const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'authsmtp.securemail.pro',
  port: 465,
  secure: true,
  auth: {
    user: 'commerciale@recorp.it',
    pass: 'Recorp2026!',
  },
});

transporter.sendMail({
  from: '"OKL SRL" <commerciale@recorp.it>',
  to: 'commerciale@recorp.it',
  subject: 'Test SMTP',
  text: 'Funziona!',
}, (err, info) => {
  if (err) {
    console.error('ERRORE:', err);
  } else {
    console.log('OK:', info);
  }
});