import { IObsSession } from "../components/Types";
import axios from "axios";

class Api {
    public static getObsSessions() {
        return axios.get<IObsSession[]>("http://localhost:50995/api/obsSessions/");
    }

    public static addObsSession(obsSession: IObsSession) {
    }

    public static updateObsSession(obsSession: IObsSession) {
    }

    public static deleteObsSession(obsSession: IObsSession) {
    }
}

export default Api;