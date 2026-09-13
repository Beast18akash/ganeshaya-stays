import transporter from "../config/nodemailer.js";

/**
 * Sends an email using Nodemailer.
 * @param {Object} options - The email options object.
 * @param {string} options.to - Recipient's email address.
 * @param {string} options.subject - Subject of the email.
 * @param {string} options.text - Plain text body.
 * @param {string} options.html - HTML body.
 * @returns {Promise<Object>} The info object from nodemailer.
 */
export const sendEmail = async (options) => {
    const mailOptions = {
        from: `Ganeshaya Stays <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully: ", info.messageId);
        return info;
    } catch (error) {
        console.error("Error occurred while sending email: ", error);
        throw new Error("Email could not be sent.");
    }
};

export default sendEmail;
