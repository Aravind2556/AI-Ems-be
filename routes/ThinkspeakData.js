const Express = require('express')
const nodemailer = require("nodemailer");
const UserModel = require('../model/Register')
const DeviceModel = require('../model/Devicedata')

const DataRouter = Express.Router()

const ThinkSpeakAPI = process.env.ThinkSpeak_URL


const fields = [
    { key: "field1", name: "voltage"},
    { key: "field2", name: "current"},
    { key: "field3", name: "power"},
    { key: "field4", name: "energy"},
    { key: "field5", name: "frequency"},
    { key: "field6", name: "powerfactor"},
    { key: "field7", name: "tempeature"},
    // { key: "field8", name: "vibration"},
];

const sendEmail = async (userEmail, alerts, deviceId) => {
    // Send email logic (using nodemailer or any email service)

    // Create bullet points for each alert
    const bulletAlerts = alerts.map(alert => `- ${alert}`).join("\n");
    // Generate mailBody with a heading and the bullet alerts
    const mailBody = `Alert for ${deviceId}\n\n${bulletAlerts}`;
    
    // Example email sending logic using Nodemailer
    let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    });

    
   
    let mailOptions = {
    from: "aravindaravind2556@gmail.com",
    to: userEmail,
    subject: "Device Alerts",
    text: mailBody,
    };

    const mailStatus = await transporter.sendMail(mailOptions);

    console.log("mailStatus:", mailStatus)

    if(mailStatus){
        return "send"
    }

}

const fetchLiveData = async () => {
    if(ThinkSpeakAPI){
        fetch(ThinkSpeakAPI)
        .then(res=>res.json())
        .then(data=>{
            if(data.feeds && data.feeds.length>0){
                let lastFeedData = data.feeds.splice(-1)[0]

                delete lastFeedData.field8

                if(lastFeedData){
                    const RecentEntryID = Number(lastFeedData.entry_id)

                    UserModel.find({})
                    .then(Users=>{
                        if(Users && Users.length>0){
                            for(const User of Users){
                                DeviceModel.find({userId: User.userid})
                                .then(Devices=>{
                                    if(Devices && Devices.length>0){
                                        for(const Device of Devices){
                                            let dataAlerts = []
                                            if(User.Alert && User.Alert.length>0){

                                                const isDeviceAlert = User.Alert.some(deviceAlert => deviceAlert.DeviceId === Device.deviceId)

                                                if(isDeviceAlert===true){
                                                    const findDeviceAlert = User.Alert.find(deviceAlert=>deviceAlert.DeviceId === Device.deviceId)
                                                    if(findDeviceAlert){
                                                        const isAlertSend = findDeviceAlert.TrackedFeeds.some(id=>id===RecentEntryID)
                                                        if(isAlertSend===false){
                                                            fields.forEach(field=>{
                                                                if(lastFeedData[field.key]>Device[field.name].high){
                                                                    const alertMsg = `${field.name} is high: ${lastFeedData[field.key]}`
                                                                    dataAlerts.push(alertMsg)
                                                                }
                                                                else if(lastFeedData[field.key]<Device[field.name].low){
                                                                    const alertMsg = `${field.name} is low: ${lastFeedData[field.key]}`
                                                                    dataAlerts.push(alertMsg)
                                                                }
                                                            })
                                                        }
                                                    }
                                                }
                                                else{
                                                    fields.forEach(field=>{
                                                        if(lastFeedData[field.key]>Device[field.name].high){
                                                            const alertMsg = `${field.name} is high: ${lastFeedData[field.key]}`
                                                            dataAlerts.push(alertMsg)
                                                        }
                                                        else if(lastFeedData[field.key]<Device[field.name].low){
                                                            const alertMsg = `${field.name} is low: ${lastFeedData[field.key]}`
                                                            dataAlerts.push(alertMsg)
                                                        }
                                                    })
                                                }
                                            }
                                            else{
                                                fields.forEach(field=>{
                                                    if(lastFeedData[field.key]>Device[field.name].high){
                                                        const alertMsg = `${field.name} is high: ${lastFeedData[field.key]}`
                                                        dataAlerts.push(alertMsg)
                                                    }
                                                    else if(lastFeedData[field.key]<Device[field.name].low){
                                                        const alertMsg = `${field.name} is low: ${lastFeedData[field.key]}`
                                                        dataAlerts.push(alertMsg)
                                                    }
                                                })
                                            }
                                            
                                            if(dataAlerts && dataAlerts.length > 0){
                                                console.log("Mail sending in progress:",dataAlerts)
                                                const isMailSend = sendEmail(User.Email, dataAlerts, Device.deviceId)
                                                isMailSend.then(mailStatus=>{
                                                    console.log("isMailSend succeeded:",mailStatus)
                                                    if(mailStatus==='send'){
                                                        console.log("mail send detected...")
                                                        UserModel.findOne({userid: User.userid})
                                                        .then(fetchUser => {
                                                            console.log("user fetched")

                                                            if(fetchUser.Alert && fetchUser.Alert.length>0){
                                                                console.log("Contains Alert in user")
                                                                fetchUser.Alert.forEach((alerts, i)=>{

                                                                    if(alerts.DeviceId === Device.deviceId){
                                                                        const isEntryId = alerts.TrackedFeeds.some(id => id === RecentEntryID)
                                                                        if(isEntryId === false){
                                                                            let tempTrackedFeed = alerts.TrackedFeeds
                                                                            tempTrackedFeed.push(RecentEntryID)
                                                                            UserModel.updateOne({userid: User.userid, "Alert.DeviceId": Device.deviceId}, {$set: {
                                                                                "Alert.$.TrackedFeeds": tempTrackedFeed
                                                                            }})
                                                                            .then(data=>{
                                                                            console.log("updated succesfully:",data)
                                                                        })
                                                                        .catch(err=>{
                                                                            console.log("err in updating user:",err)
                                                                        })
                                                                        }
                                                                    }
                                                                    else{
                                                                        let tempAlerts = fetchUser.Alert
                                                                        tempAlerts.push({
                                                                            DeviceId: Device.deviceId,
                                                                            TrackedFeeds: [RecentEntryID]
                                                                        })
                                                                        UserModel.updateOne({userid: User.userid}, {$set: {
                                                                            Alert: tempAlerts
                                                                        }})
                                                                        .then(data=>{
                                                                            console.log("updated succesfully:",data)
                                                                        })
                                                                        .catch(err=>{
                                                                            console.log("err in updating user:",err)
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                            else{
                                                                let tempAlerts = []
                                                                tempAlerts.push({
                                                                    DeviceId: Device.deviceId,
                                                                    TrackedFeeds: [RecentEntryID]
                                                                })
                                                                console.log("No Alerts for User:",tempAlerts)

                                                                UserModel.updateOne({userid: User.userid}, {$push: {
                                                                    Alert: tempAlerts
                                                                }})
                                                                .then(data=>{
                                                                    console.log("updated succesfully:",data)
                                                                })
                                                                .catch(err=>{
                                                                    console.log("err in updating user:",err)
                                                                })
                                                            }
                                                        })
                                                    }
                                                    else{
                                                        console.log("mail triggered and not send!")
                                                    }
                                                })
                                            }
                                        }
                                    }
                                })
                            } 
                        }
                    })
                }
            }
        })
        .catch(err=>{
            console.log("Error in fetching data from Thinkspeak:",err)
        })
    }
}

setInterval(()=>{
    console.log("Started Fetching...")
    fetchLiveData()
},5000)

module.exports = DataRouter