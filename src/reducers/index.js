import { combineReducers } from "redux";
import * as actionsTypes from "../actions/types";
import { reformatAvatarUrl } from "../helper/file";

const initialUserState = {
  currentUser: null,
  isLoading: true,
};

const user_reducer = (state = initialUserState, action) => {
  switch (action.type) {
    case actionsTypes.SET_USER:
      const userInfo = action.payload.currentUser;
      const newUserInfo = {
        ...userInfo,
        photoURL: reformatAvatarUrl(userInfo.photoURL),
      };
      return {
        currentUser: newUserInfo,
        isLoading: false,
      };
    case actionsTypes.CLEAR_USER:
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
};

const initialChannelState = {
  currentChannel: null,
  isPrivateChannel: false,
  userPosts: null,
};

const channel_reducer = (state = initialChannelState, action) => {
  switch (action.type) {
    case actionsTypes.SET_CURRENT_CHANNEL:
      return {
        ...state,
        currentChannel: action.payload.currentChannel,
      };
    case actionsTypes.SET_PRIVATE_CHANNEL:
      return {
        ...state,
        isPrivateChannel: action.payload.isPrivateChannel,
      };
    case actionsTypes.SET_USER_POSTS:
      return {
        ...state,
        userPosts: action.payload.userPosts,
      };
    default:
      return state;
  }
};

const initialColorsState = {
  primaryColor: "#4c3c4c",
  secondaryColor: "#eee",
};

const colors_reducer = (state = initialColorsState, action) => {
  switch (action.type) {
    case actionsTypes.SET_COLORS:
      return {
        primaryColor: action.payload.primaryColor,
        secondaryColor: action.payload.secondaryColor,
      };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  user: user_reducer,
  channel: channel_reducer,
  colors: colors_reducer,
});

export default rootReducer;
