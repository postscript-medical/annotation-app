const postmark = require("postmark");
const client = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

exports.handler = async (event) => {
  let body;

  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `::: ERROR - Invalid JSON - ::: ${error.message}`,
      }),
    };
  }

  const { image, to_email } = body;
  const annotation = new postmark.Models.Attachment(
    "image.jpg",
    image.replace("data:image/jpeg;base64,", ""),
    "image/jpg"
  );
  const logoUrl =
    "https://res.cloudinary.com/postscript-medical/image/upload/v1638520194/annotation-app/postscript-logo-raster.png";

  try {
    await client.sendEmail({
      MessageStream: "annotated-image",
      From: "accounts@postscriptmedical.com",
      To: to_email,
      Subject:
        "Your personalised illustration from PostScript Medical has arrived!",
      HtmlBody: `<p>New message to ${to_email},<p><p>You have received a personalised illustration from your healthcare provider.</p><img src="${logoUrl}" width="93" height="75" />`,
      Attachments: [annotation],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "All good" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to send annotation email" }),
    };
  }
};
