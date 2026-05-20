import { apiSlice } from "../../api/apiSlice";

export const companyServiceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyServices: builder.query({
      query: (companyId) => `company-services/company/${companyId}`,
      providesTags: ["CompanyService"],
    }),
    getAllServices: builder.query({
      query: () => "company-services/all",
      providesTags: ["CompanyService"],
    }),
    getFollowedServices: builder.query({
      query: () => "company-services/followed",
      providesTags: ["CompanyService"],
    }),
    createService: builder.mutation({
      query: (formData) => ({
        url: "company-services/create",
        method: "POST",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["CompanyService"],
    }),
    updateService: builder.mutation({
      query: ({ id, formData }) => ({
        url: `company-services/update/${id}`,
        method: "PUT",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["CompanyService"],
    }),
    deleteService: builder.mutation({
      query: (id) => ({
        url: `company-services/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CompanyService"],
    }),
  }),
});

export const {
  useGetCompanyServicesQuery,
  useGetAllServicesQuery,
  useGetFollowedServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = companyServiceApiSlice;