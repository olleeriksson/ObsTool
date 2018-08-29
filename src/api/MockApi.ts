import delay from "./delay";
import { IObsSession } from "../components/Types";

// This file mocks a web API by working with the hard-coded data below.
// It uses setTimeout to simulate the delay of an AJAX call.
// All calls return promises.
const obsSessions: IObsSession[] =
    [
        {
            id: 4,
            date: "2017-12-18",
            location: undefined,
            title: "Coldest night of the year",
            summary: "A summary for session 4",
            conditions: "Some conditions",
            seeing: 1,
            transparency: 4,
            limitingMagnitude: 5.5,
            observations: [],
            reportText: ""
        },
        {
            id: 6,
            date: "2018-07-30",
            location: undefined,
            title: "A new name 23kkxcz",
            summary: "ljlkj",
            conditions: "lkjldskjf",
            seeing: undefined,
            transparency: undefined,
            limitingMagnitude: undefined,
            observations: [],
            reportText: ""
        }
    ];

//This would be performed on the server in a real app. Just stubbing in.
// const generateId = (author) => {
//   return author.firstName.toLowerCase() + "-" + author.lastName.toLowerCase();
// };

class Api {

    public static getObsSessions(): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(
                () => {
                    resolve({data: obsSessions});
                },
                delay
            );
        });
    }

    public static addObsSession(obsSession: IObsSession) {
        obsSession = Object.assign({}, obsSession); // to avoid manipulating object passed in.
        return new Promise((resolve, reject) => {
            setTimeout(
                () => {
                    // Simulate server-side validation
                    resolve({ data: obsSession });
                },
                delay
            );
        });
    }

    public static updateObsSession(obsSession: IObsSession) {
        return new Promise((resolve, reject) => {
            setTimeout(
                () => {
                    const indexOfobsSession = obsSessions.findIndex(s => s.id === obsSession.id);
                    obsSessions[indexOfobsSession] = obsSession;
                    resolve({ data: obsSessions });
                },
                delay
            );
        });
    }

    public static deleteObsSession(obsSession: IObsSession) {
        return new Promise((resolve, reject) => {
            setTimeout(
                () => {
                    const indexOfObsSession = obsSessions.findIndex((s) => s.id === obsSession.id);
                    obsSessions.splice(indexOfObsSession, 1);
                    resolve();
                },
                delay
            );
        });
    }
}

export default Api;