import React, { useState } from "react";
// import { BASE_URL } from "@env";

import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Alert,
    Image
} from "react-native";

import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
const BASE_URL="http://13.53.235.116:5001";
export default function Registration({ navigation }) {
    const [Name, setName] = useState("");
    const [batch, setBatch] = useState("");
    const [Aadhar, setAadhar] = useState("");
    const [RollNO, setRollNO] = useState("");
    const [branch, setBranch] = useState("");
    const [MobileNo, setMobileNo] = useState("");

    const [studentPhoto, setStudentPhoto] = useState(null);
    const [aadharPhoto, setAadharPhoto] = useState(null);

    const [loading, setLoading] = useState(false);


    /* =====================================================
       SELECT STUDENT PHOTO
    ===================================================== */

    const selectStudentPhoto = () => {

        launchImageLibrary(
            {
                mediaType: "photo",
                quality: 0.8
            },
            response => {

                if (response.didCancel) {
                    return;
                }

                if (response.errorCode) {

                    Alert.alert(
                        "Error",
                        response.errorMessage ||
                        "Unable to select image."
                    );

                    return;
                }

                if (response.assets?.length > 0) {

                    setStudentPhoto(
                        response.assets[0]
                    );

                }

            }
        );

    };


    /* =====================================================
       SELECT AADHAAR PHOTO
    ===================================================== */

    const selectAadharPhoto = () => {

        launchImageLibrary(
            {
                mediaType: "photo",
                quality: 0.8
            },
            response => {

                if (response.didCancel) {
                    return;
                }

                if (response.errorCode) {

                    Alert.alert(
                        "Error",
                        response.errorMessage ||
                        "Unable to select image."
                    );

                    return;
                }

                if (response.assets?.length > 0) {

                    setAadharPhoto(
                        response.assets[0]
                    );

                }

            }
        );

    };


    /* =====================================================
       REGISTER STUDENT
    ===================================================== */

    const handleRegister = async () => {

        /* ================= VALIDATION ================= */

        if (
            !Name.trim() ||
            !batch ||
            !Aadhar.trim() ||
            !RollNO.trim() ||
            !branch ||
            !MobileNo.trim()
        ) {

            Alert.alert(
                "Required",
                "Please fill all required fields."
            );

            return;
        }


        if (MobileNo.length !== 10) {

            Alert.alert(
                "Invalid Mobile Number",
                "Please enter a valid 10 digit mobile number."
            );

            return;
        }


        if (Aadhar.length !== 12) {

            Alert.alert(
                "Invalid Aadhaar",
                "Please enter a valid 12 digit Aadhaar number."
            );

            return;
        }


        if (!studentPhoto) {

            Alert.alert(
                "Student Photo Required",
                "Please upload your photograph."
            );

            return;
        }


        if (!aadharPhoto) {

            Alert.alert(
                "Aadhaar Photo Required",
                "Please upload your Aadhaar card image."
            );

            return;
        }


        setLoading(true);


        try {

            /* =================================================
               GET TOKEN
               
               If your registration API requires the
               token generated during signup, it will be
               attached here.
            ================================================= */

            const token =
                await AsyncStorage.getItem("token");


            /* =================================================
               CREATE FORM DATA
            ================================================= */

            const formData = new FormData();


            formData.append(
                "Name",
                Name.trim()
            );

            formData.append(
                "batch",
                batch
            );

            formData.append(
                "Aadhar",
                Aadhar.trim()
            );

            formData.append(
                "RollNO",
                RollNO.trim()
            );

            formData.append(
                "branch",
                branch
            );

            formData.append(
                "MobileNo",
                MobileNo.trim()
            );


            /*
             * Only append token if it exists.
             *
             * This prevents sending:
             *
             * token = null
             */

            if (token) {

                formData.append(
                    "token",
                    token
                );

            }


            /* =================================================
               STUDENT PHOTO
            ================================================= */

            formData.append(
                "pic",
                {
                    uri: studentPhoto.uri,
                    type:
                        studentPhoto.type ||
                        "image/jpeg",
                    name:
                        studentPhoto.fileName ||
                        "student_photo.jpg"
                }
            );


            /* =================================================
               AADHAAR PHOTO
            ================================================= */

            formData.append(
                "picAadhar",
                {
                    uri: aadharPhoto.uri,
                    type:
                        aadharPhoto.type ||
                        "image/jpeg",
                    name:
                        aadharPhoto.fileName ||
                        "aadhar_photo.jpg"
                }
            );


            /* =================================================
               API REQUEST
            ================================================= */

            const response = await fetch(
                `${BASE_URL}/registration/`,
                {
                    method: "POST",

                    /*
                     * Do NOT manually set
                     *
                     * Content-Type:
                     * multipart/form-data
                     *
                     * React Native automatically
                     * creates the correct boundary.
                     */

                    body: formData
                }
            );


            /* =================================================
               PARSE RESPONSE
            ================================================= */

            const data =
                await response.json();


            console.log(
                "Registration response:",
                data
            );


            /* =================================================
               ERROR
            ================================================= */

            if (!response.ok) {

                Alert.alert(
                    "Registration Failed",
                    data?.msg ||
                    "Unable to register student."
                );

                return;
            }


            /* =================================================
               SUCCESS
               
               Registration is complete.
               
               Flow:
               
               Registration
                    ↓
               Login
                    ↓
               JWT
                    ↓
               Fetch user data
                    ↓
               Redux
                    ↓
               Home
            ================================================= */

            Alert.alert(
    "Registration Successful",
    "Your registration has been submitted successfully.",
    [
        {
            text: "Go to Home",
            onPress: () => {
                navigation.reset({
                    index: 0,
                    routes: [
                        {
                            name: "Home"
                        }
                    ]
                });
            }
        }
    ]
);

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            Alert.alert(
                "Connection Error",
                "Unable to connect to the server. Please try again."
            );

        } finally {

            setLoading(false);

        }

    };


    /* =====================================================
       UI
    ===================================================== */

    return (

        <SafeAreaView
            style={styles.safeArea}
        >

            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFF8F0"
            />


            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                    styles.container
                }
            >

                {/* =================================================
                   HEADER
                ================================================= */}

                <View style={styles.header}>

                    <View style={styles.logoCircle}>

                        <Text style={styles.logo}>
                            🪔
                        </Text>

                    </View>


                    <View>

                        <Text style={styles.brand}>
                            DiwaliGhaat
                        </Text>

                        <Text style={styles.subtitle}>
                            Student Registration
                        </Text>

                    </View>

                </View>


                {/* =================================================
                   HERO
                ================================================= */}

                <View style={styles.hero}>

                    <Text style={styles.heroEmoji}>
                        🎓
                    </Text>


                    <View
                        style={{
                            flex: 1
                        }}
                    >

                        <Text style={styles.heroTitle}>
                            Complete Your Profile
                        </Text>


                        <Text style={styles.heroText}>
                            Submit your details and documents for
                            administrator verification.
                        </Text>

                    </View>

                </View>


                {/* =================================================
                   PERSONAL INFORMATION
                ================================================= */}

                <View style={styles.card}>

                    <Text style={styles.sectionTitle}>
                        Personal Information
                    </Text>


                    {/* NAME */}

                    <Text style={styles.label}>
                        Full Name *
                    </Text>


                    <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#999"
                        value={Name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />


                    {/* MOBILE */}

                    <Text style={styles.label}>
                        Mobile Number *
                    </Text>


                    <TextInput
                        style={styles.input}
                        placeholder="Enter 10 digit mobile number"
                        placeholderTextColor="#999"
                        value={MobileNo}
                        onChangeText={text => {

                            setMobileNo(
                                text.replace(
                                    /[^0-9]/g,
                                    ""
                                )
                            );

                        }}
                        keyboardType="number-pad"
                        maxLength={10}
                    />


                    {/* AADHAAR */}

                    <Text style={styles.label}>
                        Aadhaar Number *
                    </Text>


                    <TextInput
                        style={styles.input}
                        placeholder="Enter 12 digit Aadhaar number"
                        placeholderTextColor="#999"
                        value={Aadhar}
                        onChangeText={text => {

                            setAadhar(
                                text.replace(
                                    /[^0-9]/g,
                                    ""
                                )
                            );

                        }}
                        keyboardType="number-pad"
                        maxLength={12}
                        secureTextEntry
                    />

                </View>


                {/* =================================================
                   ACADEMIC INFORMATION
                ================================================= */}

                <View style={styles.card}>

                    <Text style={styles.sectionTitle}>
                        Academic Information
                    </Text>


                    {/* ROLL NUMBER */}

                    <Text style={styles.label}>
                        Roll Number *
                    </Text>


                    <TextInput
                        style={styles.input}
                        placeholder="Enter Roll Number"
                        placeholderTextColor="#999"
                        value={RollNO}
                        onChangeText={setRollNO}
                        autoCapitalize="characters"
                    />


                    {/* BATCH */}

                    <Text style={styles.label}>
                        Batch *
                    </Text>


                    <View style={styles.options}>

                        {[
                            "2027",
                            "2028",
                            "2029",
                            "2030",
                            "outsider"
                        ].map(item => (

                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.option,

                                    batch === item &&
                                    styles.optionActive
                                ]}
                                onPress={() =>
                                    setBatch(item)
                                }
                            >

                                <Text
                                    style={[
                                        styles.optionText,

                                        batch === item &&
                                        styles.optionTextActive
                                    ]}
                                >
                                    {item}
                                </Text>

                            </TouchableOpacity>

                        ))}

                    </View>


                    {/* BRANCH */}

                    <Text style={styles.label}>
                        Branch *
                    </Text>


                    <View style={styles.options}>

                        {[
                            "cse",
                            "ece",
                            "biotech",
                            "mechanical",
                            "civil",
                            "eco",
                            "AI/ML"
                        ].map(item => (

                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.option,

                                    branch === item &&
                                    styles.optionActive
                                ]}
                                onPress={() =>
                                    setBranch(item)
                                }
                            >

                                <Text
                                    style={[
                                        styles.optionText,

                                        branch === item &&
                                        styles.optionTextActive
                                    ]}
                                >
                                    {item}
                                </Text>

                            </TouchableOpacity>

                        ))}

                    </View>

                </View>


                {/* =================================================
                   DOCUMENT UPLOAD
                ================================================= */}

                <View style={styles.card}>

                    <Text style={styles.sectionTitle}>
                        Upload Documents
                    </Text>


                    <Text style={styles.documentHint}>
                        Upload clear and readable photographs.
                    </Text>


                    {/* STUDENT PHOTO */}

                    <TouchableOpacity
                        style={styles.uploadBox}
                        onPress={selectStudentPhoto}
                        activeOpacity={0.8}
                    >

                        {studentPhoto ? (

                            <Image
                                source={{
                                    uri: studentPhoto.uri
                                }}
                                style={styles.preview}
                            />

                        ) : (

                            <>

                                <Text
                                    style={styles.uploadIcon}
                                >
                                    📷
                                </Text>


                                <Text
                                    style={styles.uploadTitle}
                                >
                                    Upload Student Photo
                                </Text>


                                <Text
                                    style={styles.uploadText}
                                >
                                    Tap to select your photograph
                                </Text>

                            </>

                        )}

                    </TouchableOpacity>


                    {/* AADHAAR PHOTO */}

                    <TouchableOpacity
                        style={[
                            styles.uploadBox,
                            {
                                marginTop: 14
                            }
                        ]}
                        onPress={selectAadharPhoto}
                        activeOpacity={0.8}
                    >

                        {aadharPhoto ? (

                            <Image
                                source={{
                                    uri: aadharPhoto.uri
                                }}
                                style={styles.preview}
                            />

                        ) : (

                            <>

                                <Text
                                    style={styles.uploadIcon}
                                >
                                    🪪
                                </Text>


                                <Text
                                    style={styles.uploadTitle}
                                >
                                    Upload Aadhaar Card
                                </Text>


                                <Text
                                    style={styles.uploadText}
                                >
                                    Tap to select Aadhaar image
                                </Text>

                            </>

                        )}

                    </TouchableOpacity>

                </View>


                {/* =================================================
                   INFORMATION BOX
                ================================================= */}

                <View style={styles.infoBox}>

                    <Text style={styles.infoIcon}>
                        🔐
                    </Text>


                    <Text style={styles.infoText}>
                        Your registration will remain unverified
                        until an administrator reviews and approves
                        your submitted information.
                    </Text>

                </View>


                {/* =================================================
                   SUBMIT BUTTON
                ================================================= */}

                <TouchableOpacity
                    style={[
                        styles.button,

                        loading &&
                        styles.buttonDisabled
                    ]}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.8}
                >

                    <Text style={styles.buttonText}>

                        {loading
                            ? "Submitting..."
                            : "Submit Registration"}

                    </Text>


                    {!loading && (

                        <Text style={styles.arrow}>
                            →
                        </Text>

                    )}

                </TouchableOpacity>


                {/* =================================================
                   FOOTER
                ================================================= */}

                <Text style={styles.footer}>
                    🪔 Celebrate. Connect. Belong.
                </Text>

            </ScrollView>

        </SafeAreaView>

    );

}


