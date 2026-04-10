import { apiSlice } from "../../app/api/apiSlice";

export const contractApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyContracts: builder.query({
      query: () => "/contracts/company",
      providesTags: ["Contract"],
    }),
    getUserContracts: builder.query({
      query: () => "/contracts/user",
      providesTags: ["Contract"],
    }),
    createContract: builder.mutation({
      query: (contractData) => ({
        url: "/contracts/create",
        method: "POST",
        body: contractData,
      }),
      invalidatesTags: ["Contract"],
    }),
    updateContractStatus: builder.mutation({
      query: ({ id, status, signatureDate }) => ({
        url: `/contracts/${id}/status`,
        method: "PUT",
        body: { status, signatureDate },
      }),
      invalidatesTags: ["Contract"],
    }),
  }),
});

export const {
  useGetCompanyContractsQuery,
  useGetUserContractsQuery,
  useCreateContractMutation,
  useUpdateContractStatusMutation,
} = contractApiSlice;
