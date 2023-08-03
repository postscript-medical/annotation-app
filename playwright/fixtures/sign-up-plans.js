export const individualSubscriptionPlan = {
  name: "Individual subscription",
  products: [
    {
      name: "Single specialty",
      price: {
        id: "test-price-id-specialty",
        currencies: [
          {
            amount: 25,
            locale: "gbp",
          },
          {
            amount: 52,
            locale: "nzd",
          },
        ],
      },
      features: ["All illustrations for a single specialty"],
    },
    {
      name: "Complete catalogue",
      price: {
        id: "test-price-id-complete",
        currencies: [
          {
            amount: 30,
            locale: "gbp",
          },
          {
            amount: 62.5,
            locale: "nzd",
          },
        ],
      },
      features: ["All illustrations from all specialties"],
    },
  ],
};
