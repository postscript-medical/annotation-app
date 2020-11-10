const { CONTENT_INDIVIDUAL } = require('./content/individual_subscription');
const { CONTENT_DEPARTMENT } = require('./content/department_subscription');
const { CONTENT_ORGANIZATION } = require('./content/organization_subscription');

const PLAN_0 = 'inactive';

const PLAN_1 = 'individual';

const PLAN_2 = 'department';

const PLAN_3 = 'organization';

const SUBSCRIPTIONS = [
  {
    level: PLAN_0,
    maxUsers: 1,
    product: 'prod_I2TcP6mqPNGT8p',
  },
  {
    level: PLAN_1,
    maxUsers: 1,
    product: 'prod_I2TeDsdb73yBup',
  },
  {
    level: PLAN_2,
    maxUsers: 10,
    product: 'prod_ICBrFf5K12Npgy',
  },
  {
    level: PLAN_3,
    maxUsers: 100,
    product: 'prod_I2TeAQV4Qe41cc',
  },
];

const PROTECTED_CONTENT = {
  free: {},
  individual: CONTENT_INDIVIDUAL,
  department: CONTENT_DEPARTMENT,
  organization: CONTENT_ORGANIZATION,
}

exports.PLAN_0 = PLAN_0;
exports.SUBSCRIPTIONS = SUBSCRIPTIONS;
exports.PROTECTED_CONTENT = PROTECTED_CONTENT;