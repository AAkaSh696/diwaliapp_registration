
import React, {
    useCallback,
    useState
} from "react";

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import AsyncStorage from "@react-native-async-storage/async-storage";

// import { BASE_URL } from "@env";
const BASE_URL = "";
export default function AdminHome({ navigation }) {

    // ==========================================
    // STATE
    // ==========================================
    const [dashboard, setDashboard] = useState({
        verified: 0,
        unverified: 0,
        total: 0
    });

    const [refreshing, setRefreshing] =
        useState(false);

    const [loading, setLoading] =
        useState(true);


    // ==========================================
    // FETCH DASHBOARD DATA
    // ==========================================

    const fetchDashboard = async (
        showLoader = true
    ) => {

        try {

            if (showLoader) {
                setLoading(true);
            }

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
            // DASHBOARD API
            // ======================================

            const response = await fetch(
                `${BASE_URL}/admin/dashboardstats`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({})
                }
            );


            const data =
                await response.json();


            console.log(
                "Dashboard Response:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data?.msg ||
                    "Unable to fetch dashboard."
                );
            }


            // ======================================
            // GET ACTUAL DASHBOARD DATA
            // ======================================

            const dashboardData =
                data?.data || data;

            console.log(
                "Dashboard Data:",
                dashboardData
            );


            // ======================================
            // REPLACE OLD DATA
            // WITH LATEST API DATA
            // ======================================

            setDashboard({
                total:
                    dashboardData?.total ??
                    0,

                verified:
                    dashboardData?.verified ??
                    0,

                unverified:
                    dashboardData?.unverified ??
                    0
            });


        } catch (error) {

            console.log(
                "Dashboard error:",
                error
            );


            Alert.alert(
                "Error",
                error?.message ||
                "Unable to load dashboard."
            );


        } finally {

            setLoading(false);

            setRefreshing(false);
        }
    };


    // ==========================================
    // FETCH EVERY TIME SCREEN GETS FOCUS
    // ==========================================

    useFocusEffect(
        useCallback(() => {

            fetchDashboard(true);

        }, [])
    );


    // ==========================================
    // PULL TO REFRESH
    // ==========================================

    const onRefresh = async () => {

        setRefreshing(true);

        await fetchDashboard(false);
    };


    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = async () => {

        try {

            await AsyncStorage.removeItem(
                "adminToken"
            );

            await AsyncStorage.removeItem(
                "adminData"
            );


            navigation.reset({
                index: 0,
                routes: [
                    {
                        name: "Login"
                    }
                ]
            });

        } catch (error) {

            console.log(
                "Logout error:",
                error
            );
        }
    };


    // ==========================================
    // UI
    // ==========================================

    return (

        <View style={styles.safeArea}>

            <ScrollView

                contentContainerStyle={
                    styles.container
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

                showsVerticalScrollIndicator={
                    false
                }
            >


                {/* ======================================
                    HEADER
                ====================================== */}

                <View style={styles.header}>

                    <View>

                        <Text
                            style={
                                styles.welcome
                            }
                        >
                            Welcome Admin 👋
                        </Text>


                        <Text
                            style={
                                styles.headerSubtitle
                            }
                        >
                            Manage students and events
                        </Text>

                    </View>


                    <TouchableOpacity

                        style={
                            styles.logoutButton
                        }

                        onPress={
                            handleLogout
                        }

                    >

                        <Text
                            style={
                                styles.logoutText
                            }
                        >
                            Logout
                        </Text>

                    </TouchableOpacity>

                </View>



                {/* ======================================
                    STUDENT OVERVIEW
                ====================================== */}

                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Student Overview
                </Text>


                <View
                    style={
                        styles.statsContainer
                    }
                >


                    {/* TOTAL STUDENTS */}

                    <View
                        style={
                            styles.statCard
                        }
                    >

                        <View
                            style={
                                styles.statIcon
                            }
                        >

                            <Text
                                style={
                                    styles.iconText
                                }
                            >
                                👨‍🎓
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.statNumber
                            }
                        >
                            {loading
                                ? "..."
                                : dashboard.total}
                        </Text>


                        <Text
                            style={
                                styles.statLabel
                            }
                        >
                            Total Students
                        </Text>

                    </View>



                    {/* VERIFIED */}

                    <View
                        style={
                            styles.statCard
                        }
                    >

                        <View
                            style={
                                styles.statIcon
                            }
                        >

                            <Text
                                style={
                                    styles.iconText
                                }
                            >
                                ✓
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.statNumber
                            }
                        >
                            {loading
                                ? "..."
                                : dashboard.verified}
                        </Text>


                        <Text
                            style={
                                styles.statLabel
                            }
                        >
                            Verified
                        </Text>

                    </View>



                    {/* UNVERIFIED */}

                    <View
                        style={
                            styles.statCard
                        }
                    >

                        <View
                            style={
                                styles.statIcon
                            }
                        >

                            <Text
                                style={
                                    styles.iconText
                                }
                            >
                                ⚠
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.statNumber
                            }
                        >
                            {loading
                                ? "..."
                                : dashboard.unverified}
                        </Text>


                        <Text
                            style={
                                styles.statLabel
                            }
                        >
                            Unverified
                        </Text>

                    </View>

                </View>



                {/* ======================================
                    QUICK ACTIONS
                ====================================== */}

                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Quick Actions
                </Text>


                <View
                    style={
                        styles.actionGrid
                    }
                >


                    {/* ADD EVENT */}

                    <TouchableOpacity

                        style={
                            styles.actionCard
                        }

                        onPress={() =>
                            navigation.navigate(
                                "addevent"
                            )
                        }

                    >

                        <View
                            style={
                                styles.actionIcon
                            }
                        >

                            <Text
                                style={
                                    styles.actionEmoji
                                }
                            >
                                ➕
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.actionTitle
                            }
                        >
                            Add Event
                        </Text>


                        <Text
                            style={
                                styles.actionSubtitle
                            }
                        >
                            Publish a new event
                        </Text>

                    </TouchableOpacity>



                    {/* UPDATE EVENTS */}

                    <TouchableOpacity

                        style={
                            styles.actionCard
                        }

                        onPress={() =>
                            navigation.navigate(
                                "updateevent"
                            )
                        }

                    >

                        <View
                            style={
                                styles.actionIcon
                            }
                        >

                            <Text
                                style={
                                    styles.actionEmoji
                                }
                            >
                                ✏️
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.actionTitle
                            }
                        >
                            Update Events
                        </Text>


                        <Text
                            style={
                                styles.actionSubtitle
                            }
                        >
                            Edit existing events
                        </Text>

                    </TouchableOpacity>



                    {/* VERIFY STUDENTS */}

                    <TouchableOpacity

                        style={
                            styles.actionCard
                        }

                        onPress={() =>
                            navigation.navigate(
                                "verificationpage"
                            )
                        }

                    >

                        <View
                            style={
                                styles.actionIcon
                            }
                        >

                            <Text
                                style={
                                    styles.actionEmoji
                                }
                            >
                                ✅
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.actionTitle
                            }
                        >
                            Verify Students
                        </Text>


                        <Text
                            style={
                                styles.actionSubtitle
                            }
                        >
                            Manage verification
                        </Text>

                    </TouchableOpacity>



                    {/* VERIFIED STUDENTS */}

                    <TouchableOpacity

                        style={
                            styles.actionCard
                        }

                        onPress={() =>
                            navigation.navigate(
                                "verifiedusers"
                            )
                        }

                    >

                        <View
                            style={
                                styles.actionIcon
                            }
                        >

                            <Text
                                style={
                                    styles.actionEmoji
                                }
                            >
                                🟢
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.actionTitle
                            }
                        >
                            Verified Students
                        </Text>


                        <Text
                            style={
                                styles.actionSubtitle
                            }
                        >
                            View verified students
                        </Text>

                    </TouchableOpacity>



                    {/* QR SCANNER */}

                    <TouchableOpacity

                        style={
                            styles.actionCard
                        }

                        onPress={() =>
                            navigation.navigate(
                                "qrscanner"
                            )
                        }

                    >

                        <View
                            style={
                                styles.actionIcon
                            }
                        >

                            <Text
                                style={
                                    styles.actionEmoji
                                }
                            >
                                📷
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.actionTitle
                            }
                        >
                            QR Scanner
                        </Text>


                        <Text
                            style={
                                styles.actionSubtitle
                            }
                        >
                            Scan student QR
                        </Text>

                    </TouchableOpacity>

                </View>



                {/* ======================================
                    VERIFICATION STATUS
                ====================================== */}

                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Verification Status
                </Text>


                <View
                    style={
                        styles.verificationCard
                    }
                >


                    {/* VERIFIED */}

                    <View
                        style={
                            styles.verificationRow
                        }
                    >

                        <View
                            style={
                                styles.verificationLeft
                            }
                        >

                            <View
                                style={
                                    styles.greenDot
                                }
                            />

                            <Text
                                style={
                                    styles.verificationText
                                }
                            >
                                Verified Students
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.verificationCount
                            }
                        >
                            {dashboard.verified}
                        </Text>

                    </View>


                    <View
                        style={
                            styles.divider
                        }
                    />


                    {/* UNVERIFIED */}

                    <View
                        style={
                            styles.verificationRow
                        }
                    >

                        <View
                            style={
                                styles.verificationLeft
                            }
                        >

                            <View
                                style={
                                    styles.orangeDot
                                }
                            />

                            <Text
                                style={
                                    styles.verificationText
                                }
                            >
                                Unverified Students
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.verificationCount
                            }
                        >
                            {dashboard.unverified}
                        </Text>

                    </View>


                    {/* ==================================
                        VIEW VERIFIED STUDENTS
                    ================================== */}

                    <View
                        style={
                            styles.divider
                        }
                    />


                    <TouchableOpacity

                        style={
                            styles.viewVerifiedButton
                        }

                        onPress={() =>
                            navigation.navigate(
                                "verifiedusers"
                            )
                        }

                    >

                        <Text
                            style={
                                styles.viewVerifiedText
                            }
                        >
                            View Verified Students →
                        </Text>

                    </TouchableOpacity>

                </View>



                {/* ======================================
                    QR SCANNER BANNER
                ====================================== */}

                <TouchableOpacity

                    style={
                        styles.scannerBanner
                    }

                    onPress={() =>
                        navigation.navigate(
                            "qrscanner"
                        )
                    }

                >

                    <View>

                        <Text
                            style={
                                styles.bannerTitle
                            }
                        >
                            Scan Student QR
                        </Text>


                        <Text
                            style={
                                styles.bannerSubtitle
                            }
                        >
                            Quickly view student information
                        </Text>

                    </View>


                    <Text
                        style={
                            styles.bannerIcon
                        }
                    >
                        📷
                    </Text>

                </TouchableOpacity>



                {/* ======================================
                    FOOTER
                ====================================== */}

                <Text
                    style={
                        styles.footer
                    }
                >
                    Admin Dashboard
                </Text>


            </ScrollView>

        </View>
    );
}



