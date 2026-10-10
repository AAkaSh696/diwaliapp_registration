import React, {
    useCallback,
    useState
} from "react";

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Image
} from "react-native";

import {
    useFocusEffect
} from "@react-navigation/native";

import AsyncStorage from "@react-native-async-storage/async-storage";
// import { BASE_URL } from "@env";

const BASE_URL="http://13.53.235.116:5001";
export default function VerifyStudents({
    navigation
}) {

    const [students, setStudents] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    // Track student using MongoDB _id
    // instead of RollNO because outsiders
    // do not have a RollNO.
    const [verifyingStudentId, setVerifyingStudentId] =
        useState(null);

    // Track which student's documents are visible
    // using MongoDB _id.
    const [visibleImages, setVisibleImages] =
        useState({});


    // ==========================================
    // FETCH UNVERIFIED STUDENTS
    // ==========================================

    const fetchStudents = async (
        showLoader = true
    ) => {

        try {

            console.log(
                "🔥 fetchStudents CALLED"
            );

            if (showLoader) {
                setLoading(true);
            }


            const token =
                await AsyncStorage.getItem(
                    "adminToken"
                );


            console.log(
                "🔥 ADMIN TOKEN:",
                token
            );


            // ======================================
            // CHECK ADMIN TOKEN
            // ======================================

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


            // ======================================
            // GET UNVERIFIED STUDENTS
            // ======================================

            const apiUrl =
                `${BASE_URL}/admin/getverificationdata`;


            console.log(
                "🔥 Calling:",
                apiUrl
            );


            const response = await fetch(
                apiUrl,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        token: token
                    })
                }
            );


            console.log(
                "🔥 Response status:",
                response.status
            );


            const result =
                await response.json();


            console.log(
                "🔥 Verification data:",
                result
            );


            // ======================================
            // API ERROR
            // ======================================

            if (!response.ok) {

                throw new Error(
                    result?.msg ||
                    "Unable to fetch students"
                );
            }


            // ======================================
            // STORE FRESH DATA
            // ======================================

            const studentData =
                Array.isArray(result?.data)
                    ? result.data
                    : [];


            console.log(
                "🔥 Students received:",
                studentData.length
            );


            setStudents(
                studentData
            );


        } catch (error) {

            console.log(
                "❌ Fetch students error:",
                error
            );


            Alert.alert(
                "Error",
                error?.message ||
                "Unable to fetch students"
            );

        } finally {

            console.log(
                "🔥 fetchStudents FINISHED"
            );


            setLoading(false);

            setRefreshing(false);
        }
    };


    // ==========================================
    // USE FOCUS EFFECT
    // ==========================================

    useFocusEffect(
        useCallback(() => {

            fetchStudents(true);

        }, [])
    );


    // ==========================================
    // PULL TO REFRESH
    // ==========================================

    const onRefresh = async () => {

        setRefreshing(true);

        await fetchStudents(false);
    };


    // ==========================================
    // TOGGLE DOCUMENTS
    // ==========================================

    const toggleImages = (
        studentId
    ) => {

        setVisibleImages(prev => ({
            ...prev,

            [studentId]:
                !prev[studentId]
        }));
    };


    // ==========================================
    // VERIFY STUDENT
    // ==========================================

    const verifyStudent = async (
        student
    ) => {

        try {

            const token =
                await AsyncStorage.getItem(
                    "adminToken"
                );


            // ======================================
            // CHECK ADMIN TOKEN
            // ======================================

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


            // ======================================
            // CHECK STUDENT
            // ======================================

            if (!student) {

                Alert.alert(
                    "Error",
                    "Student data is missing."
                );

                return;
            }


            // ======================================
            // CHECK MONGODB ID
            // ======================================

            if (!student?._id) {

                Alert.alert(
                    "Error",
                    "Student ID is missing."
                );

                return;
            }


            const studentId =
                student._id;


            setVerifyingStudentId(
                studentId
            );


            // ======================================
            // VERIFY API
            // ======================================

            const response = await fetch(
                `${BASE_URL}/admin/status`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        // ==================================
                        // ADMIN AUTHENTICATION
                        // ==================================

                        token: token,


                        // ==================================
                        // STUDENT MONGODB ID
                        // ==================================

                        studentId:
                            student._id,


                        // ==================================
                        // STUDENT INFORMATION
                        // ==================================

                        RollNo:
                            student.RollNO || null,

                        email:
                            student.email || null,

                        MobileNo:
                            student.MobileNo || null,

                        Name:
                            student.Name || null,

                        branch:
                            student.branch || null,

                        batch:
                            student.batch || null,


                        // ==================================
                        // DOCUMENT INFORMATION
                        // ==================================

                        url:
                            student.url || null,

                        urlAadhar:
                            student.urlAadhar || null

                    })
                }
            );


            const result =
                await response.json();


            console.log(
                "🔥 Verify response:",
                result
            );


            // ======================================
            // API ERROR
            // ======================================

            if (!response.ok) {

                throw new Error(
                    result?.msg ||
                    "Unable to verify student"
                );
            }


            // ======================================
            // SUCCESS
            // ======================================

            Alert.alert(
                "Success",
                `${student?.Name || "Student"} verified successfully.`
            );


            // ======================================
            // FETCH FRESH DATA
            // ======================================

            await fetchStudents(false);


        } catch (error) {

            console.log(
                "❌ Verify student error:",
                error
            );


            Alert.alert(
                "Error",
                error?.message ||
                "Unable to verify student"
            );

        } finally {

            setVerifyingStudentId(
                null
            );
        }
    };


    // ==========================================
    // SEARCH STUDENTS
    // ==========================================

    const filteredStudents =
        students.filter(student => {

            const value =
                search
                    .toLowerCase()
                    .trim();


            if (!value) {
                return true;
            }


            const name =
                String(
                    student?.Name || ""
                ).toLowerCase();


            const rollNo =
                String(
                    student?.RollNO || ""
                ).toLowerCase();


            const mobile =
                String(
                    student?.MobileNo || ""
                ).toLowerCase();


            const email =
                String(
                    student?.email || ""
                ).toLowerCase();


            const batch =
                String(
                    student?.batch || ""
                ).toLowerCase();


            const branch =
                String(
                    student?.branch || ""
                ).toLowerCase();


            return (
                name.includes(value) ||
                rollNo.includes(value) ||
                mobile.includes(value) ||
                email.includes(value) ||
                batch.includes(value) ||
                branch.includes(value)
            );
        });


    // ==========================================
    // RENDER STUDENT
    // ==========================================

    const renderStudent = ({
        item
    }) => {

        // ======================================
        // USE MONGODB _id
        // ======================================

        const studentId =
            item?._id;


        const isVerifying =
            verifyingStudentId ===
            studentId;


        const imagesVisible =
            visibleImages[studentId] === true;


        const isOutsider =
            item?.batch === "outsider";


        return (

            <View style={styles.card}>


                {/* ==================================
                    STUDENT INFORMATION
                ================================== */}

                <View
                    style={
                        styles.studentInfo
                    }
                >


                    <Text
                        style={
                            styles.studentName
                        }
                    >
                        {item?.Name ||
                            "Unknown Student"}
                    </Text>


                    {/* ==================================
                        ROLL NUMBER
                        Only for normal students
                    ================================== */}

                    {!isOutsider && (

                        <Text
                            style={
                                styles.detail
                            }
                        >
                            Roll No:{" "}
                            {item?.RollNO ||
                                "N/A"}
                        </Text>

                    )}


                    {/* ==================================
                        BRANCH
                        Only for normal students
                    ================================== */}

                    {!isOutsider && (

                        <Text
                            style={
                                styles.detail
                            }
                        >
                            Branch:{" "}
                            {item?.branch ||
                                "N/A"}
                        </Text>

                    )}


                    {/* ==================================
                        BATCH
                    ================================== */}

                    <Text
                        style={
                            styles.detail
                        }
                    >
                        Batch:{" "}
                        {item?.batch ||
                            "N/A"}
                    </Text>


                    {/* ==================================
                        OUTSIDER LABEL
                    ================================== */}

                    {isOutsider && (

                        <View
                            style={
                                styles.outsiderBadge
                            }
                        >

                            <Text
                                style={
                                    styles.outsiderText
                                }
                            >
                                OUTSIDER
                            </Text>

                        </View>

                    )}


                    {/* ==================================
                        MOBILE
                    ================================== */}

                    <Text
                        style={
                            styles.detail
                        }
                    >
                        Mobile:{" "}
                        {item?.MobileNo ||
                            "N/A"}
                    </Text>


                    {/* ==================================
                        EMAIL
                    ================================== */}

                    <Text
                        style={
                            styles.detail
                        }
                    >
                        Email:{" "}
                        {item?.email ||
                            "N/A"}
                    </Text>


                    {/* ==================================
                        STATUS
                    ================================== */}

                    <View
                        style={
                            styles.statusContainer
                        }
                    >

                        <Text
                            style={
                                styles.statusText
                            }
                        >
                            ⚠ Unverified
                        </Text>

                    </View>

                </View>


                {/* ==================================
                    VIEW DOCUMENTS BUTTON
                ================================== */}

                <TouchableOpacity
                    style={
                        styles.documentButton
                    }
                    onPress={() =>
                        toggleImages(
                            studentId
                        )
                    }
                >

                    <Text
                        style={
                            styles.documentButtonText
                        }
                    >
                        {imagesVisible
                            ? "Hide Documents"
                            : "View Documents"}
                    </Text>

                </TouchableOpacity>


                {/* ==================================
                    IMAGES
                ================================== */}

                {imagesVisible && (

                    <View
                        style={
                            styles.imageSection
                        }
                    >


                        {/* ==========================
                            STUDENT PHOTO
                        ========================== */}

                        <Text
                            style={
                                styles.imageTitle
                            }
                        >
                            Student Photo
                        </Text>


                        {item?.url ? (

                            <Image
                                source={{
                                    uri: item.url
                                }}
                                style={
                                    styles.studentImage
                                }
                                resizeMode="cover"
                            />

                        ) : (

                            <View
                                style={
                                    styles.noImage
                                }
                            >

                                <Text
                                    style={
                                        styles.noImageText
                                    }
                                >
                                    No student photo available
                                </Text>

                            </View>

                        )}


                        {/* ==========================
                            AADHAAR IMAGE
                        ========================== */}

                        <Text
                            style={
                                styles.imageTitle
                            }
                        >
                            Aadhaar Document
                        </Text>


                        {item?.urlAadhar ? (

                            <Image
                                source={{
                                    uri: item.urlAadhar
                                }}
                                style={
                                    styles.aadharImage
                                }
                                resizeMode="contain"
                            />

                        ) : (

                            <View
                                style={
                                    styles.noImage
                                }
                            >

                                <Text
                                    style={
                                        styles.noImageText
                                    }
                                >
                                    No Aadhaar image available
                                </Text>

                            </View>

                        )}

                    </View>

                )}


                {/* ==================================
                    VERIFY BUTTON
                ================================== */}

                <TouchableOpacity

                    style={
                        styles.verifyButton
                    }

                    disabled={
                        isVerifying
                    }

                    onPress={() => {

                        Alert.alert(
                            "Verify Student",

                            `Are you sure you want to verify ${item?.Name || "this student"}?`,

                            [
                                {
                                    text: "Cancel",

                                    style: "cancel"
                                },

                                {
                                    text: "Verify",

                                    onPress: () =>
                                        verifyStudent(
                                            item
                                        )
                                }
                            ]
                        );

                    }}

                >

                    {isVerifying ? (

                        <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                        />

                    ) : (

                        <Text
                            style={
                                styles.verifyText
                            }
                        >
                            Verify Student
                        </Text>

                    )}

                </TouchableOpacity>

            </View>
        );
    };


    // ==========================================
    // INITIAL LOADING
    // ==========================================

    if (
        loading &&
        students.length === 0
    ) {

        return (

            <View
                style={
                    styles.loadingContainer
                }
            >

                <ActivityIndicator
                    size="large"
                />

                <Text
                    style={
                        styles.loadingText
                    }
                >
                    Loading students...
                </Text>

            </View>
        );
    }


    // ==========================================
    // MAIN UI
    // ==========================================

    return (

        <View style={styles.container}>


            {/* ======================================
                HEADER
            ====================================== */}

            <View style={styles.header}>

                <View>

                    <Text
                        style={
                            styles.title
                        }
                    >
                        Verify Students
                    </Text>


                    <Text
                        style={
                            styles.subtitle
                        }
                    >
                        {students.length} unverified{" "}
                        student
                        {students.length !== 1
                            ? "s"
                            : ""}
                    </Text>

                </View>


                <TouchableOpacity
                    onPress={() =>
                        navigation.goBack()
                    }
                >

                    <Text
                        style={
                            styles.backText
                        }
                    >
                        Back
                    </Text>

                </TouchableOpacity>

            </View>


            {/* ======================================
                SEARCH
            ====================================== */}

            <TextInput

                style={
                    styles.searchInput
                }

                placeholder={
                    "Search by name, roll no, mobile, email, batch or branch"
                }

                placeholderTextColor="#999"

                value={search}

                onChangeText={
                    setSearch
                }

            />


            {/* ======================================
                STUDENT LIST
            ====================================== */}

            <FlatList

                data={
                    filteredStudents
                }

                keyExtractor={item =>
                    String(
                        item?._id
                    )
                }

                renderItem={
                    renderStudent
                }

                showsVerticalScrollIndicator={
                    false
                }

                refreshControl={

                    <RefreshControl

                        refreshing={
                            refreshing
                        }

                        onRefresh={
                            onRefresh
                        }

                    />

                }

                contentContainerStyle={

                    filteredStudents.length === 0
                        ? styles.emptyContainer
                        : styles.listContainer

                }

                ListEmptyComponent={

                    <View
                        style={
                            styles.emptyView
                        }
                    >

                        <Text
                            style={
                                styles.emptyIcon
                            }
                        >
                            ✅
                        </Text>


                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            No unverified students
                        </Text>


                        <Text
                            style={
                                styles.emptySubtitle
                            }
                        >
                            All students are currently
                            verified.
                        </Text>

                    </View>

                }

            />

        </View>
    );
}


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

    // ==========================================
    // CONTAINER
    // ==========================================

    container: {
        flex: 1,
        backgroundColor: "#FFF8F0",
        paddingHorizontal: 20,
        paddingTop: 20
    },


    loadingContainer: {
        flex: 1,
        backgroundColor: "#FFF8F0",
        justifyContent: "center",
        alignItems: "center"
    },


    loadingText: {
        marginTop: 10,
        color: "#777",
        fontSize: 14
    },


    // ==========================================
    // HEADER
    // ==========================================

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },


    title: {
        fontSize: 25,
        fontWeight: "800",
        color: "#292929"
    },


    subtitle: {
        fontSize: 13,
        color: "#777",
        marginTop: 4
    },


    backText: {
        color: "#B64216",
        fontSize: 14,
        fontWeight: "700"
    },


    // ==========================================
    // SEARCH
    // ==========================================

    searchInput: {
        height: 50,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 14,
        color: "#292929",
        marginBottom: 15,
        elevation: 2
    },


    // ==========================================
    // LIST
    // ==========================================

    listContainer: {
        paddingBottom: 30
    },


    emptyContainer: {
        flexGrow: 1,
        justifyContent: "center"
    },


    // ==========================================
    // STUDENT CARD
    // ==========================================

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 17,
        marginBottom: 13,

        elevation: 3,

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 3
        },

        shadowOpacity: 0.05,

        shadowRadius: 8
    },


    studentInfo: {
        marginBottom: 15
    },


    studentName: {
        fontSize: 17,
        fontWeight: "800",
        color: "#292929",
        marginBottom: 8
    },


    detail: {
        fontSize: 13,
        color: "#666",
        marginBottom: 4
    },


    // ==========================================
    // OUTSIDER BADGE
    // ==========================================

    outsiderBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#EDE7F6",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 7
    },


    outsiderText: {
        color: "#6A1B9A",
        fontSize: 11,
        fontWeight: "800"
    },


    // ==========================================
    // STATUS
    // ==========================================

    statusContainer: {
        alignSelf: "flex-start",
        backgroundColor: "#FFF1DD",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 8
    },


    statusText: {
        color: "#C47700",
        fontSize: 12,
        fontWeight: "700"
    },


    // ==========================================
    // DOCUMENT BUTTON
    // ==========================================

    documentButton: {
        height: 44,
        borderRadius: 12,
        backgroundColor: "#F3E8E1",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12
    },


    documentButtonText: {
        color: "#B64216",
        fontSize: 14,
        fontWeight: "800"
    },


    // ==========================================
    // IMAGE SECTION
    // ==========================================

    imageSection: {
        marginBottom: 15
    },


    imageTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#292929",
        marginBottom: 8,
        marginTop: 5
    },


    studentImage: {
        width: "100%",
        height: 220,
        borderRadius: 12,
        backgroundColor: "#F2F2F2",
        marginBottom: 15
    },


    aadharImage: {
        width: "100%",
        height: 220,
        borderRadius: 12,
        backgroundColor: "#F2F2F2",
        marginBottom: 5
    },


    noImage: {
        height: 100,
        borderRadius: 12,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15
    },


    noImageText: {
        color: "#888",
        fontSize: 13
    },


    // ==========================================
    // VERIFY BUTTON
    // ==========================================

    verifyButton: {
        height: 46,
        borderRadius: 12,
        backgroundColor: "#B64216",
        justifyContent: "center",
        alignItems: "center"
    },


    verifyText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800"
    },


    // ==========================================
    // EMPTY
    // ==========================================

    emptyView: {
        alignItems: "center",
        paddingHorizontal: 20
    },


    emptyIcon: {
        fontSize: 45,
        marginBottom: 12
    },


    emptyTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#292929"
    },


    emptySubtitle: {
        fontSize: 13,
        color: "#888",
        marginTop: 6,
        textAlign: "center"
    }

});