/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: "#FFF8F0"
    },


    container: {
        padding: 20,
        paddingBottom: 40
    },


    /* ================= HEADER ================= */

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20
    },


    logoCircle: {
        width: 55,
        height: 55,
        borderRadius: 28,
        backgroundColor: "#FFF0E0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },


    logo: {
        fontSize: 27
    },


    brand: {
        fontSize: 26,
        fontWeight: "800",
        color: "#B64216"
    },


    subtitle: {
        fontSize: 12,
        color: "#888",
        marginTop: 2
    },


    /* ================= HERO ================= */

    hero: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#B64216",
        borderRadius: 22,
        padding: 18,
        marginBottom: 18
    },


    heroEmoji: {
        fontSize: 35,
        marginRight: 14
    },


    heroTitle: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "800"
    },


    heroText: {
        color: "#FFE8D8",
        fontSize: 11,
        lineHeight: 17,
        marginTop: 4
    },


    /* ================= CARD ================= */

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        elevation: 3
    },


    sectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#292929",
        marginBottom: 3
    },


    documentHint: {
        color: "#999",
        fontSize: 11,
        marginBottom: 5
    },


    /* ================= INPUT ================= */

    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#444",
        marginTop: 15,
        marginBottom: 7
    },


    input: {
        height: 50,
        borderWidth: 1,
        borderColor: "#E6DCD2",
        borderRadius: 13,
        paddingHorizontal: 14,
        fontSize: 14,
        color: "#222",
        backgroundColor: "#FFFCF9"
    },


    /* ================= OPTIONS ================= */

    options: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },


    option: {
        minWidth: 72,
        height: 42,
        paddingHorizontal: 14,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: "#E5DAD0",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFCF9"
    },


    optionActive: {
        backgroundColor: "#FFF0E4",
        borderColor: "#B64216"
    },


    optionText: {
        color: "#777",
        fontSize: 12,
        fontWeight: "600"
    },


    optionTextActive: {
        color: "#B64216",
        fontWeight: "800"
    },


    /* ================= UPLOAD ================= */

    uploadBox: {
        height: 170,
        borderRadius: 17,
        borderWidth: 1.5,
        borderColor: "#E5D4C7",
        borderStyle: "dashed",
        backgroundColor: "#FFFBF7",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
    },


    uploadIcon: {
        fontSize: 32,
        marginBottom: 8
    },


    uploadTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#444"
    },


    uploadText: {
        fontSize: 11,
        color: "#999",
        marginTop: 4
    },


    preview: {
        width: "100%",
        height: "100%",
        resizeMode: "cover"
    },


    /* ================= INFO ================= */

    infoBox: {
        flexDirection: "row",
        backgroundColor: "#FFF6DF",
        borderRadius: 16,
        padding: 15,
        marginBottom: 17
    },


    infoIcon: {
        fontSize: 21,
        marginRight: 10
    },


    infoText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 17,
        color: "#78663D"
    },


    /* ================= BUTTON ================= */

    button: {
        height: 56,
        borderRadius: 15,
        backgroundColor: "#B64216",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        elevation: 5
    },


    buttonDisabled: {
        opacity: 0.6
    },


    buttonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800"
    },


    arrow: {
        color: "#FFFFFF",
        fontSize: 22,
        marginLeft: 10
    },


    /* ================= FOOTER ================= */

    footer: {
        textAlign: "center",
        color: "#999",
        fontSize: 12,
        marginTop: 22
    }

});