// redux/selectors/messageSelectors.js
import { createSelector } from '@reduxjs/toolkit';

const messageState = state => state.message;

export const selectMessages = createSelector(
  [messageState],
  message => message.messages || []
);