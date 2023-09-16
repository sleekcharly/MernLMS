// code for sending mail

require('dotenv').config();

//  import dependencies
import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

// email options interface
interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

// mail function for sending email
const sendMail = async (options: EmailOptions): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  //   options parameters
  const { email, subject, template, data } = options;

  // get the path to the email template file
  const templatePath = path.join(__dirname, '../mails', template);

  //   render the mail template using ejs
  const html: string = await ejs.renderFile(templatePath, data);
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};

export default sendMail;
