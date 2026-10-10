import {
    STORE_DATA,
    FETCH_DATA,
    UPDATE_DATA
} from "./action";

const initialState = {
    user: null,
    events: []
};

const reducer = (state = initialState, action) => {

    switch (action.type) {

        case STORE_DATA:
        case FETCH_DATA:
        case UPDATE_DATA:

            return {
                user: action.payload.user,
                events: action.payload.events
            };

        default:
            return state;
    }
};

export default reducer;