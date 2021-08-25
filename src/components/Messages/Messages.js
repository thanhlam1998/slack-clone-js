import firebase from "firebase";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Comment, Segment } from "semantic-ui-react";
import { setUserPosts } from "../../actions";
import Message from "./Message";
import MessageForm from "./MessageForm";
import MessagesHeader from "./MessagesHeader";
import Skeleton from "./Skeleton";
import Typing from "./Typing";

class Messages extends Component {
  state = {
    privateChannel: this.props.isPrivateChannel,
    messagesRef: firebase.database().ref("messages"),
    privateMessageRef: firebase.database().ref("privateMessages"),
    usersRef: firebase.database().ref("users"),
    typingRef: firebase.database().ref("typing"),
    channel: this.props.currentChannel,
    isChannelStarred: false,
    messages: [],
    messagesLoading: true,
    currentUser: this.props.currentUser,
    progressBar: false,
    numUniqueUsers: "",
    searchResults: [],
    searchTerm: "",
    searchLoading: false,
    typingUsers: [],
    connectedRef: firebase.database().ref(".info/connected"),
    listeners: [],
  };

  componentDidMount() {
    const { channel, currentUser, listeners } = this.state;
    if (channel && currentUser) {
      this.removeListeners(listeners);
      this.addListeners(channel.id);
      this.addUserStarsListener(channel.id, currentUser.uid);
    }
  }

  componentWillUnmount() {
    this.removeListeners(this.state.listeners);
    this.state.connectedRef.off();
  }

