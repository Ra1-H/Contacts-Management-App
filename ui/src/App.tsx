import React from "react";
import "./App.css";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

type Contact = {
  id: number;
  mobile: String;
  name: String;
  ownerId: number;
  owner: String;
};

function App() {
  const [name, setName] = useState("");
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [newContactName, setNewContactName] = useState("");
  const [newContactMobile, setNewContactMobile] = useState("");

  // Function to make a POST request to create a new user
  const handleSignup = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/user/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Registered user:", responseData.user);

        // Store the token locally
        setToken(responseData.token);

        // Clear form fields
        setName("");
        setEmail("");
        setPassword("");
      } else {
        const errorData = await response.json();
        console.error("Error registering user:", errorData);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Function to make a POST request to sign in
  const handleSignin = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/user/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      console.log(response);

      if (response.ok) {
        const responseData = await response.json();
        setToken(responseData.token);
        console.log("we have the token as: ", token);
        setEmail("");
        setPassword("");
        setName("");
      } else {
        const errorData = await response.json();
        console.error("Error signing in:", errorData);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Function to make a POST request to create a new contact
  const handleCreateContact = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/user/contact/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newContactName,
            mobile: newContactMobile,
          }),
        }
      );

      if (response.ok) {
        const newContact = await response.json();
        setContacts((prevContacts) => [...prevContacts, newContact]);
        // Clear input fields after successful contact creation
        setNewContactName("");
        setNewContactMobile("");
      } else {
        const errorData = await response.json();
        console.error("Error creating contact:", errorData);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Function to make a DELETE request to delete a contact
  const handleDeleteContact = async (contactId: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/user/contact/${contactId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        console.log("Contact deleted successfully!");
        setContacts((prevContacts) =>
          prevContacts.filter((contact) => contact.id !== contactId)
        );
      } else {
        const errorData = await response.json();
        console.error("Error deleting contact:", errorData);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Fetch user contacts on component mount or when token changes
  useEffect(() => {
    // Function to make a GET request to fetch user contacts
    const fetchUserContacts = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/user/contacts",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const contactsData = await response.json();
          setContacts(contactsData);
        } else {
          const errorData = await response.json();
          console.error("Error fetching contacts:", errorData);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    if (token) {
      fetchUserContacts();
    }
  }, [token]);

  return (
    <>
      <div className="form_container">
        <form>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Name..."
            onChange={(e) => {
              setName(e.target.value);
              setUser(e.target.value);
            }}
            value={name}
          />

          <input
            type="text"
            name="email"
            id="email"
            placeholder="Email..."
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            value={email}
          />

          <input
            type="text"
            name="password"
            id="password"
            placeholder="Password..."
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            value={password}
          />

          <div className="register-button">
            <button type="button" onClick={handleSignup}>
              Signup
            </button>
            <button type="button" onClick={handleSignin}>
              Signin
            </button>
          </div>
        </form>
      </div>

      <div className="line"></div>

      <div className="contacts_container">
        <div
          style={{
            marginBottom: "5px",
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            fontWeight:"bold",
            color:"#8d6ab0"
          }}
        >
          {user && user + `'s Contacts`}
        </div>

        <div className="contacts-input">
          <input
            type="text"
            name="newContactName"
            id="newContactName"
            placeholder="Contact Name"
            onChange={(e) => setNewContactName(e.target.value)}
            value={newContactName}
          />

          <input
            type="text"
            name="newContactMobile"
            id="newContactMobile"
            placeholder="Contact Mobile"
            onChange={(e) => setNewContactMobile(e.target.value)}
            value={newContactMobile}
          />

          <button
            onClick={handleCreateContact}
          >
            +
          </button>
        </div>

        {contacts.map((contact) => (
          <div key={contact.id} className="contact-item">
            <div style={{ width: "90%" }}>
              <h2>{contact.name}</h2>
              <h2>{contact.mobile}</h2>
            </div>
            <button
              onClick={() => handleDeleteContact(contact.id)}
              
            >
              <FontAwesomeIcon style={{color:"#8d6ab0"}} icon={faTrash} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
