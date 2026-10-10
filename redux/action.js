export const STORE_DATA = "STORE_DATA";
export const FETCH_DATA = "FETCH_DATA";
export const UPDATE_DATA = "UPDATE_DATA";

const action = ({ data, type }) => {

    let action = {};

    if (type === "storedata") {
        action = {
            type: STORE_DATA,
            payload: data
        };
    }

    else if (type === "fetchdata") {
        action = {
            type: FETCH_DATA,
            payload: data
        };
    }

    else if (type === "updatedata") {
        action = {
            type: UPDATE_DATA,
            payload: data
        };
    }

    return action;
};

export default action;