const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: "#FFF8F0"
    },


    container: {
        padding: 20,
        paddingBottom: 35
    },


    // ==========================================
    // HEADER
    // ==========================================

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 28
    },


    welcome: {
        fontSize: 25,
        fontWeight: "800",
        color: "#292929"
    },


    headerSubtitle: {
        fontSize: 14,
        color: "#777",
        marginTop: 5
    },


    logoutButton: {
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: "#FFE8DD"
    },


    logoutText: {
        color: "#B64216",
        fontSize: 13,
        fontWeight: "700"
    },


    // ==========================================
    // SECTION
    // ==========================================

    sectionTitle: {
        fontSize: 19,
        fontWeight: "800",
        color: "#292929",
        marginBottom: 13,
        marginTop: 5
    },


    // ==========================================
    // STATS
    // ==========================================

    statsContainer: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 25
    },


    statCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 13,
        alignItems: "center",

        elevation: 3,

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 3
        },

        shadowOpacity: 0.05,

        shadowRadius: 8
    },


    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFF0D9",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8
    },


    iconText: {
        fontSize: 19
    },


    statNumber: {
        fontSize: 23,
        fontWeight: "800",
        color: "#B64216"
    },


    statLabel: {
        fontSize: 11,
        color: "#777",
        marginTop: 3,
        textAlign: "center"
    },


    // ==========================================
    // ACTIONS
    // ==========================================

    actionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 25
    },


    actionCard: {
        width: "48%",
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 17,
        marginBottom: 12,

        elevation: 3,

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 3
        },

        shadowOpacity: 0.05,

        shadowRadius: 8
    },


    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "#FFF0D9",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 13
    },


    actionEmoji: {
        fontSize: 23
    },


    actionTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#292929"
    },


    actionSubtitle: {
        fontSize: 11,
        color: "#888",
        marginTop: 4,
        lineHeight: 16
    },


    // ==========================================
    // VERIFICATION
    // ==========================================

    verificationCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 5,
        marginBottom: 20,

        elevation: 3,

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 3
        },

        shadowOpacity: 0.05,

        shadowRadius: 8
    },


    verificationRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 15
    },


    verificationLeft: {
        flexDirection: "row",
        alignItems: "center"
    },


    greenDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#28A745",
        marginRight: 10
    },


    orangeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#F39C12",
        marginRight: 10
    },


    verificationText: {
        fontSize: 14,
        color: "#444",
        fontWeight: "600"
    },


    verificationCount: {
        fontSize: 17,
        fontWeight: "800",
        color: "#292929"
    },


    divider: {
        height: 1,
        backgroundColor: "#F0E8E0"
    },


    // ==========================================
    // VIEW VERIFIED BUTTON
    // ==========================================

    viewVerifiedButton: {
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center"
    },


    viewVerifiedText: {
        color: "#B64216",
        fontSize: 14,
        fontWeight: "800"
    },


    // ==========================================
    // QR BANNER
    // ==========================================

    scannerBanner: {
        backgroundColor: "#B64216",
        borderRadius: 20,
        padding: 20,

        flexDirection: "row",

        justifyContent: "space-between",

        alignItems: "center",

        marginBottom: 20
    },


    bannerTitle: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "800"
    },


    bannerSubtitle: {
        color: "#FFE7D8",
        fontSize: 12,
        marginTop: 5
    },


    bannerIcon: {
        fontSize: 34
    },


    // ==========================================
    // FOOTER
    // ==========================================

    footer: {
        textAlign: "center",
        color: "#999",
        fontSize: 12,
        marginTop: 5
    }

});

