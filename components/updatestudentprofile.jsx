import React, {
    useEffect,
    useState
} from "react";

import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    SafeAreaView,
    StatusBar
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    launchImageLibrary
} from "react-native-image-picker";



const BASE_URL = "http://10.162.135.224:5001";


export default function UpdateStudent({
    navigation
}) {

    const [loading, setLoading] =
        useState(true);

    const [updating, setUpdating] =
        useState(false);


    const [profileImage, setProfileImage] =
        useState(null);

    const [aadharImage, setAadharImage] =
        useState(null);


    const [currentProfileImage,
        setCurrentProfileImage] =
        useState(null);

    const [currentAadharImage,
        setCurrentAadharImage] =
        useState(null);


    const [form, setForm] = useState({

        Name: "",
        batch: "",
        Aadhar: "",
        RollNO: "",
        branch: "",
        MobileNo: ""

    });


    const [originalData,
        setOriginalData] =
        useState(null);


    /* =====================================================
       SAFE SERVER RESPONSE
    ===================================================== */

    const getResponseData = async response => {

        const text =
            await response.text();


        console.log(
            "SERVER STATUS:",
            response.status
        );


        console.log(
            "SERVER RESPONSE:",
            text
        );


        if (!text.trim()) {

            return {};

        }


        try {

            return JSON.parse(text);

        } catch (error) {

            console.log(
                "INVALID SERVER RESPONSE:",
                text
            );


            if (response.ok) {

                return {
                    raw: text
                };

            }


            throw new Error(
                `Server returned invalid JSON. Status: ${response.status}`
            );

        }

    };


    /* =====================================================
       FETCH USER
    ===================================================== */

    useEffect(() => {

        fetchUserData();

    }, []);


    const fetchUserData = async () => {

        try {

            const token =
                await AsyncStorage.getItem(
                    "token"
                );


            if (!token) {

                Alert.alert(
                    "Session Expired",
                    "Please login again."
                );

                navigation.reset({
                    index: 0,
                    routes: [
                        {
                            name: "Login"
                        }
                    ]
                });

                return;

            }


            const response =
                await fetch(
                    `${BASE_URL}/registration/getuserdata`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body: JSON.stringify({
                            token
                        })
                    }
                );


            const result =
                await getResponseData(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    result?.msg ||
                    result?.message ||
                    `Unable to fetch user data. Status ${response.status}`
                );

            }


            const user =
                result?.data;


            if (!user) {

                throw new Error(
                    "User data was not returned by the server."
                );

            }


            const userForm = {

                Name:
                    user.Name || "",

                batch:
                    user.batch || "",

                Aadhar:
                    user.Aadhar || "",

                RollNO:
                    user.RollNO || "",

                branch:
                    user.branch || "",

                MobileNo:
                    user.MobileNo || ""

            };


            setForm(userForm);

            setOriginalData(userForm);


            setCurrentProfileImage(
                user.url || null
            );


            setCurrentAadharImage(
                user.urlAadhar || null
            );


        } catch (error) {

            console.error(
                "FETCH USER ERROR:",
                error
            );


            Alert.alert(
                "Unable to Load",
                error?.message ||
                "Unable to load your details."
            );

        } finally {

            setLoading(false);

        }

    };


    /* =====================================================
       UPDATE FIELD
    ===================================================== */

    const updateField = (
        field,
        value
    ) => {

        setForm(prev => ({
            ...prev,
            [field]: value
        }));

    };


    /* =====================================================
       SELECT PROFILE IMAGE
    ===================================================== */

    const selectProfileImage =
        async () => {

            try {

                const result =
                    await launchImageLibrary({
                        mediaType: "photo",
                        selectionLimit: 1,
                        quality: 0.8
                    });


                if (
                    result.didCancel ||
                    !result.assets?.length
                ) {

                    return;

                }


                setProfileImage(
                    result.assets[0]
                );


            } catch (error) {

                console.error(
                    "PROFILE IMAGE ERROR:",
                    error
                );


                Alert.alert(
                    "Error",
                    "Unable to select profile picture."
                );

            }

        };


    /* =====================================================
       SELECT AADHAAR IMAGE
    ===================================================== */

    const selectAadharImage =
        async () => {

            try {

                const result =
                    await launchImageLibrary({
                        mediaType: "photo",
                        selectionLimit: 1,
                        quality: 0.8
                    });


                if (
                    result.didCancel ||
                    !result.assets?.length
                ) {

                    return;

                }


                setAadharImage(
                    result.assets[0]
                );


            } catch (error) {

                console.error(
                    "AADHAAR IMAGE ERROR:",
                    error
                );


                Alert.alert(
                    "Error",
                    "Unable to select Aadhaar picture."
                );

            }

        };


    /* =====================================================
       CHECK TEXT CHANGES
    ===================================================== */

    const hasTextChanges = () => {

        if (!originalData) {

            return false;

        }


        return (

            form.Name !==
                originalData.Name ||

            form.batch !==
                originalData.batch ||

            form.Aadhar !==
                originalData.Aadhar ||

            form.RollNO !==
                originalData.RollNO ||

            form.branch !==
                originalData.branch ||

            form.MobileNo !==
                originalData.MobileNo

        );

    };


    /* =====================================================
       CHECK ANY CHANGES
    ===================================================== */

    const hasAnyChanges = () => {

        return (

            hasTextChanges() ||

            profileImage !== null ||

            aadharImage !== null

        );

    };


    /* =====================================================
       VALIDATION
    ===================================================== */

    const validateForm = () => {

        if (!form.Name.trim()) {

            Alert.alert(
                "Required",
                "Please enter your name."
            );

            return false;

        }


        if (!form.batch.trim()) {

            Alert.alert(
                "Required",
                "Please select your batch."
            );

            return false;

        }


        if (!form.Aadhar.trim()) {

            Alert.alert(
                "Required",
                "Please enter your Aadhaar number."
            );

            return false;

        }


        if (
            !/^\d{12}$/.test(
                form.Aadhar.trim()
            )
        ) {

            Alert.alert(
                "Invalid Aadhaar",
                "Aadhaar number must contain exactly 12 digits."
            );

            return false;

        }


        const isOutsider =
            form.batch.trim().toLowerCase() ===
            "outsider";


        if (
            !isOutsider &&
            !form.RollNO.trim()
        ) {

            Alert.alert(
                "Required",
                "Please enter your roll number."
            );

            return false;

        }


        if (
            !isOutsider &&
            !form.branch.trim()
        ) {

            Alert.alert(
                "Required",
                "Please select your branch."
            );

            return false;

        }


        if (!form.MobileNo.trim()) {

            Alert.alert(
                "Required",
                "Please enter your mobile number."
            );

            return false;

        }


        if (
            !/^\d{10}$/.test(
                form.MobileNo.trim()
            )
        ) {

            Alert.alert(
                "Invalid Mobile Number",
                "Mobile number must contain exactly 10 digits."
            );

            return false;

        }


        return true;

    };


    /* =====================================================
       UPDATE TEXT DATA
    ===================================================== */

    const updateTextData =
        async token => {

            if (!hasTextChanges()) {

                return;

            }


            const body = {

                token,

                Name:
                    form.Name.trim(),

                batch:
                    form.batch.trim(),

                Aadhar:
                    form.Aadhar.trim(),

                MobileNo:
                    form.MobileNo.trim()

            };


            const isOutsider =
                form.batch.trim().toLowerCase() ===
                "outsider";


            if (!isOutsider) {

                body.RollNO =
                    form.RollNO.trim();

                body.branch =
                    form.branch.trim();

            }


            console.log(
                "UPDATE BODY:",
                body
            );


            const response =
                await fetch(
                    `${BASE_URL}/registration/update`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify(body)
                    }
                );


            const result =
                await getResponseData(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    result?.msg ||
                    result?.message ||
                    "Unable to update details."
                );

            }

        };


    /* =====================================================
       UPDATE PROFILE IMAGE
       
       BACKEND ROUTE:
       /registration/imageupdate
    ===================================================== */

    const updateProfileImage =
        async token => {

            if (!profileImage) {

                return;

            }


            const formData =
                new FormData();


            formData.append(
                "token",
                token
            );


            formData.append(
                "pic",
                {
                    uri:
                        profileImage.uri,

                    type:
                        profileImage.type ||
                        "image/jpeg",

                    name:
                        profileImage.fileName ||
                        "profile.jpg"
                }
            );


            const response =
                await fetch(
                    `${BASE_URL}/registration/imageupdate`,
                    {
                        method: "POST",

                        body:
                            formData
                    }
                );


            const result =
                await getResponseData(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    result?.msg ||
                    result?.message ||
                    "Unable to update profile picture."
                );

            }

        };


    /* =====================================================
       UPDATE AADHAAR IMAGE
       
       BACKEND ROUTE:
       /registration/Aadharimageupdate
    ===================================================== */

    const updateAadharImage =
        async token => {

            if (!aadharImage) {

                return;

            }


            const formData =
                new FormData();


            formData.append(
                "token",
                token
            );


            formData.append(
                "picAadhar",
                {
                    uri:
                        aadharImage.uri,

                    type:
                        aadharImage.type ||
                        "image/jpeg",

                    name:
                        aadharImage.fileName ||
                        "aadhar.jpg"
                }
            );


            const response =
                await fetch(
                    `${BASE_URL}/registration/Aadharimageupdate`,
                    {
                        method: "POST",

                        body:
                            formData
                    }
                );


            const result =
                await getResponseData(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    result?.msg ||
                    result?.message ||
                    "Unable to update Aadhaar picture."
                );

            }

        };


    /* =====================================================
       MAIN UPDATE
    ===================================================== */

    const updateData =
        async () => {

            if (!hasAnyChanges()) {

                Alert.alert(
                    "No Changes",
                    "You have not changed any information."
                );

                return;

            }


            if (
                hasTextChanges() &&
                !validateForm()
            ) {

                return;

            }


            try {

                setUpdating(true);


                const token =
                    await AsyncStorage.getItem(
                        "token"
                    );


                if (!token) {

                    Alert.alert(
                        "Session Expired",
                        "Please login again."
                    );

                    return;

                }


                await updateTextData(
                    token
                );


                await updateProfileImage(
                    token
                );


                await updateAadharImage(
                    token
                );


                Alert.alert(
                    "Updated Successfully",
                    "Your details have been updated. Your profile is now unverified and must be verified again by the admin.",
                    [
                        {
                            text: "OK",

                            onPress: () => {

                                navigation.goBack();

                            }
                        }
                    ]
                );


            } catch (error) {

                console.error(
                    "UPDATE ERROR:",
                    error
                );


                Alert.alert(
                    "Update Failed",
                    error?.message ||
                    "Unable to update your details."
                );


            } finally {

                setUpdating(false);

            }

        };


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (

            <SafeAreaView
                style={
                    styles.safeArea
                }
            >

                <StatusBar
                    barStyle="dark-content"
                    backgroundColor="#FFF8F0"
                />

                <View
                    style={
                        styles.loadingContainer
                    }
                >

                    <ActivityIndicator
                        size="large"
                        color="#B64216"
                    />

                    <Text
                        style={
                            styles.loadingText
                        }
                    >
                        Loading your details...
                    </Text>

                </View>

            </SafeAreaView>

        );

    }


    /* =====================================================
       UI
    ===================================================== */

    return (

        <SafeAreaView
            style={
                styles.safeArea
            }
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
                keyboardShouldPersistTaps="handled"
            >

                {/* =================================================
                   HEADER
                ================================================= */}

                <View
                    style={
                        styles.header
                    }
                >

                    <View
                        style={
                            styles.logoCircle
                        }
                    >

                        <Text
                            style={
                                styles.logo
                            }
                        >
                            🪔
                        </Text>

                    </View>


                    <View>

                        <Text
                            style={
                                styles.brand
                            }
                        >
                            DiwaliGhaat
                        </Text>


                        <Text
                            style={
                                styles.subtitle
                            }
                        >
                            Update Student Profile
                        </Text>

                    </View>

                </View>


                {/* =================================================
                   HERO
                ================================================= */}

                <View
                    style={
                        styles.hero
                    }
                >

                    <Text
                        style={
                            styles.heroEmoji
                        }
                    >
                        ✏️
                    </Text>


                    <View
                        style={{
                            flex: 1
                        }}
                    >

                        <Text
                            style={
                                styles.heroTitle
                            }
                        >
                            Update Your Profile
                        </Text>


                        <Text
                            style={
                                styles.heroText
                            }
                        >
                            Make sure all your information
                            and documents are correct.
                        </Text>

                    </View>

                </View>


                {/* =================================================
                   WARNING
                ================================================= */}

                <View
                    style={
                        styles.warningBox
                    }
                >

                    <Text
                        style={
                            styles.warningIcon
                        }
                    >
                        ⚠️
                    </Text>


                    <Text
                        style={
                            styles.warningText
                        }
                    >
                        Any change to your information or
                        documents will remove your current
                        verification. Your profile will need
                        to be verified again by the admin.
                    </Text>

                </View>


                {/* =================================================
                   PROFILE PICTURE
                ================================================= */}

                <View
                    style={
                        styles.card
                    }
                >

                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Profile Picture
                    </Text>


                    <Text
                        style={
                            styles.documentHint
                        }
                    >
                        Use a clear photograph of yourself.
                    </Text>


                    <TouchableOpacity
                        style={
                            styles.profileUploadBox
                        }
                        onPress={
                            selectProfileImage
                        }
                        activeOpacity={0.8}
                    >

                        {(
                            profileImage?.uri ||
                            currentProfileImage
                        ) ? (

                            <Image
                                source={{
                                    uri:
                                        profileImage?.uri ||
                                        currentProfileImage
                                }}
                                style={
                                    styles.profilePreview
                                }
                            />

                        ) : (

                            <>

                                <Text
                                    style={
                                        styles.uploadIcon
                                    }
                                >
                                    📷
                                </Text>


                                <Text
                                    style={
                                        styles.uploadTitle
                                    }
                                >
                                    Select Profile Picture
                                </Text>


                                <Text
                                    style={
                                        styles.uploadText
                                    }
                                >
                                    Tap to choose a new photograph
                                </Text>

                            </>

                        )}

                    </TouchableOpacity>


                    <TouchableOpacity
                        style={
                            styles.changeButton
                        }
                        onPress={
                            selectProfileImage
                        }
                    >

                        <Text
                            style={
                                styles.changeButtonText
                            }
                        >
                            {profileImage
                                ? "Change Picture"
                                : "Select Picture"}
                        </Text>

                    </TouchableOpacity>

                </View>


                {/* =================================================
                   PERSONAL INFORMATION
                ================================================= */}

                <View
                    style={
                        styles.card
                    }
                >

                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Personal Information
                    </Text>


                    {/* NAME */}

                    <Text
                        style={
                            styles.label
                        }
                    >
                        Full Name *
                    </Text>


                    <TextInput
                        style={
                            styles.input
                        }
                        placeholder="Enter your full name"
                        placeholderTextColor="#999"
                        value={
                            form.Name
                        }
                        onChangeText={
                            value =>
                                updateField(
                                    "Name",
                                    value
                                )
                        }
                        autoCapitalize="words"
                    />


                    {/* MOBILE */}

                    <Text
                        style={
                            styles.label
                        }
                    >
                        Mobile Number *
                    </Text>


                    <TextInput
                        style={
                            styles.input
                        }
                        placeholder="Enter 10 digit mobile number"
                        placeholderTextColor="#999"
                        value={
                            form.MobileNo
                        }
                        onChangeText={
                            value => {

                                updateField(
                                    "MobileNo",
                                    value.replace(
                                        /[^0-9]/g,
                                        ""
                                    )
                                );

                            }
                        }
                        keyboardType="number-pad"
                        maxLength={10}
                    />


                    {/* AADHAAR */}

                    <Text
                        style={
                            styles.label
                        }
                    >
                        Aadhaar Number *
                    </Text>


                    <TextInput
                        style={
                            styles.input
                        }
                        placeholder="Enter 12 digit Aadhaar number"
                        placeholderTextColor="#999"
                        value={
                            form.Aadhar
                        }
                        onChangeText={
                            value => {

                                updateField(
                                    "Aadhar",
                                    value.replace(
                                        /[^0-9]/g,
                                        ""
                                    )
                                );

                            }
                        }
                        keyboardType="number-pad"
                        maxLength={12}
                        secureTextEntry
                    />

                </View>


                {/* =================================================
                   ACADEMIC INFORMATION
                ================================================= */}

                <View
                    style={
                        styles.card
                    }
                >

                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Academic Information
                    </Text>


                    {/* ROLL NUMBER */}

                    {!(
                        form.batch
                            .trim()
                            .toLowerCase() ===
                        "outsider"
                    ) && (

                        <>

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Roll Number *
                            </Text>


                            <TextInput
                                style={
                                    styles.input
                                }
                                placeholder="Enter Roll Number"
                                placeholderTextColor="#999"
                                value={
                                    form.RollNO
                                }
                                onChangeText={
                                    value =>
                                        updateField(
                                            "RollNO",
                                            value
                                        )
                                }
                                autoCapitalize="characters"
                            />

                        </>

                    )}


                    {/* BATCH */}

                    <Text
                        style={
                            styles.label
                        }
                    >
                        Batch *
                    </Text>


                    <View
                        style={
                            styles.options
                        }
                    >

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

                                    form.batch
                                        .toLowerCase() ===
                                        item.toLowerCase() &&
                                    styles.optionActive
                                ]}
                                onPress={() =>
                                    updateField(
                                        "batch",
                                        item
                                    )
                                }
                            >

                                <Text
                                    style={[
                                        styles.optionText,

                                        form.batch
                                            .toLowerCase() ===
                                            item.toLowerCase() &&
                                        styles.optionTextActive
                                    ]}
                                >
                                    {item}
                                </Text>

                            </TouchableOpacity>

                        ))}

                    </View>


                    {/* BRANCH */}

                    {!(
                        form.batch
                            .trim()
                            .toLowerCase() ===
                        "outsider"
                    ) && (

                        <>

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Branch *
                            </Text>


                            <View
                                style={
                                    styles.options
                                }
                            >

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

                                            form.branch
                                                .toLowerCase() ===
                                                item.toLowerCase() &&
                                            styles.optionActive
                                        ]}
                                        onPress={() =>
                                            updateField(
                                                "branch",
                                                item
                                            )
                                        }
                                    >

                                        <Text
                                            style={[
                                                styles.optionText,

                                                form.branch
                                                    .toLowerCase() ===
                                                    item.toLowerCase() &&
                                                styles.optionTextActive
                                            ]}
                                        >
                                            {item}
                                        </Text>

                                    </TouchableOpacity>

                                ))}

                            </View>

                        </>

                    )}

                </View>


                {/* =================================================
                   AADHAAR DOCUMENT
                ================================================= */}

                <View
                    style={
                        styles.card
                    }
                >

                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Aadhaar Document
                    </Text>


                    <Text
                        style={
                            styles.documentHint
                        }
                    >
                        Upload a clear and readable Aadhaar image.
                    </Text>


                    <TouchableOpacity
                        style={
                            styles.uploadBox
                        }
                        onPress={
                            selectAadharImage
                        }
                        activeOpacity={0.8}
                    >

                        {(
                            aadharImage?.uri ||
                            currentAadharImage
                        ) ? (

                            <Image
                                source={{
                                    uri:
                                        aadharImage?.uri ||
                                        currentAadharImage
                                }}
                                style={
                                    styles.aadharPreview
                                }
                            />

                        ) : (

                            <>

                                <Text
                                    style={
                                        styles.uploadIcon
                                    }
                                >
                                    🪪
                                </Text>


                                <Text
                                    style={
                                        styles.uploadTitle
                                    }
                                >
                                    Upload Aadhaar Card
                                </Text>


                                <Text
                                    style={
                                        styles.uploadText
                                    }
                                >
                                    Tap to select Aadhaar image
                                </Text>

                            </>

                        )}

                    </TouchableOpacity>


                    <TouchableOpacity
                        style={
                            styles.changeButton
                        }
                        onPress={
                            selectAadharImage
                        }
                    >

                        <Text
                            style={
                                styles.changeButtonText
                            }
                        >
                            {aadharImage
                                ? "Change Aadhaar Picture"
                                : "Select Aadhaar Picture"}
                        </Text>

                    </TouchableOpacity>

                </View>


                {/* =================================================
                   INFORMATION BOX
                ================================================= */}

                <View
                    style={
                        styles.infoBox
                    }
                >

                    <Text
                        style={
                            styles.infoIcon
                        }
                    >
                        🔐
                    </Text>


                    <Text
                        style={
                            styles.infoText
                        }
                    >
                        Your updated information will become
                        unverified and must be reviewed again
                        by an administrator.
                    </Text>

                </View>


                {/* =================================================
                   UPDATE BUTTON
                ================================================= */}

                <TouchableOpacity
                    style={[
                        styles.button,

                        updating &&
                        styles.buttonDisabled
                    ]}
                    onPress={
                        updateData
                    }
                    disabled={
                        updating
                    }
                    activeOpacity={0.8}
                >

                    {updating ? (

                        <ActivityIndicator
                            color="#FFFFFF"
                        />

                    ) : (

                        <>

                            <Text
                                style={
                                    styles.buttonText
                                }
                            >
                                Update Profile
                            </Text>


                            <Text
                                style={
                                    styles.arrow
                                }
                            >
                                →
                            </Text>

                        </>

                    )}

                </TouchableOpacity>


                {/* =================================================
                   CANCEL
                ================================================= */}

                <TouchableOpacity
                    style={
                        styles.cancelButton
                    }
                    onPress={() =>
                        navigation.goBack()
                    }
                    disabled={
                        updating
                    }
                >

                    <Text
                        style={
                            styles.cancelButtonText
                        }
                    >
                        Cancel
                    </Text>

                </TouchableOpacity>


                {/* FOOTER */}

                <Text
                    style={
                        styles.footer
                    }
                >
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


    /* ================= LOADING ================= */

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF8F0"
    },


    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#777"
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
        marginBottom: 16
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


    /* ================= WARNING ================= */

    warningBox: {
        flexDirection: "row",
        backgroundColor: "#FFF6DF",
        borderRadius: 16,
        padding: 15,
        marginBottom: 17
    },


    warningIcon: {
        fontSize: 21,
        marginRight: 10
    },


    warningText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 17,
        color: "#78663D"
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
        marginBottom: 10
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


    /* ================= PROFILE ================= */

    profileUploadBox: {
        width: 155,
        height: 155,
        alignSelf: "center",
        borderRadius: 78,
        borderWidth: 1.5,
        borderColor: "#E5D4C7",
        borderStyle: "dashed",
        backgroundColor: "#FFFBF7",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        marginTop: 10
    },


    profilePreview: {
        width: "100%",
        height: "100%",
        resizeMode: "cover"
    },


    changeButton: {
        alignSelf: "center",
        marginTop: 12,
        backgroundColor: "#FFF0E4",
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 11
    },


    changeButtonText: {
        color: "#B64216",
        fontSize: 12,
        fontWeight: "800"
    },


    /* ================= UPLOAD ================= */

    uploadBox: {
        height: 190,
        borderRadius: 17,
        borderWidth: 1.5,
        borderColor: "#E5D4C7",
        borderStyle: "dashed",
        backgroundColor: "#FFFBF7",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        marginTop: 5
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


    aadharPreview: {
        width: "100%",
        height: "100%",
        resizeMode: "contain",
        backgroundColor: "#F5F5F5"
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


    /* ================= CANCEL ================= */

    cancelButton: {
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 5
    },


    cancelButtonText: {
        color: "#777",
        fontSize: 13,
        fontWeight: "700"
    },


    /* ================= FOOTER ================= */

    footer: {
        textAlign: "center",
        color: "#999",
        fontSize: 12,
        marginTop: 12
    }

});