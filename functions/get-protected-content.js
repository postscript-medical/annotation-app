const { SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY } = process.env;

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY);

// exports.handler = async () => {
exports.handler = async (_, context) => {
  const { user } = context.clientContext;

  let error;

  const { data: user_raw, error: userError } = await supabase
    .from("user_raw")
    .select("data")
    // .contains("data", {
    //   data: { netlifyID: "a6a53bb8-763e-4207-8974-bcb3d9d9e919" },
    // })
    .contains("data", { data: { netlifyID: user.sub } })
    .single();

  const userData = {
    ...user_raw.data.data,
  };

  if (userError) error = userError;

  const { data: appStateRaw, error: appStateError } = await supabase
    .from("user_app_state_raw")
    .select("data")
    .contains("data", {
      ref: { ["@ref"]: { id: userData.appState["@ref"].id } },
    })
    .single();

  if (appStateError) error = appStateError;

  console.log("What have we got:", appStateRaw.data.data);

  const { selectedIllustrationTitle, selectedSpecialty, selectedSubSpecialty } =
    appStateRaw.data.data;

  const appState = {
    selectedIllustrationTitle,
    selectedSpecialty,
    selectedSubSpecialty,
    id: userData.appState["@ref"].id,
  };

  userData.appState = appState;
  console.log("-------------------");
  console.log("AppState:", userData);

  const { data: team, error: teamError } = await supabase
    .from("team_raw")
    .select("data")
    .contains("data", {
      ref: { ["@ref"]: { id: userData.team["@ref"].id } },
    })
    .single();

  if (teamError) error = teamError;

  userData.team = team.data.data;

  const { data: org, error: orgError } = await supabase
    .from("organization_raw")
    .select("data")
    .contains("data", {
      ref: { ["@ref"]: { id: userData.organization["@ref"].id } },
    })
    .single();

  if (orgError) error = orgError;

  userData.organization = org.data.data;

  const { data: illustrationsRaw, error: illustrationsError } = await supabase
    .from("illustration_raw")
    .select("data");

  if (illustrationsError) error = illustrationsError;

  const illustrations = illustrationsRaw.map(({ data }) => {
    const { name, src, alias, defaultIllustration } = data.data;
    return {
      name,
      src,
      alias,
      defaultIllustration,
      ref: data.ref["@ref"].id,
    };
  });

  const { data: subSpecialtiesRaw, error: subSpecialtiesError } = await supabase
    .from("sub_specialty_raw")
    .select("data");

  const subSpecialties = subSpecialtiesRaw.map(({ data }) => {
    return {
      name: data.data.name,
      illustrations: data.data.illustrations.map((entry) => {
        const illustration = illustrations.find(({ ref }) => {
          return ref === entry["@ref"].id;
        });

        return illustration;
      }),
      ref: data.ref["@ref"].id,
    };
  });

  if (subSpecialtiesError) error = subSpecialtiesError;

  const { data: specialties, error: specialtiesError } = await supabase
    .from("specialty_raw")
    .select("data");

  if (specialtiesError) error = specialtiesError;

  userData.specialties = specialties.map(({ data }) => {
    return {
      name: data.data.name,
      subSpecialties: data.data.subSpecialties.map((entry) => {
        const subSpecialty = subSpecialties.find(({ ref }) => {
          return ref === entry["@ref"].id;
        });

        return subSpecialty;
      }),
    };
  });

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ...userData }),
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
