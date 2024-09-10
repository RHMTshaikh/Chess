import { authorization } from "../Use-Cases";
import makeAuthorizUser from "./authorizUser";

const authorizUser = makeAuthorizUser({ authorization });

export {
    authorizUser
};