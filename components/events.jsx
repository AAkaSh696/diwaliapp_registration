import React, { useCallback, useState } from 'react';
// import { BASE_URL } from '@env';

import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import action from '../redux/action';

const BASE_URL = "";
export default function Events() {
   
    const dispatch = useDispatch();

    const user = useSelector(
        state => state.user
    );

    const events = useSelector(
        state => state.events || []
    );

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    /*
     * Event selected for viewing
     */
    const [selectedEvent, setSelectedEvent] = useState(null);


    /*
     * Fetch all events from backend
     */

    const fetchEvents = async (showLoader = false) => {

        try {

            if (showLoader) {
                setLoading(true);
            }

            const response = await fetch(
                `${BASE_URL}/admin/getadminupdates`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                    },

                    body: JSON.stringify({}),
                }
            );

            if (!response.ok) {

                throw new Error(
                    `Server returned ${response.status}`
                );

            }

            const result = await response.json();

            console.log(
                'Events response:',
                result
            );

            const eventList =
                Array.isArray(result)
                    ? result
                    : Array.isArray(result?.data)
                        ? result.data
                        : [];


            /*
             * Newest events first
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
             * Remove inactive and expired events
             */

            const activeEvents =
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


            /*
             * Replace events in Redux
             */

            dispatch(
                action({
                    type: 'updatedata',

                    data: {
                        user: user,
                        events: activeEvents,
                    },
                })
            );

        } catch (error) {

            console.log(
                'Error fetching events:',
                error
            );

        } finally {

            if (showLoader) {
                setLoading(false);
            }

        }

    };


    /*
     * Fetch fresh events whenever
     * Events screen gets focus.
     */

    useFocusEffect(
        useCallback(() => {

            fetchEvents(true);

        }, [user])
    );


    /*
     * Pull to refresh
     */

    const onRefresh = async () => {

        try {

            setRefreshing(true);

            await fetchEvents(false);

        } finally {

            setRefreshing(false);

        }

    };


    /*
     * Open event inside this page
     */

    const openEvent = (event) => {

        setSelectedEvent(event);

    };


    /*
     * Close event view
     */

    const closeEvent = () => {

        setSelectedEvent(null);

    };


    /*
     * Initial loading
     */

    if (loading && events.length === 0) {

        return (

            <SafeAreaView
                style={styles.container}
            >

                <View
                    style={styles.loadingContainer}
                >

                    <ActivityIndicator
                        size="large"
                    />

                    <Text
                        style={styles.loadingText}
                    >
                        Loading events...
                    </Text>

                </View>

            </SafeAreaView>

        );

    }


    return (

        <SafeAreaView
            style={styles.container}
        >

            <ScrollView

                showsVerticalScrollIndicator={false}

                contentContainerStyle={
                    styles.content
                }

                refreshControl={

                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />

                }

            >

                {/* ================= HEADER ================= */}

                <View style={styles.header}>

                    <Text style={styles.title}>
                        Events
                    </Text>

                    <Text style={styles.subtitle}>
                        Stay updated with the latest events
                    </Text>

                </View>


                {/* ================= EVENTS ================= */}

                {events.length > 0 ? (

                    events.map((event, index) => (

                        <EventCard
                            key={
                                event?._id ||
                                event?.id ||
                                index
                            }

                            event={event}

                            onViewEvent={
                                openEvent
                            }

                        />

                    ))

                ) : (

                    <View
                        style={styles.emptyContainer}
                    >

                        <Text
                            style={styles.emptyTitle}
                        >
                            No Events
                        </Text>

                        <Text
                            style={styles.emptyText}
                        >
                            There are no active events
                            at the moment.
                        </Text>

                    </View>

                )}

            </ScrollView>


            {/* =================================================
                EVENT DETAILS MODAL
            ================================================= */}

            <Modal

                visible={
                    selectedEvent !== null
                }

                animationType="slide"

                transparent={false}

                onRequestClose={
                    closeEvent
                }

            >

                <SafeAreaView
                    style={styles.modalContainer}
                >

                    <ScrollView
                        showsVerticalScrollIndicator={
                            false
                        }
                    >

                        {/* ================= TOP BAR ================= */}

                        <View
                            style={styles.modalHeader}
                        >

                            <TouchableOpacity
                                onPress={
                                    closeEvent
                                }
                                style={
                                    styles.backButton
                                }
                            >

                                <Text
                                    style={
                                        styles.backButtonText
                                    }
                                >
                                    ←
                                </Text>

                            </TouchableOpacity>


                            <Text
                                style={
                                    styles.modalHeaderTitle
                                }
                            >
                                Event Details
                            </Text>


                            <View
                                style={
                                    styles.headerSpacer
                                }
                            />

                        </View>


                        {/* ================= EVENT IMAGE ================= */}

                        {selectedEvent?.imageUrl ? (

                            <Image
                                source={{
                                    uri:
                                        selectedEvent.imageUrl,
                                }}

                                style={
                                    styles.modalImage
                                }
                            />

                        ) : (

                            <View
                                style={
                                    styles.modalImagePlaceholder
                                }
                            >

                                <Text
                                    style={
                                        styles.modalPlaceholderText
                                    }
                                >
                                    EVENT
                                </Text>

                            </View>

                        )}


                        {/* ================= DETAILS ================= */}

                        <View
                            style={
                                styles.modalContent
                            }
                        >

                            {/* Highlight */}

                            {selectedEvent?.highlight ? (

                                <View
                                    style={
                                        styles.modalHighlightContainer
                                    }
                                >

                                    <Text
                                        style={
                                            styles.modalHighlight
                                        }
                                    >
                                        {
                                            selectedEvent.highlight
                                        }
                                    </Text>

                                </View>

                            ) : null}


                            {/* Title */}

                            <Text
                                style={
                                    styles.modalTitle
                                }
                            >
                                {
                                    selectedEvent?.title ||
                                    'Untitled Event'
                                }
                            </Text>


                            {/* Event date/info */}

                            {selectedEvent?.event ? (

                                <View
                                    style={
                                        styles.modalInfoRow
                                    }
                                >

                                    <Text
                                        style={
                                            styles.modalIcon
                                        }
                                    >
                                        📅
                                    </Text>

                                    <Text
                                        style={
                                            styles.modalInfoText
                                        }
                                    >
                                        {
                                            selectedEvent.event
                                        }
                                    </Text>

                                </View>

                            ) : null}


                            {/* Description */}

                            {selectedEvent?.info ? (

                                <View
                                    style={
                                        styles.descriptionContainer
                                    }
                                >

                                    <Text
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        About this event
                                    </Text>

                                    <Text
                                        style={
                                            styles.modalDescription
                                        }
                                    >
                                        {
                                            selectedEvent.info
                                        }
                                    </Text>

                                </View>

                            ) : null}


                            {/* Published date */}

                            {selectedEvent?.publishedAt ? (

                                <View
                                    style={
                                        styles.publishedContainer
                                    }
                                >

                                    <Text
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        Published
                                    </Text>

                                    <Text
                                        style={
                                            styles.publishedText
                                        }
                                    >
                                        {
                                            formatDate(
                                                selectedEvent.publishedAt
                                            )
                                        }
                                    </Text>

                                </View>

                            ) : null}


                            {/* Expiry */}

                            {selectedEvent?.expiresAt ? (

                                <View
                                    style={
                                        styles.publishedContainer
                                    }
                                >

                                    <Text
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        Valid Until
                                    </Text>

                                    <Text
                                        style={
                                            styles.publishedText
                                        }
                                    >
                                        {
                                            formatDate(
                                                selectedEvent.expiresAt
                                            )
                                        }
                                    </Text>

                                </View>

                            ) : null}


                        </View>

                    </ScrollView>

                </SafeAreaView>

            </Modal>

        </SafeAreaView>

    );

}


