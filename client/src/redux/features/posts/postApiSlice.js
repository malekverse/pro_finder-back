import { apiSlice } from "../../app/api/apiSlice";

export const postsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getAllPosts: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => `posts?page=${page}&limit=${limit}`,
      providesTags: ["Post"],
    }),

    getPublicFeed: builder.query({
      query: (params) => {
        const { page = 1, limit = 10, country, region, city, category, subCategory, service } = params || {};
        const searchParams = new URLSearchParams({ page, limit });
        if (country) searchParams.append('country', country);
        if (region) searchParams.append('region', region);
        if (city) searchParams.append('city', city);
        if (category) searchParams.append('category', category);
        if (subCategory) searchParams.append('subCategory', subCategory);
        if (service) searchParams.append('service', service);
        return `posts?${searchParams.toString()}`;
      },
      providesTags: ["Post"],
    }),

    // ── NOUVEAU : feed companies suivies ─────────────────────────────────
    getFollowedFeed: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => `followers/feed?page=${page}&limit=${limit}`,
      providesTags: ["Post"],
    }),

    getMyPosts: builder.query({
      query: () => "posts/my",
      providesTags: ["Post"],
    }),

    getPostsByCompany: builder.query({
      query: ({ companyId, page = 1, limit = 10 }) =>
        `posts/company/${companyId}?page=${page}&limit=${limit}`,
      providesTags: (result, error, { companyId }) => [
        { type: "Post", id: `company-${companyId}` },
        "Post",
      ],
    }),

    getPost: builder.query({
      query: (id) => `posts/${id}`,
      providesTags: (result, error, id) => [{ type: "Post", id }],
    }),

    createPost: builder.mutation({
      query: (formData) => ({ url: "posts", method: "POST", body: formData, formData: true }),
      invalidatesTags: ["Post"],
    }),

    updatePost: builder.mutation({
      query: ({ id, formData }) => ({ url: `posts/${id}`, method: "PUT", body: formData, formData: true }),
      invalidatesTags: ["Post"],
    }),

    deletePost: builder.mutation({
      query: (id) => ({ url: `posts/${id}`, method: "DELETE" }),
      invalidatesTags: ["Post"],
    }),

    toggleLike: builder.mutation({
      query: (id) => ({ url: `posts/${id}/like`, method: "POST" }),
      invalidatesTags: ["Post"],
    }),

    addComment: builder.mutation({
      query: ({ id, text }) => ({ url: `posts/${id}/comment`, method: "POST", body: { text } }),
      invalidatesTags: ["Post"],
    }),

    deleteComment: builder.mutation({
      query: ({ postId, commentId }) => ({ url: `posts/${postId}/comment/${commentId}`, method: "DELETE" }),
      invalidatesTags: ["Post"],
    }),
  }),
});

export const {
  useGetAllPostsQuery,
  useGetPublicFeedQuery,
  useGetFollowedFeedQuery,
  useGetMyPostsQuery,
  useGetPostsByCompanyQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useToggleLikeMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
} = postsApiSlice;