import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    useCallback,
    useState
} from "react";

import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    RefreshControl
} from "react-native";

import {
    useDispatch,
    useSelector
} from "react-redux";

import {
    useFocusEffect
} from "@react-navigation/native";

import action from "../redux/action";

const BASE_URL = "http://10.162.135.224:5001";

export default function Home({ navigation }) {

    const dispatch = useDispatch();

    /*
     * =========================
     * LOADING STATES
     * =========================
     */

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] =
        useState(false);


    /*
     * =========================
     * REDUX DATA
     * =========================
     */

    const user = useSelector(
        state => state.user
    );

    const events = useSelector(
        state => state.events || []
    );


    /*
     * =========================
     * LATEST 2 EVENTS
     * =========================
     */

    const latestEvents =
        events.slice(0, 2);


    console.log(
        "Redux user:",
        user
    );

    console.log(
        "Redux all events:",
        events
    );

    console.log(
        "Latest 2 events:",
        latestEvents
    );


    /*
     * =========================
     * FETCH LATEST DATA
     * =========================
     */

    const fetchLatestData = async (
        showFullLoader = false
    ) => {

        try {

            if (showFullLoader) {
                setLoading(true);
            }


            let latestUser = null;
            let activeEvents = [];


            /*
             * =========================
             * GET TOKEN
             * =========================
             */

            const token =
                await AsyncStorage.getItem(
                    "token"
                );


            /*
             * =========================
             * USER API
             * =========================
             */

            if (token) {

                const userResponse =
                    await fetch(
                        `${BASE_URL}/registration/getuserdata`,
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


                if (!userResponse.ok) {

                    throw new Error(
                        `User API error: ${userResponse.status}`
                    );

                }


                const userResult =
                    await userResponse.json();


                console.log(
                    "Latest user:",
                    userResult
                );


                latestUser =
                    userResult?.data || null;

            }


            /*
             * =========================
             * EVENT API
             * =========================
             */

            const eventResponse =
                await fetch(
                    `${BASE_URL}/admin/getadminupdates`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({})
                    }
                );


            if (!eventResponse.ok) {

                throw new Error(
                    `Event API error: ${eventResponse.status}`
                );

            }


            const eventResult =
                await eventResponse.json();


            console.log(
                "Latest events response:",
                eventResult
            );


            /*
             * =========================
             * GET EVENT ARRAY
             * =========================
             */

            const eventList =
                Array.isArray(eventResult)
                    ? eventResult
                    : Array.isArray(
                        eventResult?.data
                    )
                        ? eventResult.data
                        : [];


            /*
             * =========================
             * SORT EVENTS
             * =========================
             */

            const sortedEvents =
                [...eventList].sort(
                    (a, b) => {

                        const dateA =
                            new Date(
                                a?.publishedAt || 0
                            ).getTime();

                        const dateB =
                            new Date(
                                b?.publishedAt || 0
                            ).getTime();

                        return dateB - dateA;

                    }
                );


            /*
             * =========================
             * FILTER ACTIVE EVENTS
             * =========================
             */

            activeEvents =
                sortedEvents.filter(
                    item => {

                        if (
                            item?.isActive === false
                        ) {

                            return false;

                        }


                        if (item?.expiresAt) {

                            return (
                                new Date(
                                    item.expiresAt
                                ) > new Date()
                            );

                        }


                        return true;

                    }
                );


            console.log(
                "Active events:",
                activeEvents
            );


            /*
             * =========================
             * UPDATE REDUX
             * =========================
             */

            dispatch(
                action({
                    type: "updatedata",

                    data: {
                        user: latestUser,
                        events: activeEvents
                    }
                })
            );


        } catch (error) {

            console.log(
                "Error fetching latest data:",
                error
            );

        } finally {

            if (showFullLoader) {
                setLoading(false);
            }

        }

    };


    /*
     * =========================
     * REFRESH ON SCREEN FOCUS
     * =========================
     */

    useFocusEffect(
        useCallback(() => {

            fetchLatestData(true);

        }, [])
    );


    /*
     * =========================
     * MANUAL REFRESH
     * =========================
     */

    const onRefresh = async () => {

        try {

            setRefreshing(true);

            await fetchLatestData(false);

        } finally {

            setRefreshing(false);

        }

    };


    /*
     * =========================
     * LOGOUT
     * =========================
     */

    const handleLogout = async () => {

        await AsyncStorage.removeItem(
            "token"
        );


        navigation.reset({

            index: 0,

            routes: [
                {
                    name: "Welcome"
                }
            ]

        });

    };


    /*
     * =========================
     * INITIAL LOADING
     * =========================
     */

    if (loading) {

        return (

            <SafeAreaView
                style={
                    styles.loadingContainer
                }
            >

                <StatusBar
                    barStyle="dark-content"
                    backgroundColor="#FFF8F0"
                />


                <View
                    style={
                        styles.loadingContent
                    }
                >

                    <Text
                        style={
                            styles.loadingEmoji
                        }
                    >
                        🪔
                    </Text>


                    <Text
                        style={
                            styles.loadingTitle
                        }
                    >
                        DiwaliHaat
                    </Text>


                    <ActivityIndicator
                        size="large"
                        color="#B64216"
                        style={{
                            marginTop: 20
                        }}
                    />


                    <Text
                        style={
                            styles.loadingText
                        }
                    >
                        Loading your latest data...
                    </Text>

                </View>

            </SafeAreaView>

        );

    }


    /*
     * =========================
     * MAIN HOME
     * =========================
     */

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

                showsVerticalScrollIndicator={
                    false
                }

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

            >

                {/* ================= HEADER ================= */}

                <View
                    style={
                        styles.header
                    }
                >

                    <View>

                        <Text
                            style={
                                styles.greeting
                            }
                        >
                            Welcome back 👋
                        </Text>


                        <Text
                            style={
                                styles.brand
                            }
                        >
                            DiwaliHaat
                        </Text>

                    </View>


                    <TouchableOpacity

                        style={
                            styles.profileButton
                        }

                        onPress={() =>
                            navigation.navigate(
                                "Profile"
                            )
                        }

                    >

                        <View
                            style={
                                styles.profileCircle
                            }
                        >

                            <Text
                                style={
                                    styles.profileEmoji
                                }
                            >
                                👤
                            </Text>

                        </View>

                    </TouchableOpacity>

                </View>


                {/* ================= PROFILE CARD ================= */}

                <View
                    style={
                        styles.profileCard
                    }
                >

                    <View
                        style={
                            styles.profileImageContainer
                        }
                    >

                        {user?.url ? (

                            <Image

                                source={{
                                    uri: user.url
                                }}

                                style={
                                    styles.profileImage
                                }

                                resizeMode="cover"

                            />

                        ) : (

                            <View
                                style={
                                    styles.profileImagePlaceholder
                                }
                            >

                                <Text
                                    style={{
                                        fontSize: 35
                                    }}
                                >
                                    👤
                                </Text>

                            </View>

                        )}


                        {/* VERIFIED */}

                        <View

                            style={[
                                styles.verifiedBadge,

                                user?.verified
                                    ? styles.verifiedBadgeSuccess
                                    : styles.verifiedBadgeWarning
                            ]}

                        >

                            <Text
                                style={
                                    styles.verifiedText
                                }
                            >

                                {user?.verified
                                    ? "✓ Verified"
                                    : "⚠ Not Verified"}

                            </Text>

                        </View>

                    </View>


                    <View
                        style={
                            styles.profileInfo
                        }
                    >

                        <Text
                            style={
                                styles.profileName
                            }
                        >
                            {user?.Name ||
                                "user"}
                        </Text>


                        <Text
                            style={
                                styles.profileRole
                            }
                        >
                            Student •{" "}
                            {user?.branch ||
                                "N/A"}
                        </Text>


                        <View
                            style={
                                styles.profileDetails
                            }
                        >

                            <View
                                style={
                                    styles.detailItem
                                }
                            >

                                <Text
                                    style={
                                        styles.detailLabel
                                    }
                                >
                                    Roll No
                                </Text>


                                <Text
                                    style={
                                        styles.detailValue
                                    }
                                >
                                    {user?.RollNO ||
                                        "N/A"}
                                </Text>

                            </View>


                            <View
                                style={
                                    styles.verticalLine
                                }
                            />


                            <View
                                style={
                                    styles.detailItem
                                }
                            >

                                <Text
                                    style={
                                        styles.detailLabel
                                    }
                                >
                                    Batch
                                </Text>


                                <Text
                                    style={
                                        styles.detailValue
                                    }
                                >
                                    {user?.batch ||
                                        "N/A"}
                                </Text>

                            </View>

                        </View>

                    </View>

                </View>


                {/* ================= EVENTS HEADER ================= */}

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View>

                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Upcoming Events
                        </Text>


                        <Text
                            style={
                                styles.sectionSubtitle
                            }
                        >
                            Don't miss what's happening
                        </Text>

                    </View>


                    <TouchableOpacity

                        onPress={() =>
                            navigation.navigate(
                                "Events"
                            )
                        }

                    >

                        <Text
                            style={
                                styles.seeAll
                            }
                        >
                            See All
                        </Text>

                    </TouchableOpacity>

                </View>


                {/* ================= LATEST 2 EVENTS ================= */}

                {latestEvents.length > 0 ? (

                    latestEvents.map(item => (

                        <TouchableOpacity

                            key={item._id}

                            style={
                                styles.eventCard
                            }

                            onPress={() =>
                                navigation.navigate(
                                    "Events"
                                )
                            }

                        >

                            <View
                                style={
                                    styles.eventDate
                                }
                            >

                                <Text
                                    style={
                                        styles.eventMonth
                                    }
                                >
                                    {getMonth(
                                        item.publishedAt
                                    )}
                                </Text>


                                <Text
                                    style={
                                        styles.eventDay
                                    }
                                >
                                    {getDay(
                                        item.publishedAt
                                    )}
                                </Text>

                            </View>


                            <View
                                style={
                                    styles.eventInfo
                                }
                            >

                                {item?.highlight ? (

                                    <View
                                        style={
                                            styles.eventTag
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.eventTagText
                                            }
                                        >
                                            {item.highlight}
                                        </Text>

                                    </View>

                                ) : null}


                                <Text
                                    style={
                                        styles.eventTitle
                                    }
                                >
                                    {item?.title ||
                                        "Event"}
                                </Text>


                                {item?.event ? (

                                    <Text
                                        style={
                                            styles.eventMeta
                                        }
                                    >
                                        📅 {item.event}
                                    </Text>

                                ) : null}


                                {item?.info ? (

                                    <Text
                                        style={
                                            styles.eventMeta
                                        }

                                        numberOfLines={
                                            2
                                        }

                                    >
                                        {item.info}
                                    </Text>

                                ) : null}

                            </View>


                            <Text
                                style={
                                    styles.eventArrow
                                }
                            >
                                ›
                            </Text>

                        </TouchableOpacity>

                    ))

                ) : (

                    <View
                        style={
                            styles.noEventCard
                        }
                    >

                        <Text
                            style={
                                styles.noEventText
                            }
                        >
                            No upcoming events
                        </Text>

                    </View>

                )}


                {/* ================= QUICK ACTIONS ================= */}

                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Quick Actions
                </Text>


                <View
                    style={
                        styles.quickGrid
                    }
                >

                    {/* EVENTS */}

                    <TouchableOpacity

                        style={
                            styles.quickCard
                        }

                        onPress={() =>
                            navigation.navigate(
                                "Events"
                            )
                        }

                    >

                        <View
                            style={
                                styles.quickIconOrange
                            }
                        >

                            <Text>
                                🎉
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.quickTitle
                            }
                        >
                            Events
                        </Text>


                        <Text
                            style={
                                styles.quickText
                            }
                        >
                            View upcoming events
                        </Text>

                    </TouchableOpacity>


                    {/* UPDATE PROFILE */}

                    <TouchableOpacity

                        style={
                            styles.quickCard
                        }

                        onPress={() =>
                            navigation.navigate(
                                "updatestudent"
                            )
                        }

                    >

                        <View
                            style={
                                styles.quickIconBlue
                            }
                        >

                            <Text>
                                ✏️
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.quickTitle
                            }
                        >
                            Update Profile
                        </Text>


                        <Text
                            style={
                                styles.quickText
                            }
                        >
                            Update your student details
                        </Text>

                    </TouchableOpacity>

                </View>


                {/* ================= LOGOUT ================= */}

                <TouchableOpacity

                    style={
                        styles.logoutButton
                    }

                    onPress={
                        handleLogout
                    }

                >

                    <View
                        style={
                            styles.logoutIcon
                        }
                    >

                        <Text
                            style={
                                styles.logoutIconText
                            }
                        >
                            ↪
                        </Text>

                    </View>


                    <View
                        style={
                            styles.logoutContent
                        }
                    >

                        <Text
                            style={
                                styles.logoutTitle
                            }
                        >
                            Logout
                        </Text>


                        <Text
                            style={
                                styles.logoutText
                            }
                        >
                            Sign out of your account
                        </Text>

                    </View>


                    <Text
                        style={
                            styles.logoutArrow
                        }
                    >
                        →
                    </Text>

                </TouchableOpacity>


                {/* ================= FOOTER ================= */}

                <View
                    style={
                        styles.footer
                    }
                >

                    <Text
                        style={
                            styles.footerEmoji
                        }
                    >
                        🪔 ✨ 🪔
                    </Text>


                    <Text
                        style={
                            styles.footerText
                        }
                    >
                        Celebrate. Connect. Belong.
                    </Text>


                    <Text
                        style={
                            styles.footerSmall
                        }
                    >
                        DiwaliHaat
                    </Text>

                </View>

            </ScrollView>


            {/* ================= BOTTOM NAV ================= */}

            <View
                style={
                    styles.bottomNav
                }
            >

                {/* HOME */}

                <TouchableOpacity
                    style={
                        styles.navItem
                    }
                >

                    <Text
                        style={
                            styles.navIconActive
                        }
                    >
                        🏠
                    </Text>


                    <Text
                        style={
                            styles.navTextActive
                        }
                    >
                        Home
                    </Text>

                </TouchableOpacity>


                {/* EVENTS */}

                <TouchableOpacity

                    style={
                        styles.navItem
                    }

                    onPress={() =>
                        navigation.navigate(
                            "Events"
                        )
                    }

                >

                    <Text
                        style={
                            styles.navIcon
                        }
                    >
                        🎉
                    </Text>


                    <Text
                        style={
                            styles.navText
                        }
                    >
                        Events
                    </Text>

                </TouchableOpacity>


                {/* PROFILE */}

                <TouchableOpacity

                    style={
                        styles.navItem
                    }

                    onPress={() =>
                        navigation.navigate(
                            "Profile"
                        )
                    }

                >

                    <Text
                        style={
                            styles.navIcon
                        }
                    >
                        👤
                    </Text>


                    <Text
                        style={
                            styles.navText
                        }
                    >
                        Profile
                    </Text>

                </TouchableOpacity>


                {/* LOGOUT */}

                <TouchableOpacity

                    style={
                        styles.navItem
                    }

                    onPress={
                        handleLogout
                    }

                >

                    <Text
                        style={
                            styles.navIcon
                        }
                    >
                        🚪
                    </Text>


                    <Text
                        style={
                            styles.navText
                        }
                    >
                        Logout
                    </Text>

                </TouchableOpacity>

            </View>

        </SafeAreaView>

    );

}


