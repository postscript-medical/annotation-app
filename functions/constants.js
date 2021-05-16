const PLAN_0 = "inactive";

const PLAN_1 = "individual";

const PLAN_2 = "department";

const PLAN_3 = "organization";

const SUBSCRIPTIONS = [
  {
    level: PLAN_0,
    maxUsers: 1,
    product: "prod_I2TcP6mqPNGT8p",
  },
  {
    level: PLAN_1,
    maxUsers: 1,
    product: "prod_I2TeDsdb73yBup",
  },
  {
    level: PLAN_2,
    maxUsers: 10,
    product: "prod_ICBrFf5K12Npgy",
  },
  {
    level: PLAN_3,
    maxUsers: 100000,
    product: "prod_I2TeAQV4Qe41cc",
  },
];

exports.PLAN_0 = PLAN_0;
exports.SUBSCRIPTIONS = SUBSCRIPTIONS;
