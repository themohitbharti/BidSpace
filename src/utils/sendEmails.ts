import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, text: string) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.MAILING_ID,
            pass: process.env.MAILING_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.MAILING_ID,
        to,
        subject,
        text,
    };

    await transporter.sendMail(mailOptions);
};