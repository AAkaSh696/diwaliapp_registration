import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

// Extensionless imports: Vite picks "name.web.jsx" first if it exists,
// otherwise it falls back to "name.jsx" (see resolve.extensions in vite.config.js).
import Welcome from "./welcome.web.jsx";
import Home from "./home";
import Signup from "./signup";
import Registration from "./registration";
import Login from "./loginpage";
import Profile from "./profile";
import Event from "./events";
import AdminHome from "./adminhome";
import VerifyStudent from "./verifystudentpage";
import UpdateEvents from "./updateeventpage";
import AddEvent from "./addeventpage";
import QrScanner from "./qrscanner";
import VerifiedUsers from "./verifiedusers";
import UpdateStudent from "./updatestudentprofile";

// Use the JS stack on web (native-stack depends on react-native-screens)
const Stack = createStackNavigator();

export default function ReactNav() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="registration" component={Registration} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Events" component={Event} />
      <Stack.Screen name="adminhome" component={AdminHome} />
      <Stack.Screen name="verificationpage" component={VerifyStudent} />
      <Stack.Screen name="addevent" component={AddEvent} />
      <Stack.Screen name="updateevent" component={UpdateEvents} />
      <Stack.Screen name="qrscanner" component={QrScanner} />
      <Stack.Screen name="verifiedusers" component={VerifiedUsers} />
      <Stack.Screen name="updatestudent" component={UpdateStudent} />
    </Stack.Navigator>
  );
}
