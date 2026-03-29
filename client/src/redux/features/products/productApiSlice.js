import { apiSlice } from "../../app/api/apiSlice";

export const productApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyProducts: builder.query({
      query: (companyId) => `products/company/${companyId}`,
      providesTags: ["Product"],
    }),
    getAllProducts: builder.query({
      query: () => "products/all",
      providesTags: ["Product"],
    }),
    createProduct: builder.mutation({
      query: (formData) => ({
        url: "products/create",
        method: "POST",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, formData }) => ({
        url: `products/update/${id}`,
        method: "PUT",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `products/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useGetCompanyProductsQuery,
  useGetAllProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApiSlice;
