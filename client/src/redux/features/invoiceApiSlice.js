import { apiSlice } from "../app/api/apiSlice";

export const invoiceApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMyInvoices: builder.query({
            query: () => "/invoices/my",
            providesTags: ["Invoice"],
        }),
        getProviderInvoices: builder.query({
            query: () => "/invoices/provider",
            providesTags: ["Invoice"],
        }),
    }),
});

export const {
    useGetMyInvoicesQuery,
    useGetProviderInvoicesQuery,
} = invoiceApiSlice;