/* =====================================================
   EVENT CARD
===================================================== */

function EventCard({
    event,
    onViewEvent,
}) {

    return (

        <View style={styles.card}>

            {/* ================= IMAGE ================= */}

            {event?.imageUrl ? (

                <Image
                    source={{
                        uri: event.imageUrl,
                    }}

                    style={
                        styles.eventImage
                    }
                />

            ) : (

                <View
                    style={
                        styles.imagePlaceholder
                    }
                >

                    <Text
                        style={
                            styles.placeholderText
                        }
                    >
                        EVENT
                    </Text>

                </View>

            )}


            {/* ================= CONTENT ================= */}

            <View
                style={
                    styles.cardContent
                }
            >

                {/* Highlight */}

                {event?.highlight ? (

                    <View
                        style={
                            styles.highlightContainer
                        }
                    >

                        <Text
                            style={
                                styles.highlight
                            }
                        >
                            {
                                event.highlight
                            }
                        </Text>

                    </View>

                ) : null}


                {/* Title */}

                <Text
                    style={
                        styles.eventTitle
                    }
                >

                    {
                        event?.title ||
                        'Untitled Event'
                    }

                </Text>


                {/* Event Information */}

                {event?.event ? (

                    <View
                        style={
                            styles.eventRow
                        }
                    >

                        <Text
                            style={
                                styles.icon
                            }
                        >
                            📅
                        </Text>

                        <Text
                            style={
                                styles.eventText
                            }
                        >
                            {
                                event.event
                            }
                        </Text>

                    </View>

                ) : null}


                {/* Description */}

                {event?.info ? (

                    <Text
                        style={
                            styles.info
                        }

                        numberOfLines={4}
                    >
                        {
                            event.info
                        }
                    </Text>

                ) : null}


                {/* Published Date */}

                {event?.publishedAt ? (

                    <Text
                        style={
                            styles.date
                        }
                    >

                        Published on{' '}

                        {
                            formatDate(
                                event.publishedAt
                            )
                        }

                    </Text>

                ) : null}


                {/* View Event */}

                <TouchableOpacity

                    style={
                        styles.button
                    }

                    onPress={() =>
                        onViewEvent(event)
                    }

                    activeOpacity={0.8}

                >

                    <Text
                        style={
                            styles.buttonText
                        }
                    >
                        View Event
                    </Text>

                    <Text
                        style={
                            styles.arrow
                        }
                    >
                        →
                    </Text>

                </TouchableOpacity>

            </View>

        </View>

    );

}


