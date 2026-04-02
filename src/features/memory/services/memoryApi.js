import {baseApi} from 'services/baseApi';
import {POSTS, CATEGORIES, COMMENTS} from 'config/apiEndpoints';

export const memoryApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: build => ({
    getPosts: build.query({
      query: ({categoryId} = {}) => ({
        url: POSTS.list,
        method: 'GET',
        params: categoryId ? {categoryId} : undefined,
      }),
      providesTags: ['Memory'],
    }),
    getPostById: build.query({
      query: postId => ({
        url: POSTS.one(postId),
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      }),
      providesTags: (result, error, postId) => [{type: 'Memory', id: String(postId)}],
    }),
    deletePost: build.mutation({
      query: postId => ({
        url: POSTS.delete(postId),
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
      }),
      invalidatesTags: ['Memory', 'Comment'],
    }),
    deletePostImage: build.mutation({
      query: ({postId, imageUrl}) => ({
        url: POSTS.deleteImage(postId),
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        data: {imageUrl},
      }),
      invalidatesTags: ['Memory'],
    }),
    togglePostNotification: build.mutation({
      query: ({userId, isOn}) => ({
        url: POSTS.notificationPostGlobal,
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        params: {userId, isOn},
      }),
    }),
    getCategories: build.query({
      query: () => ({
        url: CATEGORIES.list,
        method: 'GET',
      }),
      providesTags: ['Category'],
    }),
    createCategory: build.mutation({
      query: ({title}) => ({
        url: CATEGORIES.create,
        method: 'POST',
        data: {title},
        headers: {'Content-Type': 'application/json'},
      }),
      invalidatesTags: ['Category'],
    }),
    getComments: build.query({
      query: postId => ({
        url: POSTS.comments(postId),
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      }),
      providesTags: (result, error, postId) => [{type: 'Comment', id: String(postId)}],
    }),
    createComment: build.mutation({
      query: ({postId, content, authorId, mentionUserIds}) => ({
        url: POSTS.comments(postId),
        method: 'POST',
        data: {
          content: String(content ?? '').trim(),
          ...(authorId != null ? {authorId} : {}),
          ...(mentionUserIds?.length ? {mentionUserIds} : {}),
        },
        headers: {'Content-Type': 'application/json'},
      }),
      invalidatesTags: (result, error, arg) => [{type: 'Comment', id: String(arg?.postId)}],
    }),
    deleteComment: build.mutation({
      query: commentId => ({
        url: COMMENTS.delete(String(commentId).trim()),
        method: 'DELETE',
      }),
      invalidatesTags: ['Comment'],
    }),
    toggleCommentNotification: build.mutation({
      query: ({userId, isOn}) => ({
        url: '/comments/notification/comment',
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        params: {userId, isOn},
      }),
    }),
  }),
});

export const {
  useGetPostsQuery,
  useLazyGetPostsQuery,
  useGetPostByIdQuery,
  useDeletePostMutation,
  useDeletePostImageMutation,
  useTogglePostNotificationMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useToggleCommentNotificationMutation,
} = memoryApi;
