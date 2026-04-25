import { apiSlice } from "../app/api/apiSlice";

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    initializePayment: builder.mutation({
      query: (data) => ({
        url: "/payments/initialize",
        method: "POST",
        body: { ...data },
      }),
      invalidatesTags: ["Payment"],
    }),
    verifyPayment: builder.query({
      query: (paymentId) => `/payments/verify/${paymentId}`,
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          if (data.status === 'success' || data.result?.status === 'SUCCESS') {
            // Invalider les tags pour forcer le rafraîchissement des listes
            dispatch(apiSlice.util.invalidateTags(["Order", "Reservation", "Quote", "Payment"]));
          }
        } catch (err) {}
      }
    }),
    getMyPayments: builder.query({
      query: () => "/payments/my-payments",
      providesTags: ["Payment"],
    }),
    getProviderPayments: builder.query({
      query: () => "/payments/provider-payments",
      providesTags: ["Payment"],
    }),
  }),
});

export const {
  useInitializePaymentMutation,
  useVerifyPaymentQuery,
  useGetMyPaymentsQuery,
  useGetProviderPaymentsQuery,
} = paymentApiSlice;