  removeListeners = (listeners) => {
    listeners.forEach((listener) => {
      listener.ref.child(listener.id).off(listener.event);
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.messagesEndRef) {
      this.scrollToBottom();
    }
  }

  addToListeners = (id, ref, event) => {
    const index = this.state.listeners.findIndex((listener) => {
      return (
        listener.id === id && listener.ref == ref && listener.event === event
      );
    });

    if (index === -1) {
      const newListener = { id, ref, event };
      this.setState({ listeners: [...this.state.listeners, newListener] });
    }
  };

  scrollToBottom = () => {
    this.messagesEndRef.scrollIntoView({ behavior: "smooth" });
  };

  addListeners = (channelId) => {
    this.addMessageListener(channelId);
    this.addTypingListener(channelId);
  };

  addTypingListener = (channelId) => {
    let typingUsers = [];

    this.state.typingRef
      .child(this.state.channel.id)
      .on("child_added", (snap) => {
        if (snap.key !== this.state.currentUser.uid) {
          typingUsers = typingUsers.concat({
            id: snap.key,
            name: snap.val(),
          });
          this.setState({ typingUsers });
        }
      });
    this.addToListeners(channelId, this.state.typingRef, "child_added");

    this.state.typingRef.child(channelId).on("child_removed", (snap) => {
      const index = typingUsers.findIndex((user) => user.id === snap.key);
      if (index !== -1) {
        typingUsers = typingUsers.filter((user) => user.id !== snap.key);
        this.setState({ typingUsers });
      }
    });
    this.addToListeners(channelId, this.state.typingRef, "child_removed");

    this.state.connectedRef.on("value", (snap) => {
      if (snap.val() === true) {
        this.state.typingRef
          .child(this.state.channel.id)
          .child(this.state.currentUser.uid)
          .onDisconnect()
          .remove((err) => {
            if (err !== null) {
              console.error(err);
            }
          });
      }
    });
  };

  addMessageListener = (channelId) => {
    let loadedMessages = [];
    const ref = this.getMessagesRef();
    ref.child(channelId).on("child_added", (snap) => {
      loadedMessages.push(snap.val());
      this.setState({
        messages: loadedMessages,
        messagesLoading: false,
      });
      this.countUniqueUsers(loadedMessages);
      this.countUserPosts(loadedMessages);
    });
    this.addToListeners(channelId, ref, "child_added");
  };

  addUserStarsListener = (channelId, userId) => {
    this.state.usersRef
      .child(userId)
      .child("starred")
      .once("value")
      .then((data) => {
        if (data.val() !== null) {
          const channelIds = Object.keys(data.val());
          const prevStarred = channelIds.includes(channelId);
          this.setState({ isChannelStarred: prevStarred });
        }
      });
  };

  getMessagesRef = () => {
    const { messagesRef, privateMessageRef, privateChannel } = this.state;
    return privateChannel ? privateMessageRef : messagesRef;
  };

  handleStar = () => {
    this.setState(
      (prevState) => ({
        isChannelStarred: !prevState.isChannelStarred,
      }),
      () => {
        this.starChannel();
      }
    );
  };

  starChannel = () => {
    if (this.state.isChannelStarred) {
      this.state.usersRef
        .child(`${this.state.currentUser.uid}/starred`)
        .update({
          [this.state.channel.id]: {
            name: this.state.channel.name,
            details: this.state.channel.details,
            createdBy: {
              name: this.state.channel.createdBy.name,
              avatar: this.state.channel.createdBy.avatar,
            },
          },
        });
    } else {
      this.state.usersRef
        .child(`${this.state.currentUser.uid}/starred`)
        .child(this.state.channel.id)
        .remove((err) => {
          if (err !== null) {
            console.log(err);
          }
        });
    }
  };

  handleSearchChange = (event) => {
    this.setState(
      {
        searchTerm: event.target.value,
        searchLoading: true,
      },
      () => {
        this.handleSearchMessages();
      }
    );
  };

  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages];
    const regex = new RegExp(this.state.searchTerm, "gi");
    const searchResults = channelMessages.reduce((acc, message) => {
      if (
        (message.content && message.content.match(regex)) ||
        message.user.name.match(regex)
      ) {
        acc.push(message);
      }
      return acc;
    }, []);
    this.setState({ searchResults });
    setTimeout(() => {
      this.setState({ searchLoading: false });
    }, 1000);
  };

  countUniqueUsers = (messages) => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name);
      }
      return acc;
    }, []);
    const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
    const numUniqueUsers = `${uniqueUsers.length} user${plural ? "s" : ""}`;
    this.setState({ numUniqueUsers });
  };

  countUserPosts = (messages) => {
    let userPosts = messages.reduce((acc, message) => {
      if (message.user.name in acc) {
        acc[message.user.name].count += 1;
      } else {
        acc[message.user.name] = {
          avatar: message.user.avatar,
          count: 1,
        };
      }
      return acc;
    }, {});
    this.props.setUserPosts(userPosts);
  };

  displayMessages = (messages) =>
    messages.length > 0 &&
    messages.map((message, index) => (
      <Message
        key={index.toString()}
        message={message}
        user={this.state.currentUser}
      />
    ));

  isProgressBarVisible = (percent) => {
    if (percent > 0) {
      this.setState({ progressBar: true });
    }
  };

  displayChannelName = (channel) =>
    channel ? `${this.state.privateChannel ? "@" : "#"}${channel.name}` : "";

  displayTypingUsers = (users) =>
    users.length > 0 &&
    users.map((user) => {
      return (
        <div
          key={user.id}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "0.2em",
          }}>
          <span className="user__typing">{user.name}</span> <Typing />
        </div>
      );
    });

  displayMessageSkeleton = (loading) =>
    loading ? (
      <React.Fragment>
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} />
        ))}
      </React.Fragment>
    ) : null;

  render() {
    const {
      messagesRef,
      channel,
      currentUser,
      messages,
      progressBar,
      numUniqueUsers,
      searchResults,
      searchTerm,
      searchLoading,
      privateChannel,
      isChannelStarred,
      typingUsers,
      messagesLoading,
    } = this.state;
    return (
      <React.Fragment>
        <MessagesHeader
          channelName={this.displayChannelName(channel)}
          numUniqueUsers={numUniqueUsers}
          handleSearchChange={this.handleSearchChange}
          searchLoading={searchLoading}
          isPrivateChannel={privateChannel}
          handleStar={this.handleStar}
          isChannelStarred={isChannelStarred}
        />

        <Segment>
          <Comment.Group
            className={progressBar ? "messages__progress" : "messages"}>
            {this.displayMessageSkeleton(messagesLoading)}
            {searchTerm
              ? this.displayMessages(searchResults)
              : this.displayMessages(messages)}
            <div style={{ display: "flex", alignItems: "center" }}>
              {this.displayTypingUsers(typingUsers)}
              <div ref={(node) => (this.messagesEndRef = node)}></div>
            </div>
          </Comment.Group>
        </Segment>

        <MessageForm
          channel={channel}
          messagesRef={messagesRef}
          currentUser={currentUser}
          isProgressBarVisible={this.isProgressBarVisible}
          isPrivateChannel={privateChannel}
          getMessagesRef={this.getMessagesRef}
        />
      </React.Fragment>
    );
  }
}

export default connect(null, { setUserPosts })(Messages);
