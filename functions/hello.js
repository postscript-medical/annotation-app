const faunadb = require('faunadb');
const q = faunadb.query;
const client = new faunadb.Client({ secret: process.env.FAUNA_SERVER_KEY })

exports.handler = (event, context) => {
  client.query(
    q.Update(
      q.Ref(q.Collection('Organization'), '281812946876629505'),
      { data: { subscriptionLevel: 'active' } },
    )
  )
  .then(response => {
    console.log(response)
    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  })
  .catch(error => {
    return {
      statusCode: 400,
      body: JSON.stringify(error)
    };
  });
};