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
      providesTags: result => {
        const listTag = {type: 'Memory', id: 'LIST'};
        if (!Array.isArray(result)) {
          return [listTag];
        }
        const perPost = result
          .map(p => p?.postId ?? p?.id)
          .filter(id => id != null)
          .map(id => ({type: 'Memory', id: String(id)}));
        return [listTag, ...perPost];
      },
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
      // 'Memory' 전체 무효화 시 삭제된 postId의 getPostById가 재요청되어 404 알림이 날 수 있음 → LIST만 + 댓글
      invalidatesTags: (result, error, postId) => [
        {type: 'Memory', id: 'LIST'},
        {type: 'Comment', id: String(postId)},
      ],
      async onQueryStarted(postId, {dispatch, queryFulfilled}) {
        try {
          await queryFulfilled;
          dispatch(memoryApi.util.removeQueryResult('getPostById', postId));
        } catch {
          // 삭제 실패 시 캐시 유지
        }
      },
    }),
    deletePostImage: build.mutation({
      query: ({postId, imageUrl}) => ({
        url: POSTS.deleteImage(postId),
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        data: {imageUrl},
      }),
      invalidatesTags: (result, error, arg) => {
        const pid = arg?.postId;
        return [
          {type: 'Memory', id: 'LIST'},
          ...(pid != null ? [{type: 'Memory', id: String(pid)}] : []),
        ];
      },
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
