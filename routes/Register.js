const express = require('express')
const Register = require('../model/Register');
const DeviceData = require('../model/Devicedata')
const session = require('express-session');



const router = express.Router();


// // API endpoint for creating a new user registration.
// router.post('/Create-Account', async (req, res) => {
//     try {
//         let user = await Register.find({})
//         let id;
//         if (user.length > 0) {
//             let last_product_array = user.slice(-1);
//             let last_product = last_product_array[0];
//             id = last_product.Id + 1;
//         } else {
//             id = 1
//         }
//         const { name, email, contact, password, confirmPassword } = req.body
//         console.log(name, email, contact, password, confirmPassword)

//         if (password !== confirmPassword) {
//             return res.json({ success: false, message: "email is not matched" })
//         }
//         if (name && email && contact && password) {
//             const oneuser = await Register.findOne({ Email: email })
//             if (oneuser) {
//                 return res.send({ success: false, message: "A user with this email already exists. Please use a different email to register." })
//             }
//             const newuser = new Register({ Id: id, Name: name, Email: email, Password: password, Contact: contact, Role: "User" })
//             req.session.profile = {
//                 Id: newuser.Id,
//                 Name: newuser.Name,
//                 Email: newuser.Email,
//                 Role: newuser.Role,
//             };
//             const saveuser = await newuser.save()
//             if (saveuser) {
//                 return res.send({ success: true, message: "User registered successfully.", data :  saveuser   })
//             }
//             else {
//                 return res.send({ success: false, message: "Registration failed. Please try again later." })
//             }
//         }
//         else {
//             return res.send({ success: false, message: "All fields are required. Please provide complete user information." })
//         }
//     }
//     catch (err) {
//         console.log("Error during user registration:", err)
//         return res.send({ success: false, message: "An error occurred during registration. Please contact the developer." })
//     }
// })



// router.post('/Login-User', async (req, res) => {
//     try {
//         const { email, password } = req.body
//         console.log("login value", email, password)

//         const isfindLogin = await Register.findOne({ Email: email })
//         if (isfindLogin) {
//             if (isfindLogin.Password === password) {

//                 const {Id, Name, Role, Contact, Email} = isfindLogin
//                 const currentUser = {Id, Name, Role, Contact, Email}
//                 req.session.profile = currentUser
//                 return res.json({ success: true, message: "Login succfully", user: req.session.profile })

//             }
//             else {
//                 return res.json({ success: false, message: "Invalid password" })
//             }
//         }
//         else {
//             return res.json({ success: false, message: "invalid user id" })
//         }
//     }
//     catch (err) {
//         console.log("Troule error in login", err)
//         return res.json({ success: false, message: "Trouble Error to login please contact " })
//     }
// })

router.post('/Create-Account', async (req, res) => {
    try {
                let user = await Register.find({})
        let id;
        if (user.length > 0) {
            let last_product_array = user.slice(-1);
            let last_product = last_product_array[0];
            id = last_product.Id + 1;
        } else {
            id = 1
        }

        let year = new Date().getFullYear(); // Get current year

// Find the latest registered user based on createdAt (descending order)
let lastUser = await Register.findOne(
    { userid: new RegExp(`^D-${year}-\\d+$`) }, // Only fetch current year’s IDs
    { userid: 1 }, 
    { sort: { createdAt: -1 } } // Get latest user first
);

let newNumber = 1; // Default value if no users exist

if (lastUser && lastUser.userid) {
    let lastNumber = parseInt(lastUser.userid.split("-")[2], 10); // Extract last number
    newNumber = lastNumber + 1; // Increment
}

// Generate uniqueId in the format: D-YYYY-001
let uniqueId = `D-${year}-${String(newNumber).padStart(3, '0')}`;



        const { name, email, contact, password, confirmPassword } = req.body;
        console.log(name, email, contact, password, confirmPassword);

        if (password !== confirmPassword) {
            return res.json({ success: false, message: "Passwords do not match." });
        }

        if (name && email && contact && password) {
            const existingUser = await Register.findOne({ Email: email });
            if (existingUser) {
                return res.send({ success: false, message: "A user with this email already exists. Please use a different email to register." });
            }

            const newUser = new Register({
                Id : id,
                userid : uniqueId, // Assign the generated ID
                Name: name,
                Email: email,
                Password: password,
                Contact: contact,
                Role: "User"
            });

            req.session.profile = {
                Id: newUser.Id,
                Name: newUser.Name,
                Email: newUser.Email,
                Role: newUser.Role,
            };

            const savedUser = await newUser.save();
            if (savedUser) {
                return res.send({ success: true, message: "User registered successfully.", data: savedUser });
            } else {
                return res.send({ success: false, message: "Registration failed. Please try again later." });
            }
        } else {
            return res.send({ success: false, message: "All fields are required. Please provide complete user information." });
        }
    } catch (err) {
        console.log("Error during user registration:", err);
        return res.send({ success: false, message: "An error occurred during registration. Please contact the developer." });
    }
});