/* =====================================================
   DATE FORMATTER
===================================================== */

function formatDate(date) {

    try {

        return new Date(date)
            .toLocaleDateString(
                'en-IN',
                {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                }
            );

    } catch (error) {

        return '';

    }

}


/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5F7FB',
    },


    content: {
        padding: 20,
        paddingBottom: 40,
    },


    /* ================= HEADER ================= */

    header: {
        marginBottom: 22,
    },


    title: {
        fontSize: 30,
        fontWeight: '700',
        color: '#111827',
    },


    subtitle: {
        marginTop: 5,
        fontSize: 15,
        color: '#6B7280',
    },


    /* ================= LOADING ================= */

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },


    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },


    /* ================= CARD ================= */

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',

        elevation: 4,

        shadowColor: '#000',

        shadowOffset: {
            width: 0,
            height: 3,
        },

        shadowOpacity: 0.08,

        shadowRadius: 8,
    },


    /* ================= IMAGE ================= */

    eventImage: {
        width: '100%',
        height: 190,
        resizeMode: 'cover',
    },


    imagePlaceholder: {
        width: '100%',
        height: 190,

        backgroundColor: '#E5E7EB',

        alignItems: 'center',
        justifyContent: 'center',
    },


    placeholderText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 2,
    },


    /* ================= CONTENT ================= */

    cardContent: {
        padding: 18,
    },


    /* ================= HIGHLIGHT ================= */

    highlightContainer: {
        alignSelf: 'flex-start',

        backgroundColor: '#EEF2FF',

        paddingHorizontal: 10,
        paddingVertical: 5,

        borderRadius: 8,

        marginBottom: 10,
    },


    highlight: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
    },


    /* ================= TITLE ================= */

    eventTitle: {
        fontSize: 21,
        fontWeight: '700',

        color: '#111827',

        lineHeight: 28,

        marginBottom: 10,
    },


    /* ================= EVENT ================= */

    eventRow: {
        flexDirection: 'row',
        alignItems: 'center',

        marginBottom: 10,
    },


    icon: {
        fontSize: 16,
        marginRight: 8,
    },


    eventText: {
        flex: 1,

        fontSize: 14,

        fontWeight: '600',

        color: '#374151',
    },


    /* ================= INFO ================= */

    info: {
        fontSize: 14,

        color: '#6B7280',

        lineHeight: 21,

        marginBottom: 12,
    },


    /* ================= DATE ================= */

    date: {
        fontSize: 12,

        color: '#9CA3AF',

        marginBottom: 15,
    },


    /* ================= BUTTON ================= */

    button: {
        height: 45,

        borderRadius: 12,

        backgroundColor: '#111827',

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',
    },


    buttonText: {
        color: '#FFFFFF',

        fontSize: 15,

        fontWeight: '600',
    },


    arrow: {
        color: '#FFFFFF',

        fontSize: 20,

        marginLeft: 8,
    },


    /* ================= EMPTY ================= */

    emptyContainer: {
        backgroundColor: '#FFFFFF',

        borderRadius: 20,

        padding: 35,

        alignItems: 'center',

        marginTop: 20,
    },


    emptyTitle: {
        fontSize: 20,

        fontWeight: '700',

        color: '#111827',
    },


    emptyText: {
        marginTop: 8,

        fontSize: 14,

        color: '#6B7280',

        textAlign: 'center',
    },


    /* =================================================
       MODAL
    ================================================= */

    modalContainer: {
        flex: 1,
        backgroundColor: '#F5F7FB',
    },


    modalHeader: {
        height: 60,

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'space-between',

        paddingHorizontal: 18,

        backgroundColor: '#FFFFFF',

        borderBottomWidth: 1,

        borderBottomColor: '#E5E7EB',
    },


    backButton: {
        width: 42,
        height: 42,

        borderRadius: 21,

        alignItems: 'center',
        justifyContent: 'center',

        backgroundColor: '#F3F4F6',
    },


    backButtonText: {
        fontSize: 25,
        color: '#111827',
        marginTop: -2,
    },


    modalHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },


    headerSpacer: {
        width: 42,
    },


    /* ================= MODAL IMAGE ================= */

    modalImage: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },


    modalImagePlaceholder: {
        width: '100%',
        height: 250,

        backgroundColor: '#E5E7EB',

        alignItems: 'center',
        justifyContent: 'center',
    },


    modalPlaceholderText: {
        fontSize: 26,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 2,
    },


    /* ================= MODAL CONTENT ================= */

    modalContent: {
        padding: 22,
        paddingBottom: 50,
    },


    modalHighlightContainer: {
        alignSelf: 'flex-start',

        backgroundColor: '#EEF2FF',

        paddingHorizontal: 12,
        paddingVertical: 6,

        borderRadius: 8,

        marginBottom: 12,
    },


    modalHighlight: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
    },


    modalTitle: {
        fontSize: 28,
        fontWeight: '700',

        color: '#111827',

        lineHeight: 36,

        marginBottom: 18,
    },


    modalInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',

        backgroundColor: '#FFFFFF',

        padding: 15,

        borderRadius: 14,

        marginBottom: 20,
    },


    modalIcon: {
        fontSize: 18,
        marginRight: 10,
    },


    modalInfoText: {
        flex: 1,

        fontSize: 15,
        fontWeight: '600',

        color: '#374151',

        lineHeight: 22,
    },


    /* ================= DESCRIPTION ================= */

    descriptionContainer: {
        marginBottom: 22,
    },


    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',

        color: '#111827',

        marginBottom: 8,
    },


    modalDescription: {
        fontSize: 15,

        color: '#4B5563',

        lineHeight: 24,
    },


    /* ================= PUBLISHED ================= */

    publishedContainer: {
        backgroundColor: '#FFFFFF',

        borderRadius: 14,

        padding: 15,

        marginBottom: 12,
    },


    publishedText: {
        fontSize: 14,
        color: '#6B7280',
    },

});
