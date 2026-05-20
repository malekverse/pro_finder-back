import { apiSlice } from "../../api/apiSlice";

export const orderApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (data) => ({
        url: "orders/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Order"],
    }),
    getMyOrders: builder.query({
      query: () => "orders/my",
      providesTags: ["Order"],
    }),
    getCompanyOrders: builder.query({
      query: () => "orders/company",
      providesTags: ["Order"],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ orderId, status, adminNotes }) => ({
        url: `orders/update/${orderId}`,
        method: "PUT",
        body: { status, adminNotes },
      }),
      invalidatesTags: ["Order"],
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetCompanyOrdersQuery,
  useUpdateOrderStatusMutation,
} = orderApiSlice;
