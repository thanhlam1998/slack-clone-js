import firebase from "firebase";
import React, { Component } from "react";
import AvatarEditor from "react-avatar-editor";
import { connect } from "react-redux";
import {
  Button,
  Dropdown,
  Grid,
  Header,
  Icon,
  Image,
  Input,
  Modal,
} from "semantic-ui-react";
import { setUser } from "../../actions";

class UserPanel extends Component {
  state = {
    user: this.props.currentUser,
    modal: false,
    previewImage: "",
    croppedImage: "",
    uploadedCroppedImage: "",
    blob: "",
    storageRef: firebase.storage().ref(),
    userRef: firebase.auth().currentUser,
    usersRef: firebase.database().ref("users"),
    metadata: {
      contentType: "image/jpeg",
    },
  };

  uploadCroppedImage = () => {
    const { storageRef, blob, metadata, userRef } = this.state;
    storageRef
      .child(`avatar/users/${userRef.uid}`)
      .put(blob, metadata)
      .then((snap) => {
        snap.ref.getDownloadURL().then((downloadUrl) => {
          this.setState({ uploadedCroppedImage: downloadUrl }, () => {
            this.changeAvatar();
          });
        });
      });
  };

  changeAvatar = () => {
    this.state.userRef
      .updateProfile({ photoURL: this.state.uploadedCroppedImage })
      .then(() => {
        console.log("PhotoURL updated");
        this.props.setUser(this.state.userRef);
        this.closeModal();
      })
      .catch((err) => {
        console.error(err);
      });

    this.state.usersRef
      .child(this.state.user.uid)
      .update({ avatar: this.state.uploadedCroppedImage })
      .then(() => {
        console.log("User avatar updated");
      })
      .catch((err) => console.error(err));
  };

  openModal = () => {
    this.setState({ modal: true });
  };

  closeModal = () => {
    this.setState({ modal: false });
  };

  handleChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    if (file) {
      reader.readAsDataURL(file);
      reader.addEventListener("load", () => {
        this.setState({ previewImage: reader.result });
      });
    }
  };

  handleCropImage = () => {
    if (this.avatarEditor) {
      this.avatarEditor.getImageScaledToCanvas().toBlob((blob) => {
        let imageUrl = URL.createObjectURL(blob);
        this.setState({
          croppedImage: imageUrl,
          blob,
        });
      });
    }
  };

  handleSignOut = () => {
    firebase
      .auth()
      .signOut()
      .then(() => console.log("Sign out!"));
  };

  dropdownOptions = [
    {
      key: "user",
      text: (
        <span>
          Signed in as <strong>{this.state.user.displayName}</strong>
        </span>
      ),
      disabled: true,
    },
    {
      key: "avatar",
      text: <span onClick={this.openModal}>Change avatar</span>,
    },
    {
      key: "signout",
      text: <span onClick={this.handleSignOut}>Sign Out</span>,
    },
  ];
  render() {
    const { user, modal, previewImage, croppedImage } = this.state;
    const { primaryColor, currentUser } = this.props;

    return (
      <Grid style={{ background: primaryColor }}>
        <Grid.Column>
          <Grid.Row style={{ padding: "1.2em", margin: 0 }}>
            {/* App Header */}
            <Header inverted floated="left" as="h2">
              <Icon name="code" />
              <Header.Content>DevChat</Header.Content>
            </Header>
            {/* User Dropdown */}
            <Header style={{ padding: "0.25rem" }} as="h4" inverted>
              <Dropdown
                trigger={
                  <span>
                    <Image src={currentUser.photoURL} spaced="right" avatar />
                    {currentUser.displayName}
                  </span>
                }
                options={this.dropdownOptions}
              />
            </Header>
          </Grid.Row>

          {/* Change User Avatar Modal */}
          <Modal basic open={modal} onClose={this.closeModal}>
            <Modal.Header>Change Avatar</Modal.Header>
            <Modal.Content>
              <Input
                onChange={this.handleChange}
                fluid
                type="file"
                label="New Avatar"
                name="previewImage"
              />
              <Grid centered stackable columns={2}>
                <Grid.Row centered>
                  <Grid.Column className="ul center aligned grid">
                    {previewImage && (
                      <AvatarEditor
                        ref={(node) => (this.avatarEditor = node)}
                        image={previewImage}
                        width={120}
                        height={120}
                        border={50}
                        scale={1.2}
                      />
                    )}
                  </Grid.Column>
                  <Grid.Column className="ul center aligned grid">
                    {croppedImage && (
                      <Image
                        style={{ margin: "3.5em auto" }}
                        width={100}
                        height={100}
                        src={croppedImage}
                      />
                    )}
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Modal.Content>
            <Modal.Actions>
              {croppedImage && (
                <Button
                  color="green"
                  inverted
                  onClick={this.uploadCroppedImage}>
                  <Icon name="save" /> Change Avatar
                </Button>
              )}
              <Button color="green" inverted onClick={this.handleCropImage}>
                <Icon name="image" /> Preview
              </Button>
              <Button color="red" inverted onClick={this.closeModal}>
                <Icon name="remove" /> Cancel
              </Button>
            </Modal.Actions>
          </Modal>
        </Grid.Column>
      </Grid>
    );
  }
}

export default connect(null, { setUser })(UserPanel);
