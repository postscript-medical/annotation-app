const { SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY } = process.env;

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY);

exports.handler = async (_, context) => {
  const { user } = context.clientContext;

  console.log(">>>>> USER <<<<<<<<<<:", user);

  // let { data: user_raw, error } = await supabase
  //   .from('user_raw')
  //   .select(`netlify_id: data->data->netlifyID`)
  let error;

  const { data: user_raw, error: userError } = await supabase
    .from("user_raw")
    .select("data")
    .contains("data", {
      data: { netlifyID: "a6a53bb8-763e-4207-8974-bcb3d9d9e919" },
    })
    // .contains('data', { data: { netlifyID: user.sub } })
    .single();
  console.log("user:", user_raw.data);

  const userData = {
    ...user_raw.data.data,
  };

  if (userError) error = userError;

  console.log("appStateRef:", userData.appState["@ref"].id);

  const { data: appState, error: appStateError } = await supabase
    .from("user_app_state_raw")
    .select("data")
    .contains("data", {
      ref: { ["@ref"]: { id: userData.appState["@ref"].id } },
    })
    .single();

  console.log("appState:", appState.data);
  if (appStateError) error = appStateError;

  userData.appState = appState.data.data;

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Get protected content`, userData, error }),
  };
};

// const faunadb = require("faunadb");
// const {
//   Collection,
//   ContainsPath,
//   Documents,
//   Equals,
//   Get,
//   If,
//   Index,
//   IsNull,
//   Lambda,
//   Let,
//   Map,
//   Match,
//   Paginate,
//   Ref,
//   Select,
//   Var,
// } = faunadb.query;

// exports.handler = (_, context) => {
//   const { user } = context.clientContext;

//   try {
//     const client = new faunadb.Client({
//       secret: process.env.FAUNA_KEY,
//     });

//     return client
//       .query(
//         Let(
//           {
//             userDoc: Get(Match(Index("user_by_netlifyId"), user.sub)),
//             appState: Select(["data", "appState"], Var("userDoc")),
//             teamDoc: Select(["data", "team"], Var("userDoc")),
//             organizationDoc: Get(
//               Select(["data", "organization"], Get(Var("teamDoc")))
//             ),
//             specialtiesDoc: If(
//               Equals(
//                 Select(["data", "chosenSpecialty"], Var("organizationDoc")),
//                 "all"
//               ),
//               Map(
//                 Paginate(Documents(Collection("Specialty"))),
//                 Lambda("ref", Get(Var("ref")))
//               ),
//               If(
//                 Equals(
//                   Select(["data", "chosenSpecialty"], Var("organizationDoc")),
//                   ""
//                 ),
//                 null,
//                 {
//                   data: [
//                     Get(
//                       Ref(
//                         Collection("Specialty"),
//                         Select(
//                           ["data", "chosenSpecialty"],
//                           Var("organizationDoc")
//                         )
//                       )
//                     ),
//                   ],
//                 }
//               )
//             ),
//           },
//           {
//             appState: Let(
//               {
//                 appStateDoc: Get(Var("appState")),
//               },
//               {
//                 id: Select(["ref", "id"], Var("appStateDoc")),
//                 selectedIllustrationTitle: Select(
//                   ["data", "selectedIllustrationTitle"],
//                   Var("appStateDoc")
//                 ),
//                 selectedSpecialty: Select(
//                   ["data", "selectedSpecialty"],
//                   Var("appStateDoc")
//                 ),
//                 selectedSubSpecialty: Select(
//                   ["data", "selectedSubSpecialty"],
//                   Var("appStateDoc")
//                 ),
//               }
//             ),
//             id: Select(["ref", "id"], Var("userDoc")),
//             role: Select(["data", "role"], Var("userDoc")),
//             team: {
//               name: Select(["data", "name"], Get(Var("teamDoc"))),
//             },
//             organization: {
//               id: Select(["ref", "id"], Var("organizationDoc")),
//               email: Select(["data", "email"], Var("organizationDoc")),
//               chosenSpecialty: Select(
//                 ["data", "chosenSpecialty"],
//                 Var("organizationDoc")
//               ),
//               name: Select(["data", "name"], Var("organizationDoc")),
//               stripeID: If(
//                 ContainsPath(["data", "stripeID"], Var("organizationDoc")),
//                 Select(["data", "stripeID"], Var("organizationDoc")),
//                 ""
//               ),
//               subscriptionLevel: Select(
//                 ["data", "subscriptionLevel"],
//                 Var("organizationDoc")
//               ),
//             },
//             specialties: If(
//               IsNull(Var("specialtiesDoc")),
//               null,
//               Map(
//                 Select(["data"], Var("specialtiesDoc")),
//                 Lambda(
//                   "specialty",
//                   Let(
//                     {
//                       specialtyDoc: Select(["data"], Var("specialty")),
//                     },
//                     {
//                       name: Select(["name"], Var("specialtyDoc")),
//                       subSpecialties: Map(
//                         Select(["subSpecialties"], Var("specialtyDoc")),
//                         Lambda(
//                           "subSpecialtyRef",
//                           Let(
//                             {
//                               subSpecialtyDoc: Get(Var("subSpecialtyRef")),
//                             },
//                             {
//                               name: Select(
//                                 ["data", "name"],
//                                 Var("subSpecialtyDoc")
//                               ),
//                               illustrations: Map(
//                                 Select(
//                                   ["data", "illustrations"],
//                                   Var("subSpecialtyDoc")
//                                 ),
//                                 Lambda(
//                                   "illustrationRef",
//                                   Let(
//                                     {
//                                       illustrationDoc: Get(
//                                         Var("illustrationRef")
//                                       ),
//                                     },
//                                     {
//                                       name: Select(
//                                         ["data", "name"],
//                                         Var("illustrationDoc")
//                                       ),
//                                       alias: Select(
//                                         ["data", "alias"],
//                                         Var("illustrationDoc")
//                                       ),
//                                       src: Select(
//                                         ["data", "src"],
//                                         Var("illustrationDoc")
//                                       ),
//                                     }
//                                   )
//                                 )
//                               ),
//                             }
//                           )
//                         )
//                       ),
//                     }
//                   )
//                 )
//               )
//             ),
//           }
//         )
//       )
//       .then((response) => {
//         return {
//           statusCode: 200,
//           body: JSON.stringify(response),
//         };
//       })
//       .catch((error) => {
//         console.log("::: Get protected content ERROR :::", error);

//         return {
//           statusCode: 400,
//           body: JSON.stringify({ error: `Get protected content: ${error}` }),
//         };
//       });
//   } catch (error) {
//     console.log("::: Get Protected content TRY/CATCH ERROR :::", error);

//     return {
//       statusCode: 400,
//       body: JSON.stringify({ error: `Webhook: ${error}` }),
//     };
//   }
// };
