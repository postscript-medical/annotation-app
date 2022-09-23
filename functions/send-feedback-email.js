const postmark = require("postmark");

const client = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

exports.handler = async (event) => {
  let body;

  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.log("::: ERROR :::", event);

    return {
      statusCode: 400,
      body: `::: ERROR - Invalid JSON - ::: ${error.message}`,
    };
  }

  const { from_email, from_name, message } = body;
  /* TODO: Handle errors */
  const response = await client.sendEmail({
    MessageStream: "feedback-form",
    From: "accounts@postscriptmedical.com",
    To: "accounts@postscriptmedical.com",
    Subject: `[POSTSCRIPT] Feedback from: ${from_email}`,
    HtmlBody: `
      <p>Name: ${from_name}</p>
      <p>Contact: ${from_email}</p>
      <p>Message:</p>
      <p>${message}</p>
    `,
  });

  if (response.ErrorCode !== 0) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Postmark error - ${response.Message}` }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "All good" }),
  };
};