/* =====================================================
   DATE HELPERS
===================================================== */

function getMonth(date) {

    if (!date) {
        return "---";
    }

    return new Date(date)
        .toLocaleDateString(
            "en-IN",
            {
                month: "short"
            }
        )
        .toUpperCase();

}


function getDay(date) {

    if (!date) {
        return "--";
    }

    return new Date(date)
        .getDate()
        .toString();

}


/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

    loadingContainer: {
        flex: 1,
        backgroundColor: "#FFF8F0"
    },

    loadingContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    loadingEmoji: {
        fontSize: 50,
        marginBottom: 10
    },

    loadingTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#B64216"
    },

    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: "#777"
    },

    safeArea: {
        flex: 1,
        backgroundColor: "#FFF8F0"
    },

    container: {
        padding: 20,
        paddingBottom: 120
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },

    greeting: {
        fontSize: 14,
        color: "#777",
        marginBottom: 4
    },

    brand: {
        fontSize: 28,
        fontWeight: "800",
        color: "#B64216"
    },

    profileButton: {
        padding: 2
    },

    profileCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#FFE4D3",
        justifyContent: "center",
        alignItems: "center"
    },

    profileEmoji: {
        fontSize: 24
    },

    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 28,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.08,
        shadowRadius: 5
    },

    profileImageContainer: {
        position: "relative",
        marginRight: 15,
        marginBottom: 10
    },

    profileImage: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: "#F0F0F0"
    },

    profileImagePlaceholder: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: "#F0F0F0",
        justifyContent: "center",
        alignItems: "center"
    },

    verifiedBadge: {
        position: "absolute",
        right: -8,
        bottom: -5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF"
    },

    verifiedBadgeSuccess: {
        backgroundColor: "#2E9B4B"
    },

    verifiedBadgeWarning: {
        backgroundColor: "#E67E22"
    },

    verifiedText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700"
    },

    profileInfo: {
        flex: 1
    },

    profileName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#222",
        marginBottom: 4
    },

    profileRole: {
        fontSize: 14,
        color: "#777",
        marginBottom: 12
    },

    profileDetails: {
        flexDirection: "row",
        alignItems: "center"
    },

    detailItem: {
        flex: 1
    },

    detailLabel: {
        fontSize: 11,
        color: "#999",
        marginBottom: 3
    },

    detailValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333"
    },

    verticalLine: {
        width: 1,
        height: 30,
        backgroundColor: "#E5E5E5",
        marginHorizontal: 15
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#222",
        marginBottom: 5
    },

    sectionSubtitle: {
        fontSize: 13,
        color: "#888"
    },

    seeAll: {
        fontSize: 14,
        fontWeight: "700",
        color: "#B64216"
    },

    eventCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 15,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.06,
        shadowRadius: 4
    },

    eventDate: {
        width: 60,
        height: 68,
        borderRadius: 14,
        backgroundColor: "#FFE2D2",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14
    },

    eventMonth: {
        fontSize: 11,
        fontWeight: "700",
        color: "#B64216"
    },

    eventDay: {
        fontSize: 25,
        fontWeight: "800",
        color: "#333"
    },

    eventInfo: {
        flex: 1
    },

    eventTag: {
        alignSelf: "flex-start",
        backgroundColor: "#FFE7DA",
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginBottom: 6
    },

    eventTagText: {
        fontSize: 9,
        fontWeight: "800",
        color: "#B64216"
    },

    eventTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#222",
        marginBottom: 5
    },

    eventMeta: {
        fontSize: 12,
        color: "#777",
        marginBottom: 2
    },

    eventArrow: {
        fontSize: 30,
        color: "#999",
        marginLeft: 8
    },

    noEventCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 25,
        alignItems: "center",
        marginBottom: 28
    },

    noEventText: {
        color: "#888",
        fontSize: 14
    },

    quickGrid: {
        flexDirection: "row",
        gap: 12,
        marginTop: 10,
        marginBottom: 25
    },

    quickCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.06,
        shadowRadius: 4
    },

    quickIconOrange: {
        width: 45,
        height: 45,
        borderRadius: 13,
        backgroundColor: "#FFE5D7",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12
    },

    quickIconBlue: {
        width: 45,
        height: 45,
        borderRadius: 13,
        backgroundColor: "#E1EEFF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12
    },

    quickTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#333",
        marginBottom: 5
    },

    quickText: {
        fontSize: 12,
        color: "#888",
        lineHeight: 17
    },

    logoutButton: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 30,
        borderWidth: 1,
        borderColor: "#F0D9CE"
    },

    logoutIcon: {
        width: 45,
        height: 45,
        borderRadius: 13,
        backgroundColor: "#FFE8DF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },

    logoutIconText: {
        fontSize: 22,
        color: "#B64216"
    },

    logoutContent: {
        flex: 1
    },

    logoutTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#333",
        marginBottom: 4
    },

    logoutText: {
        fontSize: 12,
        color: "#888"
    },

    logoutArrow: {
        fontSize: 22,
        color: "#999"
    },

    footer: {
        alignItems: "center",
        paddingVertical: 20,
        marginBottom: 20
    },

    footerEmoji: {
        fontSize: 22,
        marginBottom: 8
    },

    footerText: {
        fontSize: 14,
        color: "#777",
        marginBottom: 5
    },

    footerSmall: {
        fontSize: 12,
        fontWeight: "700",
        color: "#B64216"
    },

    bottomNav: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 75,
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#F0E5DE",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2
        },
        shadowOpacity: 0.08,
        shadowRadius: 5
    },

    navItem: {
        alignItems: "center",
        justifyContent: "center",
        width: 70
    },

    navIcon: {
        fontSize: 21,
        marginBottom: 3
    },

    navIconActive: {
        fontSize: 21,
        marginBottom: 3
    },

    navText: {
        fontSize: 10,
        color: "#888"
    },

    navTextActive: {
        fontSize: 10,
        color: "#B64216",
        fontWeight: "700"
    }

});