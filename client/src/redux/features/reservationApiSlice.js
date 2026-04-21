import { apiSlice } from "../app/api/apiSlice";

export const reservationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createReservation: builder.mutation({
      query: (data) => ({
        url: "reservations/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Reservation"],
    }),
    getMyReservations: builder.query({
      query: () => "reservations/my",
      providesTags: ["Reservation"],
    }),
    getCompanyReservations: builder.query({
      query: () => "reservations/company",
      providesTags: ["Reservation"],
    }),
    updateReservationStatus: builder.mutation({
      query: ({ reservationId, status, adminNotes }) => ({
        url: `reservations/update/${reservationId}`,
        method: "PUT",
        body: { status, adminNotes },
      }),
      invalidatesTags: ["Reservation"],
    }),
    createManualBlock: builder.mutation({
      query: (data) => ({
        url: "reservations/block",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Reservation"],
    }),
    deleteManualBlock: builder.mutation({
      query: (id) => ({
        url: `reservations/block/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reservation"],
    }),
  }),
});

export const {
  useCreateReservationMutation,
  useGetMyReservationsQuery,
  useGetCompanyReservationsQuery,
  useUpdateReservationStatusMutation,
  useCreateManualBlockMutation,
  useDeleteManualBlockMutation,
} = reservationApiSlice;
