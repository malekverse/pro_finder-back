import { apiSlice } from "../../api/apiSlice";

export const reportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createReport: builder.mutation({
      query: (reportData) => ({
        url: "reports/create",
        method: "POST",
        body: reportData,
      }),
      invalidatesTags: ["Report"],
    }),
    getAllReports: builder.query({
      query: () => "reports/all",
      providesTags: ["Report"],
    }),
    updateReportStatus: builder.mutation({
      query: ({ reportId, status, adminNotes }) => ({
        url: `reports/update/${reportId}`,
        method: "PUT",
        body: { status, adminNotes },
      }),
      invalidatesTags: ["Report"],
    }),
  }),
});

export const {
  useCreateReportMutation,
  useGetAllReportsQuery,
  useUpdateReportStatusMutation,
} = reportApiSlice;
