// deps/ensurePostLoaded.js
// import { store } from '../redux/store';
import store from '../redux/store';
import { fetchPostByIdThunk } from '../redux/thunk/memoryThunk';

export async function ensurePostLoaded(postId) {
  const state = store.getState();
  const cached = state?.memory?.postsById?.[postId];
  if (cached) return cached;

  const res = await store.dispatch(fetchPostByIdThunk(postId));
  // unwrap 안 쓰는 경우 payload에서 꺼냄
  const fetched = res && res.payload ? res.payload : null;
  return fetched || null;
}
