import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { auth } from "./middleware/auth";

const saltRounds=10;

const app = express();
dotenv.config();
const PORT = process.env.PORT;
const SECRET=process.env.SECRET;

const prisma = new PrismaClient();

app.use(express.json());

app.use(cors());

app.use(express.static("public"));

app.get("/ready", (req, res) => {
  res.json({
    message: "working!",
  });
});



//signup
app.post("/api/user/signup", async (req, res) => {
  try {
    const { name, email,password } = req.body;


    if (!name || !email || !password) {
      throw new Error("Request missing needed data!");
    }

    
    //check if user exists
    const userExists=await prisma.user.findUnique({
      where:{
        email:email
      }
    })
    console.log(userExists)

    //if user exists return error
    if(userExists){
      return res.status(400).json({error:"User with email "+email+" already exists"})
    }

    //if not,create it,and hash passsword
    const hashedPass=bcrypt.hashSync(password,saltRounds) //hashSync means already synchronous and doesn't need await
    console.log("hashed password: ",hashedPass)
     const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        //never store raw passwords,needs hashing
        password:hashedPass
      },  
    });
    newUser['password']='';//for not to send password to frontend

    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // Token expiration time (1 hour)
        data: JSON.stringify(newUser),
      },
      //@ts-ignore
      SECRET
    );
    res.json({ user: newUser, token: token });


  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error happened!" });
  }
});



//login
app.post("/api/user/signin", async (req, res) => {
  try {
    const { name, email,password } = req.body;

    if (!name || !email || !password) {
      throw new Error("Request missing needed data!");
    }

    //check if user exists
    const userExists=await prisma.user.findUnique({
      where:{
        email:email
      }
    })

    //if user does not exists return error
    if(!userExists){
      return res.status(400).json({error:"User with email "+email+" does not exists"})
    }

    //if not return the user
    const hash=userExists.password
    const authentication=bcrypt.compareSync(password,hash)
    console.log(userExists)
    console.log(authentication)
    

    if(!authentication){ 
      res.status(400).send("Wrong password")}
    
    userExists['password']='';

    //the response to a successful signin is a javascipt web token.which is a representation of the signed-in-user data to allow this user to make actions without the need to authenticate him each time
    const token=jwt.sign({
      exp:Math.floor(Date.now()/1000)+(60*60),
      data:JSON.stringify(userExists)
      //@ts-ignore
    },SECRET);

    console.log(token)
    res.json({token:token});

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error happened!" });
  }
});



//create contact
// Create a new contact for the signed-in user
app.post("/api/user/contact/create", auth, async (req, res) => {
  try {
    //@ts-ignore
    const userId = JSON.parse(req.decoded.data).id;

    const { name, mobile } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ error: "Request missing name or mobile!" });
    }

    // Create a new contact for the signed-in user
    const newContact = await prisma.contact.create({
      data: {
        name: name,
        mobile: mobile,
        ownerId: userId,
      },
    });

    res.json(newContact);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error happened!" });
  }
});




//get all contacts of a users
app.get("/api/user/contacts",auth,async(req, res) => {
  try{
    //@ts-ignore
  const userId=JSON.parse(req.decoded.data).id;

  const userContacts=await prisma.contact.findMany({
    where:{
      ownerId:userId,
    }
  })
  
  //@ts-ignore
  console.log("111",JSON.parse(req.decoded.data));
  
  res.json(userContacts)
  }catch(error){
    console.log(error);
    res.status(500).json({ error: "Error happened!" });
  }
  
});


// Delete a specific contact for the signed-in user
app.delete("/api/user/contact/:contactId", auth, async (req, res) => {
  try {
    //@ts-ignore
    const userId = JSON.parse(req.decoded.data).id;
    const contactId = parseInt(req.params.contactId);

    if (!contactId) {
      return res.status(400).json({ error: "Invalid contact ID!" });
    }

    // Check if the contact belongs to the signed-in user
    const existingContact = await prisma.contact.findUnique({
      where: {
        id: contactId,
      },
    });

    if (!existingContact || existingContact.ownerId !== userId) {
      return res.status(404).json({ error: "Contact not found!" });
    }

    // Delete the contact
    await prisma.contact.delete({
      where: {
        id: contactId,
      },
    });

    res.json({ message: "Contact deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error happened!" });
  }
});



app.listen(PORT, () => {
  console.log("started server");
});



// //get a specific user aka Find user and its contacts
// app.get("/api/user/:user_id", async (req, res) => {
//   try {
//     const user_id = parseInt(req.params.user_id);
//     if (!user_id) {
//       throw new Error("User ID param empty!");
//     }
//     const user = await prisma.user.findUnique({
//       where: {
//         id: user_id,
//       },
//       include: {
//         contacts: true,
//       },
//     });
//     res.json(user);
//   } catch (error) {
//     console.log(error);
//     res.json({ error: "Error happened!" });
//   }
// });