router.post('/Login-User', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("User login request:", email, password);

        const user = await Register.findOne({ Email: email ,Role: 'User'});
        if (!user) {
            return res.json({ success: false, message: "Invalid user ID" });
        }

        if (user.Password !== password) {
            return res.json({ success: false, message: "Invalid password" });
        }

        const { Id, Name, Role, Contact, Email ,userid } = user;
        const currentUser = { Id, Name, Role, Contact, Email , userid };
        req.session.profile = currentUser;

        return res.json({ success: true, message: "Login successful", user: req.session.profile });
    } catch (err) {
        console.log("Error in login:", err);
        return res.json({ success: false, message: "Error logging in, please contact support" });
    }
});

router.post('/Admin-Login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Admin login request:", email, password);

        const admin = await Register.findOne({ Email: email, Role: 'Admin' });
        if (!admin) {
            return res.json({ success: false, message: "Invalid admin ID" });
        }

        if (admin.Password !== password) {
            return res.json({ success: false, message: "Invalid password" });
        }

        const { Id, Name, Role, Contact, Email } = admin;
        const currentAdmin = { Id, Name, Role, Contact, Email };
        console.log("current admin",currentAdmin)

        req.session.profile = currentAdmin;
        req.session.save((err) => {
            if (err) {
              // Handle session saving error
              return res.status(500).json({ success: false, message: "Failed to save session" });
            }
          
            // If session is successfully saved, respond
            return res.json({ success: true, message: "Admin login successful", user: req.session.profile });
          });
    } catch (err) {
        console.log("Error in admin login:", err);
        return res.json({ success: false, message: "Error logging in, please contact support" });
    }
});




router.get('/username', async (req, res) => {
    try {
        const isRegister = req.session.profile
        if (isRegister) {
            const isfindRegister = await Register.findOne({ Email: req.session.profile.Email })
            if (isRegister) {
                return res.json({ response: "ok", Name: isfindRegister.Name })
            }
            else {
                return res.json({ response: "notok", message: "please login", Name: "profile" })

            }
        }
        else {
            return res.json({ response: "notok", message: "please login", Name: "profile" })
        }
    }
    catch (err) {
        console.log("Trouble error to profileuser", err)
        return res.json({ response: "notok", message: "Troble error to usrename please contact to admin" })
    }
})



router.get('/checkauth', async (req, res) => {
    try {
        console.log("api call ",req.session.profile)
        const isValidSession = req.session.profile
        console.log("check username",isValidSession)
        if (isValidSession) {
            const fetchUser = await Register.findOne({ Email: req.session.profile.Email })
            if (fetchUser) {
                return res.json({ success: true, user: isValidSession })
            }
            else {
                return res.json({ success: false, message: "No User Available " })
            }
        }
        else {
            return res.json({ success: false, message: "User not logged in" })
        }
    }
    catch (err) {
        console.log("Error in checking Authentication: ", err)
        return res.json({ success: false, message: "Troble in checking Authentication, Please contact developer!" })
    }
})



router.get('/logout', async (req, res) => {

    try {

        if (req.session.profile) {
            req.session.destroy()
            return res.json({ success: true, message: "Logout successfully" })
        }
        else {
            return res.json({ success: false, message: "error" })
        }
    }
    catch (err) {
        console.log("Trouble in erro to logout", err)
        return res.json({ response: "notok", message: "Trouble error contact admin" })
    }
})

router.get('/fetch-user',async (req,res)=>{
    try{

        const isRegister = await Register.find({})
        if(isRegister){

            return res.json({success : true , user : isRegister})

        }
        else{
            return res.json({success : false , message : "usre data is required"})
        }
        

    }
    catch(err){
        console.log("Trouble in erro to logout", err)
        return res.json({ response: "notok", message: "Trouble error contact admin" })
    }
})





router.get('/fetch-users', async (req, res)=>{
    try{
        const users = await Register.find({});
        if(!users){
            return res.send({success: false, message: "Failed to fetch users!"})
        }
        if(users.length>0){

            const tempUsers = users.map(async (user)=>{
                const userDevices = await DeviceData.find({userId: user.userid}).select("deviceId")
                const consolidatedDevices = userDevices.map(device=>device.deviceId)
                let consolidatedUser
                if(userDevices && userDevices.length>0){
                    const tempuser = {...user.toObject(), devices: consolidatedDevices}
                    consolidatedUser = tempuser
                }
                else{
                    consolidatedUser = user
                }
                return consolidatedUser
            })

            Promise.all(tempUsers).then(allUsers=>{
                return res.send({success: true, message: "Users fetched succesfully!", users: allUsers})
            })
            .catch(err=>{
                console.log("Error in fetching all Users:",err)
                return res.send({success: false, message: "Failed to fetch users!"})
            })

        }
        else{
            return res.send({success: true, message: "Users fetched succesfully!", users: users})
        }

    }
    catch(err){
        console.error("Error fetching users data:", err);
        return res.json({ success: false, message: "Trouble in fetching users, contact admin" });
    }
})


module.exports = router