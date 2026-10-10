import React from "react";
import Home from "./home.jsx";
import Welcome from "./welcome.jsx";
import Signup from "./signup.jsx"
import Registration from "./registration.jsx";
import Login from "./loginpage.jsx"
import Profile from "./profile.jsx"
import Event from "./events.jsx"
import AdminHome from "./adminhome.jsx"
import VerifyStudent from "./verifystudentpage.jsx"
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UpdateEvents from "./updateeventpage.jsx"
import AddEvent from "./addeventpage.jsx"
import QrScanner from "./qrscanner.jsx"
import VerifiedUsers from "./verifiedusers.jsx";
import UpdateStudent from "./updatestudentprofile.jsx";
const Stack = createNativeStackNavigator();

export default function ReactNav() {
  return (
    <Stack.Navigator
    //   initialRouteName="registration"
      screenOptions={{
        headerShown: false,
      }}
    >
         <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Home" component={Home}/>
      <Stack.Screen name="registration" component={Registration} />
       <Stack.Screen name="Signup" component={Signup} /> 
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Events" component={Event} />
        <Stack.Screen name="adminhome" component={AdminHome} />
        <Stack.Screen name="verificationpage" component={VerifyStudent}/>
        
         <Stack.Screen name="addevent" component={AddEvent}/>
         <Stack.Screen name="updateevent" component={UpdateEvents}/>
         <Stack.Screen name="qrscanner" component={QrScanner}/>
         <Stack.Screen name="verifiedusers" component={VerifiedUsers}/>
         <Stack.Screen name="updatestudent" component={UpdateStudent}/>
    </Stack.Navigator>
  );
}
